"use client";

import { CartProvider } from "@/contexts/CartContext";
import { SessionProvider } from "next-auth/react";

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}