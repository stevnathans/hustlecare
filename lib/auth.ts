/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth.ts
import { getServerSession } from "next-auth";
import type { NextAuthOptions, User, Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { compare } from 'bcrypt';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
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
      console.log("=== SIGN IN CALLBACK ===");
      console.log("Provider:", account?.provider);
      console.log("User email:", user?.email);
      
      if (account?.provider === "google") {
        try {
          const email = user.email || profile?.email;
          if (!email) {
            console.error("No email provided");
            return false;
          }

          let existingUser = await prisma.user.findUnique({
            where: { email },
          });

          if (!existingUser) {
            console.log("Creating new user:", email);
            
            existingUser = await prisma.user.create({
              data: {
                email,
                name: user.name || profile?.name || email.split('@')[0],
                image: user.image || (profile as any)?.picture || null,
                emailVerified: new Date(),
                role: 'user',
                emailNotifications: true,
                pushNotifications: false,
                marketingEmails: true,
                isActive: true,
              },
            });
            
            console.log("User created with ID:", existingUser.id);
          } else {
            console.log("Existing user found:", email);
            console.log("User role:", existingUser.role);
            console.log("User active:", existingUser.isActive);
            
            if (!existingUser.isActive) {
              console.error("User is inactive");
              return false;
            }
            
            // Update last login
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() }
            });
          }
          
          // Set the user ID
          user.id = existingUser.id;
          
          console.log("Sign in successful");
          return true;
        } catch (error) {
          console.error("Error in sign in callback:", error);
          return false;
        }
      }
      
      return true;
    },
    
    async redirect({ url, baseUrl }) {
      console.log("=== REDIRECT CALLBACK ===");
      console.log("URL:", url);
      console.log("BaseURL:", baseUrl);
      
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      
      // Handle same-origin URLs
      try {
        const urlObj = new URL(url);
        const baseUrlObj = new URL(baseUrl);
        
        if (urlObj.origin === baseUrlObj.origin) {
          return url;
        }
      } catch (error) {
        console.error("Error parsing URL:", error);
      }
      
      return baseUrl;
    },
    
    async jwt({ token, user, account, trigger, session }) {
      console.log("=== JWT CALLBACK ===");
      console.log("Token email:", token.email);
      
      // Initial sign in
      if (user) {
        console.log("Setting initial token for user:", user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = (user as any).role || 'user';
      }

      // Handle session updates
      if (trigger === 'update' && session) {
        token.role = session.user?.role || token.role;
        token.name = session.user?.name || token.name;
        token.image = session.user?.image || token.image;
      }

      // Fetch fresh user data on each request
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
            }
          });

          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role as any;
            token.isActive = dbUser.isActive;
            token.name = dbUser.name;
            token.image = dbUser.image;
          } else {
            console.error("User not found in database");
          }
        } catch (error) {
          console.error("Error fetching user in JWT callback:", error);
        }
      }
      
      console.log("Token role:", token.role);
      return token;
    },
    
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      console.log("Token:", token.email);
      
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
        session.user.name = token.name as string || '';
        session.user.email = token.email as string || '';
        session.user.image = token.image as string || '';
        
        console.log("Session role set to:", session.user.role);
      }
      
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