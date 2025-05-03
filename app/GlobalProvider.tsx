import { CartProvider } from "@/contexts/CartContext"

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    return <CartProvider>{children}</CartProvider>;
}