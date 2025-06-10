import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { z } from "zod"; // Optional, for input validation

export const authConfig = {
  providers: [
    // GitHub OAuth provider
    GitHubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    
    // Google OAuth provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    
    // Email/Password provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // This is where you would validate credentials against your database
        // Example implementation:
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        // In a real application, you would fetch the user from your database
        // and validate the password
        
        // For demo purposes:
        if (credentials.email === "user@example.com" && credentials.password === "password123") {
          return {
            id: "1",
            name: "Demo User",
            email: "user@example.com",
          };
        }
        
        return null;
      }
    })
  ],
  pages: {
    signIn: '/signin',
    signUp: '/signup',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Add custom user data to the token
      if (user) {
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom token data to the session
      if (token) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};