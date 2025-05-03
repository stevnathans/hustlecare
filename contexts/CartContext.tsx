"use client";
import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { Product } from "@/types/index";

interface CartItem extends Product {
  quantity: number;
  businessId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, businessId: string) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: (businessId?: string) => number;
  getBusinessItems: (businessId: string) => CartItem[];
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getTotal: () => 0,
  getBusinessItems: () => [],
});

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      return savedCart ? JSON.parse(savedCart) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, businessId: string) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.id === product.id && item.businessId === businessId
      );

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id && item.businessId === businessId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { ...product, quantity: 1, businessId }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotal = (businessId?: string) => {
    const itemsToCalculate = businessId
      ? cartItems.filter((item) => item.businessId === businessId)
      : cartItems;
      
    return itemsToCalculate.reduce(
      (total, item) => total + (item.price || 0) * (item.quantity || 1),
      0
    );
  };

  const getBusinessItems = (businessId: string) => {
    return cartItems.filter((item) => item.businessId === businessId);
  };

  

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getBusinessItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};