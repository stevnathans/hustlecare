/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/auth.ts - SIMPLIFIED TEST VERSION
// This version bypasses ALL database operations to isolate the issue
// If this works, the problem is in database operations
// If this fails, the problem is in NextAuth/Google configuration

import { getServerSession } from "next-auth";
import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("=== SIMPLIFIED SIGNIN CALLBACK ===");
      console.log("Provider:", account?.provider);
      console.log("User email:", user?.email);
      console.log("Profile email:", profile?.email);
      console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
      console.log("GOOGLE_CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID);
      console.log("GOOGLE_CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET);
      
      // ALWAYS RETURN TRUE - NO DATABASE CHECKS
      // This isolates whether the issue is NextAuth config or database
      console.log("=== RETURNING TRUE (bypassing all checks) ===");
      return true;
    },
    
    async jwt({ token, user }) {
      console.log("=== JWT CALLBACK ===");
      if (user) {
        console.log("Storing user in JWT:", user.email);
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.role = 'user'; // Default role
      }
      return token;
    },
    
    async session({ session, token }) {
      console.log("=== SESSION CALLBACK ===");
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        session.user.role = token.role as any || 'user';
        console.log("Session created for:", session.user.email);
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