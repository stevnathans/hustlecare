'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for our cart items and context
export type CartItem = {
  __index: number;
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  requirementName: string;  // Add requirement name
  category: string;         // Add category
};

type CartContextType = {
  items: CartItem[];
  businessId: number | null;
  loading: boolean;
  error: string | null;
  totalCost: number;
  totalItems: number;
  addToCart: (product: Omit<CartItem, 'id' | 'quantity'>) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  clearCategory: (category: string) => Promise<void>;
  clearRequirement: (requirementName: string, category: string) => Promise<void>;
  switchBusiness: (businessId: number) => Promise<void>;
  saveCart: (name?: string) => Promise<{ success: boolean; cartId?: string }>;
};

// Create the context with default values
const CartContext = createContext<CartContextType>({
  items: [],
  businessId: null,
  loading: false,
  error: null,
  totalCost: 0,
  totalItems: 0,
  addToCart: async () => {},
  removeFromCart: async () => {},
  updateQuantity: async () => {},
  clearCart: async () => {},
  clearCategory: async () => {},
  clearRequirement: async () => {},
  switchBusiness: async () => {},
  saveCart: async () => ({ success: false }),
});

// Props for the provider component
type CartProviderProps = {
  children: ReactNode;
  initialBusinessId?: number;
};

export const CartProvider = ({ children, initialBusinessId }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [businessId, setBusinessId] = useState<number | null>(initialBusinessId || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Calculate total cost and items whenever items change
  useEffect(() => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    setTotalCost(total);
    setTotalItems(itemCount);
  }, [items]);

  // Load cart from server when businessId changes
  useEffect(() => {
    if (businessId !== null) {
      loadCart(businessId);
    }
  }, [businessId]);

  // Function to load cart from the server
  const loadCart = async (businessId: number) => {
    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch(`/api/cart?businessId=${businessId}`);
     
      if (!response.ok) {
        throw new Error('Failed to load cart');
      }
     
      const data = await response.json();
      setItems(data.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = async (product: Omit<CartItem, 'id' | 'quantity'>) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/item/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          product,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to add item to cart');
      }
     
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId: number) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/item/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          productId,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to remove item from cart');
      }
     
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: number, quantity: number) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/item/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          productId,
          quantity,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to update cart item');
      }
     
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error updating cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to clear cart');
      }
     
      setItems([]);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear items from a specific category
  const clearCategory = async (category: string) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/clear-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          category,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to clear category');
      }
     
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error clearing category:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear items for a specific requirement within a category
  const clearRequirement = async (requirementName: string, category: string) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/clear-requirement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          requirementName,
          category,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to clear requirement');
      }
     
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error clearing requirement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Switch to a different business
  const switchBusiness = async (newBusinessId: number) => {
    if (businessId === newBusinessId) return;
    setBusinessId(newBusinessId);
    // loadCart will be triggered by the useEffect
  };

  // Save cart for sharing
  const saveCart = async (name?: string) => {
    if (!businessId) {
      setError('No business selected');
      return { success: false };
    }

    try {
      setLoading(true);
      setError(null);
     
      const response = await fetch('/api/cart/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          name,
          totalCost,
        }),
      });
     
      if (!response.ok) {
        throw new Error('Failed to save cart');
      }
     
      const data = await response.json();
      return { success: true, cartId: data.cartId };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error saving cart:', error);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        businessId,
        loading,
        error,
        totalCost,
        totalItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearCategory,
        clearRequirement,
        switchBusiness,
        saveCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);