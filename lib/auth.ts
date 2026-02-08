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
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;
        return safeUser as User;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("\n\n========================================");
      console.log("🔐 SIGN IN CALLBACK TRIGGERED");
      console.log("========================================");
      console.log("Provider:", account?.provider);
      console.log("User email:", user?.email);
      console.log("Profile email:", profile?.email);
      console.log("Account type:", account?.type);
      console.log("========================================\n");
      
      if (account?.provider === "google") {
        const email = user.email || profile?.email;
        
        if (!email) {
          console.error("❌ FATAL: No email provided by Google");
          return false;
        }

        try {
          console.log("🔍 Looking for user in database:", email);
          
          let dbUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!dbUser) {
            console.log("📝 User not found - creating new user");
            dbUser = await prisma.user.create({
              data: {
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
            console.log("✅ New user created with ID:", dbUser.id);
            console.log("   Role:", dbUser.role);
            console.log("   Active:", dbUser.isActive);
          } else {
            console.log("✅ Existing user found with ID:", dbUser.id);
            console.log("   Role:", dbUser.role);
            console.log("   Active:", dbUser.isActive);
            
            if (!dbUser.isActive) {
              console.error("❌ FATAL: User account is inactive");
              return false;
            }
            
            console.log("📝 Updating last login timestamp");
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { lastLoginAt: new Date() }
            });
          }
          
          // Check for existing account link
          console.log("🔍 Checking for existing account link");
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });

          if (!existingAccount) {
            console.log("🔗 Creating new account link");
            await prisma.account.create({
              data: {
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
            console.log("✅ Account link created");
          } else {
            console.log("✅ Account link already exists");
          }
          
          user.id = dbUser.id;
          (user as any).role = dbUser.role;
          
          console.log("========================================");
          console.log("✅ SIGN IN CALLBACK: SUCCESS");
          console.log("========================================\n\n");
          return true;
        } catch (error) {
          console.error("\n========================================");
          console.error("❌ SIGN IN CALLBACK: ERROR");
          console.error("========================================");
          console.error("Error details:", error);
          console.error("========================================\n\n");
          return false;
        }
      }
      
      console.log("ℹ️  Non-Google provider, allowing sign in");
      return true;
    },
    
    async jwt({ token, user }) {
      console.log("\n--- JWT CALLBACK ---");
      
      if (user) {
        console.log("💾 First time JWT - storing user data");
        console.log("   User ID:", user.id);
        console.log("   Email:", user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = (user as any).role || 'user';
        console.log("   Role stored:", token.role);
      }

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
            console.log("   Fresh role from DB:", token.role);
          }
        } catch (error) {
          console.error("   Error fetching user:", error);
        }
      }
      
      console.log("--- JWT CALLBACK END ---\n");
      return token;
    },
    
    async session({ session, token }) {
      console.log("\n--- SESSION CALLBACK ---");
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any || 'user';
        session.user.name = token.name as string || '';
        session.user.email = token.email as string || '';
        session.user.image = token.image as string || '';
        console.log("   Session role:", session.user.role);
      }
      console.log("--- SESSION CALLBACK END ---\n");
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
};