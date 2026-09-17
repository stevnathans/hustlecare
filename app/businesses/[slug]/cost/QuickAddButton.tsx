// app/businesses/[slug]/cost/QuickAddButton.tsx
//
// Adds a requirement's cheapest matching product (CostLine
// .representativeProduct) to the shared cart with one click. Quantity
// adjustment, removal, and everything else stays on the requirements
// page's CostCalculator — this button only ever adds at quantity 1,
// matching CartContext.addToCart's own signature (it doesn't accept a
// starting quantity).

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FiPlus, FiCheck } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import LoginModal from '@/components/LoginModal';

interface QuickAddButtonProps {
  productId: number;
  productName: string;
  price: number;
  image: string | null;
  requirementName: string;
  category: string;
}

export default function QuickAddButton({
  productId,
  productName,
  price,
  image,
  requirementName,
  category,
}: QuickAddButtonProps) {
  const { addToCart, removeFromCart, items } = useCart();
  const { data: session } = useSession();
  const [showLogin, setShowLogin] = useState(false);
  const [pending, setPending] = useState(false);

  const isInCart = items.some((item) => item.productId === productId);

  const handleClick = async () => {
    if (!session) {
      setShowLogin(true);
      return;
    }
    setPending(true);
    try {
      if (isInCart) {
        await removeFromCart(productId);
      } else {
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

  return (
    <>
      {showLogin && (
        <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLogin={() => setShowLogin(false)} />
      )}
      <button
        onClick={handleClick}
        disabled={pending}
        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${
          isInCart
            ? 'bg-green-500 text-white hover:bg-green-600'
            : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {isInCart ? <FiCheck size={12} /> : <FiPlus size={12} />}
        {isInCart ? 'Added' : 'Add cheapest'}
      </button>
    </>
  );
}