// components/shared/CostCartSync.tsx
//
// Renders nothing — just points the shared CartContext at this business's
// cart, the same way useBusinessData does on the requirements page. /cost
// has no client data hook of its own (everything is server-fetched), so
// this one-line effect is what makes the cart connect at all there.
//
// Moved out of app/businesses/[slug]/cost/ into components/shared/
// alongside CostCartSummary (see that file's header comment) for the same
// reason — kept as its own component even though, as of this move, its
// only consumer remains the /cost page: any future page that, like /cost,
// has no client data hook calling switchBusiness() on its own can reuse
// this directly instead of re-deriving the same one-line effect. Pages
// that DO call useBusinessData (the main requirements page,
// CategoryChecklistContent) don't need this — useBusinessData already
// calls switchBusiness() itself on load.

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