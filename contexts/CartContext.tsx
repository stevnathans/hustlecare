/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

// Define types for our cart items and context
export type CartItem = {
  __index: number;
  id: string;
  productId: string | number; // Updated to accept both string and number
  name: string;
  price: number;
  quantity: number;
  image?: string;
  requirementName: string;  // Add requirement name
  category: string;         // Add category
  isProductless?: boolean;  // True when requirement has no products
  // Currency `price` is denominated in — snapshotted from Product.currency
  // server-side (see /api/cart/item/add), never computed or assumed
  // client-side. Optional because locally-created productless items (see
  // below) don't go through that server round trip; their price is
  // always 0 regardless of currency, so the field is harmless there —
  // never read for display since isProductless items show a fixed
  // "no products" state, not a formatted price.
  currency?: string;
  // Only used transiently on the add-to-cart request for a fee-schedule
  // shell product, so the server can resolve the authoritative price for
  // that county. Never persisted, never present on items read back from
  // the server.
  countyId?: number;
  // Chosen SoftwarePackage for a Software product with packages. Sent on
  // the add-to-cart request (server re-verifies the price from it, same
  // "never trust the client" pattern as countyId above) and also present
  // on items read back from the server, since — unlike countyId — this
  // one IS persisted on CartItem.
  packageId?: number | null;
  // Snapshotted display label for the chosen package's cadence (e.g.
  // "Monthly") — persisted alongside packageId so the cart/checkout UI
  // doesn't need to re-join against SoftwarePackage just to show it.
  billingPeriodLabel?: string | null;
};

type CartContextType = {
  items: CartItem[];
  businessId: number | null;
  loading: boolean;
  error: string | null;
  totalCost: number;
  totalItems: number;
  fetchCart: (businessId: number) => Promise<void>;
  addToCart: (product: Omit<CartItem, 'id' | 'quantity'>) => Promise<void>;
  removeFromCart: (productId: string | number) => Promise<void>; // Updated parameter type
  updateQuantity: (productId: string | number, quantity: number) => Promise<void>; // Updated parameter type
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
  addToCart: async () => { },
  removeFromCart: async () => { },
  updateQuantity: async () => { },
  clearCart: async () => { },
  clearCategory: async () => { },
  clearRequirement: async () => { },
  switchBusiness: async () => { },
  saveCart: async () => ({ success: false }),
  fetchCart: function (businessId: number): Promise<void> {
    throw new Error('Function not implemented.');
  }
});

// Props for the provider component
type CartProviderProps = {
  children: ReactNode;
  initialBusinessId?: number;
};

// Helper: merge local productless items back into a fresh server response
function mergeProductlessItems(serverItems: CartItem[], currentItems: CartItem[]): CartItem[] {
  const productlessItems = currentItems.filter((item) => item.isProductless);
  return [...serverItems, ...productlessItems];
}

export const CartProvider = ({ children, initialBusinessId }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [businessId, setBusinessId] = useState<number | null>(initialBusinessId || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Calculate total cost and items whenever items change
  // Productless items are excluded from total cost but counted in totalItems
  useEffect(() => {
    const total = items.reduce((sum, item) => {
      if (item.isProductless) return sum; // Exclude productless requirements from cost
      return sum + item.price * item.quantity;
    }, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    setTotalCost(total);
    setTotalItems(itemCount);
  }, [items]);

  // Function to load cart from the server
  const fetchCart = useCallback(async (businessId: number) => {
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
  }, []);

  // Load cart from server when businessId changes
  useEffect(() => {
    if (businessId !== null) {
      fetchCart(businessId);
    }
  }, [businessId, fetchCart]);

  // Add item to cart
  const addToCart = useCallback(async (product: Omit<CartItem, 'id' | 'quantity'>) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    // Handle productless requirements locally (no server call needed for $0 items)
    if (product.isProductless) {
      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.productId === product.productId
        );
        if (existingIndex !== -1) return prev;
        const newItem: CartItem = {
          ...product,
          id: `local_${product.productId}`,
          quantity: 1,
          price: 0,
        };
        return [...prev, newItem];
      });
      return;
    }

    // Everything else — including fee-schedule shell products and
    // package-priced software products — goes through the real server
    // call, so it persists as a genuine CartItem.
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add item to cart');
      }
     
      const data = await response.json();
      setItems((prev) => mergeProductlessItems(data.items, prev));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Remove item from cart
  const removeFromCart = useCallback(async (productId: string | number) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    // Handle productless requirements locally
    let wasProductless = false;
    setItems((prev) => {
      const itemToRemove = prev.find((item) => item.productId === productId);
      if (itemToRemove?.isProductless) {
        wasProductless = true;
        return prev.filter((item) => item.productId !== productId);
      }
      return prev;
    });
    if (wasProductless) return;

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
      setItems((prev) => mergeProductlessItems(data.items, prev));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Update item quantity
  const updateQuantity = useCallback(async (productId: string | number, quantity: number) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    // Productless items have no quantity concept — skip
    const itemToUpdate = items.find((item) => item.productId === productId);
    if (itemToUpdate?.isProductless) return;

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
      setItems((prev) => mergeProductlessItems(data.items, prev));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error updating cart:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId, items]);

  // Clear cart
  const clearCart = useCallback(async () => {
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
     
      setItems((prev) => prev.filter((item) => item.isProductless));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Clear items from a specific category
  const clearCategory = useCallback(async (category: string) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    // Remove any local productless items for this category first
    setItems((prev) =>
      prev.filter((item) => !(item.isProductless && item.category === category))
    );

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
      setItems((prev) => mergeProductlessItems(data.items, prev));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error clearing category:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Clear items for a specific requirement within a category
  const clearRequirement = useCallback(async (requirementName: string, category: string) => {
    if (!businessId) {
      setError('No business selected');
      return;
    }

    // Remove any local productless item for this requirement first
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(item.isProductless && item.requirementName === requirementName && item.category === category)
      )
    );

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
      setItems((prev) => mergeProductlessItems(data.items, prev));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      console.error('Error clearing requirement:', error);
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  // Switch to a different business.
  const switchBusiness = useCallback(async (newBusinessId: number) => {
    setBusinessId((prev) => (prev === newBusinessId ? prev : newBusinessId));
  }, []);

  // Save cart for sharing
  const saveCart = useCallback(async (name?: string) => {
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
  }, [businessId, totalCost]);

  const value = useMemo(
    () => ({
      items,
      businessId,
      loading,
      error,
      totalCost,
      totalItems,
      fetchCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      clearCategory,
      clearRequirement,
      switchBusiness,
      saveCart,
    }),
    [
      items,
      businessId,
      loading,
      error,
      totalCost,
      totalItems,
      fetchCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      clearCategory,
      clearRequirement,
      switchBusiness,
      saveCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use the cart context
export const useCart = () => useContext(CartContext);