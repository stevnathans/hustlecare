// app/businesses/[slug]/cost/CostCartSync.tsx
//
// Renders nothing — just points the shared CartContext at this business's
// cart, the same way useBusinessData does on the requirements page. /cost
// has no client data hook of its own (everything is server-fetched), so
// this one-line effect is what makes the cart connect at all.

'use client';

import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

export default function CostCartSync({ businessId }: { businessId: number }) {
  const { switchBusiness } = useCart();

  useEffect(() => {
    switchBusiness(businessId);
  }, [businessId, switchBusiness]);

  return null;
}