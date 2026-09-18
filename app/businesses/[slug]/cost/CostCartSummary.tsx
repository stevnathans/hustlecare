// app/businesses/[slug]/cost/CostCartSummary.tsx
//
// Fixed floating bar, matching the visual language of CostCalculator's
// mobile collapsed bar on the requirements page (gradient emerald,
// rounded-2xl, shadow-2xl). /cost has no sidebar to make sticky, so this
// pins to the viewport bottom instead — visible while scrolling the whole
// page, on every screen size. Hidden entirely while the cart is empty, so
// a first-time visitor doesn't see a persistent bar with nothing in it;
// it appears the moment something's added (here or on the requirements
// page — same shared cart either way) and stays until they navigate away.
//
// Deliberately thin: no editing, removal, save or export here — those
// stay on the requirements page's CostCalculator. This is a status
// readout plus a link, not a second cart UI to maintain.

'use client';

import Link from 'next/link';
import { FiShoppingCart, FiArrowRight } from 'react-icons/fi';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/currency';
import type { MarketCode } from '@/lib/markets';

interface CostCartSummaryProps {
  businessSlug: string;
  market: MarketCode;
}

export default function CostCartSummary({ businessSlug, market }: CostCartSummaryProps) {
  const { items, totalCost, totalItems } = useCart();

  if (items.length === 0) return null;

  const requirementsUrl =
    market === 'KE' ? `/businesses/${businessSlug}/requirements` : `/us/businesses/${businessSlug}/requirements`;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-50">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl shadow-2xl px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
            <FiShoppingCart className="text-white" size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm sm:text-base leading-tight">
              {formatCurrency(totalCost, market)}
            </p>
            <p className="text-white/80 text-xs">
              {totalItems} item{totalItems === 1 ? '' : 's'} in your list
            </p>
          </div>
        </div>

        <Link
          href={requirementsUrl}
          className="flex-shrink-0 flex items-center gap-1.5 bg-white text-emerald-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold hover:bg-emerald-50 transition-colors"
        >
          Manage list
          <FiArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}