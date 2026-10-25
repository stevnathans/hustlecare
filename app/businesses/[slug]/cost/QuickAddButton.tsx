// app/businesses/[slug]/cost/QuickAddButton.tsx
//
// Adds a requirement's cheapest matching product to the shared cart.
//
// CURRENCY: the cart is shared across markets for a business and has no
// currency conversion, so the add route rejects an item whose currency
// differs from what's already in the cart. This button mirrors that rule
// client-side (disabling itself with an explanation).
//
// FAILURE FEEDBACK: CartContext.addToCart catches its own errors (it
// records them in `error` state and never throws), so awaiting it can't
// tell us whether the add worked. Instead, after an add attempt settles,
// we check whether the product actually appears in the cart. If not, the
// button flips to a "Retry" state and surfaces the context's error message
// in its tooltip — covering the cases the client-side currency check can't
// (e.g. the cart hadn't finished loading when the person clicked).

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import LoginModal from '@/components/LoginModal';

interface QuickAddButtonProps {
  productId: number;
  productName: string;
  price: number;
  image: string | null;
  requirementName: string;
  category: string;
  /** ISO currency code of this page's market, e.g. "KES" or "USD". */
  marketCurrency: string;
}

export default function QuickAddButton({
  productId,
  productName,
  price,
  image,
  requirementName,
  category,
  marketCurrency,
}: QuickAddButtonProps) {
  const { addToCart, removeFromCart, items, error } = useCart();
  const { data: session } = useSession();
  const [showLogin, setShowLogin] = useState(false);
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [failed, setFailed] = useState(false);

  const isInCart = items.some((item) => item.productId === productId);
  const currencyMismatch =
    !isInCart && items.some((item) => item.currency && item.currency !== marketCurrency);

  // Once an add attempt has settled, the cart state is up to date: if the
  // product still isn't in it, the add was rejected.
  useEffect(() => {
    if (attempted && !pending) {
      setFailed(!isInCart);
      setAttempted(false);
    }
  }, [attempted, pending, isInCart]);

  const handleClick = async () => {
    if (!session) {
      setShowLogin(true);
      return;
    }
    setFailed(false);
    setPending(true);
    try {
      if (isInCart) {
        await removeFromCart(productId);
      } else {
        setAttempted(true);
        await addToCart({
          productId,
          name: productName,
          price,
          image: image ?? undefined,
          requirementName,
          category,
          __index: 0,
        });
      }
    } finally {
      setPending(false);
    }
  };

  const title = currencyMismatch
    ? 'Your list already has items in a different currency. Clear it on the requirements page to add this.'
    : failed
    ? error ?? "Couldn't add this item. Please try again."
    : undefined;

  return (
    <>
      {showLogin && (
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={() => setShowLogin(false)} />
      )}
      <button
        onClick={handleClick}
        disabled={pending || currencyMismatch}
        title={title}
        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
          isInCart
            ? 'bg-green-500 text-white hover:bg-green-600'
            : failed
            ? 'bg-red-500 text-white hover:bg-red-600'
            : currencyMismatch
            ? 'bg-gray-300 text-gray-600'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {isInCart ? <FiCheck size={12} /> : failed ? <FiAlertCircle size={12} /> : <FiPlus size={12} />}
        {isInCart ? 'Added' : failed ? 'Retry' : 'Add cheapest'}
      </button>
    </>
  );
}