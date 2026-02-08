/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth.ts
import { getServerSession } from "next-auth";
import type { NextAuthOptions, User, Session } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'database', // Changed from 'jwt' to 'database' for better OAuth support
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
      },
      allowDangerousEmailAccountLinking: true,
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
      console.log("=== SIGN IN CALLBACK START ===");
      console.log("User email:", user.email);
      console.log("Provider:", account?.provider);
      
      if (account?.provider === "google" && profile?.email) {
        try {
          let existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          if (!existingUser) {
            if (!profile.name) {
              console.error("Google profile missing name field");
              throw new Error('Google profile is missing required name field');
            }

            console.log("Creating new user for:", profile.email);
            
            existingUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                image: (profile.image as string) || null,
                emailVerified: new Date(),
                role: 'user',
                emailNotifications: true,
                pushNotifications: false,
                marketingEmails: true,
                isActive: true,
              },
            });
            
            console.log("New user created with ID:", existingUser.id);
          } else {
            console.log("User already exists:", profile.email);
            console.log("User role:", existingUser.role);
            console.log("User isActive:", existingUser.isActive);
            
            // Check if user is active
            if (!existingUser.isActive) {
              console.error("User account is inactive");
              return false;
            }
            
            // Update last login and profile info
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { 
                lastLoginAt: new Date(),
                name: profile.name || existingUser.name,
                image: (profile.image as string) || existingUser.image,
              }
            });
            
            console.log("User updated successfully");
            
            // Update user object with existing user ID
            if (user) {
              user.id = existingUser.id;
            }
          }
          
          console.log("=== SIGN IN CALLBACK SUCCESS ===");
          return true;
        } catch (error) {
          console.error("=== SIGN IN CALLBACK ERROR ===");
          console.error("Error details:", error);
          return false;
        }
      }
      
      console.log("=== SIGN IN CALLBACK END (non-Google) ===");
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK ===");
      console.log("URL:", url);
      console.log("Base URL:", baseUrl);
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        const redirectUrl = `${baseUrl}${url}`;
        console.log("Redirecting to (relative):", redirectUrl);
        return redirectUrl;
      }
      
      // Allows callback URLs on the same origin
      try {
        const urlObj = new URL(url);
        if (urlObj.origin === baseUrl) {
          console.log("Redirecting to (same origin):", url);
          return url;
        }
      } catch (e) {
        console.error("Error parsing URL:", e);
      }
      
      // Default to base URL
      console.log("Redirecting to (default):", baseUrl);
      return baseUrl;
    },
    
    async session({ session, user }: { session: Session; user: any }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Session user email:", session.user?.email);
      console.log("DB user ID:", user?.id);
      
      // With database sessions, user comes from database
      if (user && session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.name = user.name;
        session.user.email = user.email;
        session.user.image = user.image;
        
        console.log("Session updated with role:", user.role);
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable detailed logging
  events: {
    async signIn(message) {
      console.log("✅ SIGN IN EVENT - User:", message.user.email);
    },
    async signOut(message) {
      console.log("🚪 SIGN OUT EVENT");
    },
    async createUser(message) {
      console.log("👤 CREATE USER EVENT - User:", message.user.email);
    },
    async linkAccount(message) {
      console.log("🔗 LINK ACCOUNT EVENT - User:", message.user.email);
    },
    async session(message) {
      console.log("📋 SESSION EVENT");
    },
  },
};

export const getCurrentUser = async () => {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
};