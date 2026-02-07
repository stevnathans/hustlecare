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
  adapter: PrismaAdapter(prisma) as any, // Type assertion needed for adapter compatibility
  session: {
    strategy: 'jwt',
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

        // Check if user is active (from file2)
        if (!user.isActive) {
          throw new Error('Account is inactive');
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Update last login (from file2)
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });

        // Return user without password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...safeUser } = user;
        return safeUser as User;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("Sign in callback triggered for:", profile?.email);
      
      if (account?.provider === "google" && profile?.email) {
        try {
          let existingUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          if (!existingUser) {
            // Validate required fields
            if (!profile.name) {
              throw new Error('Google profile is missing required name field');
            }

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
            
            if (account) {
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
          } else {
            // Update last login for Google sign-in (from file2)
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { lastLoginAt: new Date() }
            });

            if (account && !await prisma.account.findFirst({ 
              where: { 
                userId: existingUser.id,
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

            if (existingUser && (
              (profile.name && existingUser.name !== profile.name) || 
              (profile.image && existingUser.image !== profile.image)
            )) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  name: profile.name,
                  image: (profile.image as string) || existingUser.image,
                },
              });
            }
            
            if (existingUser && user) {
              user.id = existingUser.id;
            }
          }
        } catch (error) {
          console.error("Error in Google sign-in process:", error);
          return false;
        }
      }
      
      return true;
    },
    async jwt({ token, user, trigger, session }: { 
      token: JWT; 
      user?: User; 
      trigger?: 'signIn' | 'signUp' | 'update'; 
      session?: { user?: { role?: string; name?: string; image?: string } } 
    }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = ((user as { role?: string }).role || 'user') as any;
      }

      // Handle session update (from file2)
      if (trigger === 'update' && session) {
        token.role = (session.user?.role as any as any) || token.role;
        token.name = session.user?.name || token.name;
        token.image = session.user?.image || token.image;
      }

      // Fetch fresh user data from database on each request (from file2)
      // This ensures role changes and active status are reflected immediately
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
            token.email = dbUser.email;
          }
        } catch (error) {
          console.error("Error fetching fresh user data in JWT callback:", error);
        }
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) as any;
        session.user.name = (token.name as string) || '';
        session.user.email = (token.email as string) || '';
        session.user.image = (token.image as string) || '';
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