/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth.ts
import { getServerSession } from "next-auth";
import type { NextAuthOptions, User, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // FIX: Reduced from 30 days to 8 hours. A 30-day session means a stolen
    // token is valid for a month. Since roles are re-fetched from DB on every
    // JWT callback anyway, a short maxAge costs nothing and limits exposure.
    maxAge: 8 * 60 * 60,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          // FIX: Generic error message. Previously distinct messages revealed
          // whether an email existed ("No user found with this email") which
          // enables user enumeration attacks.
          throw new Error('Invalid email or password');
        }

        // FIX: Normalize email to lowercase before lookup so
        // User@Example.com and user@example.com resolve to the same account.
        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        // FIX: Unified "Invalid email or password" for all failure cases —
        // missing user, missing password (social account), wrong password.
        // Previously each had a distinct message that leaked account info.
        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          // This one is intentionally distinct — it's not an enumeration risk,
          // it's actionable information the real account owner needs.
          throw new Error('Account is inactive. Please contact support.');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid email or password');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        const { password, ...safeUser } = user;
        return safeUser as User;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // FIX: Removed console.log statements that logged user emails and
      // provider info. These appear in Vercel function logs which may be
      // accessible to team members who shouldn't see user PII.
      if (account?.provider === "google") {
        const email = user.email || profile?.email;

        if (!email) {
          return false;
        }

        (user as any).role = 'user';
        (user as any).vendorId = null;

        try {
          const dbUser = await prisma.user.upsert({
            where: { email },
            update: {
              lastLoginAt: new Date(),
              name: user.name || (profile as any)?.name || undefined,
              image: user.image || (profile as any)?.picture || undefined,
            },
            create: {
              email,
              name: user.name || (profile as any)?.name || email.split('@')[0],
              image: user.image || (profile as any)?.picture || null,
              emailVerified: new Date(),
              role: 'user',
              isActive: true,
              emailNotifications: true,
              pushNotifications: false,
              marketingEmails: true,
            },
          });

          if (!dbUser.isActive) {
            return false;
          }

          await prisma.account.upsert({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
            update: {
              access_token: account.access_token,
              expires_at: account.expires_at,
              id_token: account.id_token,
              refresh_token: account.refresh_token,
            },
            create: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
              refresh_token: account.refresh_token,
            },
          });

          user.id = dbUser.id;
          (user as any).role = dbUser.role;

          if (dbUser.role === 'vendor') {
            const vendor = await prisma.vendor.findUnique({
              where: { userId: dbUser.id },
              select: { id: true },
            });
            (user as any).vendorId = vendor?.id ?? null;
          }

          return true;

        } catch (error) {
          // FIX: Log error without PII. Previously logged the full error
          // object which may contain email addresses or query details.
          console.error("Sign-in DB error:", (error as Error).message);
          // FIX: Return false instead of true on DB failure.
          // Previously allowed sign-in even when the DB upsert failed,
          // meaning a user could get a JWT with stale/default role data.
          // It's safer to fail closed and show an error than to issue a
          // token with potentially wrong role ('user' default).
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = (user as any).role || 'user';
        token.vendorId = (user as any).vendorId ?? null;
      }

      // Re-fetch from DB on every request to keep role/isActive current.
      // This is already correct and addresses the stale JWT role issue
      // flagged in the proxy.ts audit.
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              role: true,
              isActive: true,
              name: true,
              image: true,
              email: true,
              vendorProfile: { select: { id: true } },
            },
          });

          if (dbUser) {
            // FIX: If user has been deactivated, invalidate the token
            // by returning an empty/null signal. Previously an inactive
            // user with a valid JWT could continue making requests
            // indefinitely until their token expired.
            if (!dbUser.isActive) {
              return { ...token, invalidated: true };
            }

            token.id = dbUser.id;
            token.role = dbUser.role as any;
            token.isActive = dbUser.isActive;
            token.vendorId = dbUser.vendorProfile?.id ?? null;
          }
        } catch (error) {
          console.error("JWT callback DB error:", (error as Error).message);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // FIX: Reject invalidated tokens (deactivated accounts).
      // Return a session with no user so the client treats it as logged out.
      if ((token as any).invalidated) {
        return { ...session, user: undefined as any };
      }

      if (token && session.user) {
        const user = session.user as any;
        user.id = token.id as string;
        user.role = (token.role as any) || 'user';
        user.name = (token.name as string) || '';
        user.email = (token.email as string) || '';
        user.image = (token.image as string) || '';
        user.vendorId = token.vendorId as number | null | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // FIX: Explicitly disable debug in production. Previously relied on
  // NODE_ENV check but making it explicit prevents accidental enabling.
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
};