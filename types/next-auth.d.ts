// types/next-auth.d.ts
import NextAuth from "next-auth";
import type { StaticImport } from 'next/image';

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      image: string | StaticImport;
      name: string;
      id: string;
      email: string;
      phone?: string | null;
    } & DefaultSession['user'];
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback
   */
  interface User {
    id: string;
    email: string;
    phone?: string | null;
  }
}

// This exports the types so they can be used elsewhere
export default NextAuth;