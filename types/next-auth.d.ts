// types/next-auth.d.ts
import NextAuth, { DefaultSession } from "next-auth";
import type { StaticImport } from 'next/image';

declare module "next-auth" {
  interface Session {
    user: {
      image: string | StaticImport;
      name: string;
      id: string;
      email: string;
      phone?: string | null;
      role: string;
      vendorId?: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    phone?: string | null;
    role?: string;
    vendorId?: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isActive?: boolean;
    vendorId?: number | null;
  }
}

export default NextAuth;