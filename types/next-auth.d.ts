// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      image: string | StaticImport;
      name: string;
      id: string;
      email: string;
      phone?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    phone?: string | null;
  }
}
