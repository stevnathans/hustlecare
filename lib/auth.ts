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
import { sendEmail } from '@/lib/email';
import WelcomeEmail from '@/emails/WelcomeEmail';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
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
          throw new Error('Invalid email or password');
        }

        const email = credentials.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
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
      if (account?.provider === "google") {
        const email = user.email || profile?.email;
        if (!email) return false;

        (user as any).role = 'user';
        (user as any).vendorId = null;

        try {
          // Check if this is a brand new user BEFORE upserting
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });
          const isNewUser = !existingUser;

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

          if (!dbUser.isActive) return false;

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

          // Send welcome email only on first-ever Google sign-in.
          // Fire and forget — never block auth flow for email failure.
          if (isNewUser) {
            sendEmail({
              to: dbUser.email,
              subject: 'Welcome to HustleCare 🚀',
              react: WelcomeEmail({ name: dbUser.name }),
              type: 'WELCOME',
              userId: dbUser.id,
            }).catch((err) =>
              console.error('[email] Google welcome email failed for', dbUser.id, err?.message)
            );
          }

          return true;

        } catch (error) {
          console.error("Sign-in DB error:", (error as Error).message);
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
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
};