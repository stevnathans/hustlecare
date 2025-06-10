import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

/**
 * Hook to automatically fetch and sync cart data
 * whenever businessId changes.
 */
export const useCartSync = (businessId: number | null) => {
  const { fetchCart } = useCart();

  useEffect(() => {
    if (businessId) {
      fetchCart(businessId);
    }
  }, [businessId, fetchCart]);
};
