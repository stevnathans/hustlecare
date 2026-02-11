/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth.ts - PRODUCTION VERSION with Robust Error Handling
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
    maxAge: 30 * 24 * 60 * 60,
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
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        if (!user.password) {
          throw new Error('This account was registered using a social provider. Please sign in with Google.');
        }

        if (!user.isActive) {
          throw new Error('Account is inactive');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
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
      console.log("🔐 SIGN IN CALLBACK - Provider:", account?.provider);
      
      if (account?.provider === "google") {
        const email = user.email || profile?.email;
        
        if (!email) {
          console.error("❌ No email from Google");
          return false;
        }

        // Set defaults in case database operations fail
        (user as any).role = 'user';
        
        try {
          console.log("📊 Attempting database operations for:", email);
          
          // Try to find or create user
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
          
          console.log("✅ User upserted:", dbUser.id);
          
          if (!dbUser.isActive) {
            console.error("❌ Account is inactive");
            return false;
          }
          
          // Try to link account
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
          
          console.log("✅ Account linked");
          
          // Store user data for JWT
          user.id = dbUser.id;
          (user as any).role = dbUser.role;
          
          console.log("✅ Sign in successful with database");
          return true;
          
        } catch (error) {
          console.error("⚠️ Database operation failed:", error);
          console.error("Error details:", (error as Error).message);
          console.log("⚠️ Continuing with JWT-only session (database operations failed)");
          
          // Allow sign-in even if database fails
          // User will have a JWT-based session but won't be in database
          // This is better than complete authentication failure
          return true;
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
      }

      // Refresh user data from database on each request
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { id: true, role: true, isActive: true, name: true, image: true, email: true }
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role as any;
            token.isActive = dbUser.isActive;
          }
        } catch (error) {
          console.error("⚠️ Error fetching user in JWT callback:", error);
          // Continue with existing token data if database query fails
        }
      }
      
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any || 'user';
        session.user.name = token.name as string || '';
        session.user.email = token.email as string || '';
        session.user.image = token.image as string || '';
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
};