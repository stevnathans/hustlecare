// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import { compare } from 'bcrypt';

// Create a single instance of PrismaClient - IMPORTANT!
// This ensures we don't have connection issues
const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt' as SessionStrategy,
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
      }
    }),
    CredentialsProvider({
      // Rest of your credentials provider configuration
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
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

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        const { password, ...safeUser } = user;
        return safeUser;
      },
    }),
  ],
  callbacks: {
    // Your existing callbacks...
    async signIn({ user, account, profile }) {
      console.log("Sign in callback triggered for:", profile?.email);
      
      if (account?.provider === "google" && profile?.email) {
        try {
          // Check if user already exists
          let existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          if (!existingUser) {
            // Create a new user record
            console.log(`Creating new user via Google: ${profile.email}`);
            existingUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                image: profile.image as string,
                emailVerified: new Date(), // Google auth automatically verifies email
              },
            });
            
            // Also create account link (if needed)
            if (account && !await prisma.account.findFirst({ 
              where: { 
                provider: account.provider,
                providerAccountId: account.providerAccountId 
              }
            })) {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
            }
            
            console.log(`Successfully created new Google user: ${existingUser.id}`);
          } else {
            console.log(`User ${profile.email} already exists, continuing with Google sign-in.`);
            
            // Ensure the account is linked
            const existingAccount = await prisma.account.findFirst({
              where: {
                userId: existingUser.id,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            });
            
            if (!existingAccount && account) {
              // Link the account
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  refresh_token: account.refresh_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                },
              });
              console.log(`Linked Google account to existing user: ${existingUser.id}`);
            }
          }

          // Check if we should update user info
          if (existingUser && profile.name && existingUser.name !== profile.name || 
              existingUser && profile.image && existingUser.image !== profile.image) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                name: profile.name || existingUser.name,
                image: profile.image as string || existingUser.image,
              },
            });
            console.log(`Updated user profile info for: ${existingUser.id}`);
          }
          
          // Make sure the user object has the right ID
          if (existingUser && user) {
            user.id = existingUser.id;
          }
        } catch (error) {
          console.error("Error in Google sign-in process:", error);
          return false; // Deny sign-in on error
        }
      }
      
      return true; // Allow sign-in
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin', // Redirect to login page on error
  },
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };