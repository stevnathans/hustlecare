// app/businesses/[slug]/cost/CostCartSummary.tsx
//
// Live running total for whatever's been quick-added on this page (or
// already in the cart from the requirements page — same cart either
// way). Deliberately thin: no editing, removal, save or export here —
// those stay on the requirements page's CostCalculator, which already
// does them well. This is a status readout plus a link, not a second
// cart UI to maintain.

'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/currency';
import type { MarketCode } from '@/lib/markets';

interface CostCartSummaryProps {
  businessSlug: string;
  market: MarketCode;
}

export default function CostCartSummary({ businessSlug, market }: CostCartSummaryProps) {
  const { items, totalCost, totalItems, loading } = useCart();

  const requirementsUrl =
    market === 'KE' ? `/businesses/${businessSlug}/requirements` : `/us/businesses/${businessSlug}/requirements`;

  if (loading && items.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center text-sm text-slate-400">
        Loading your list…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-5 text-center">
        <p className="text-sm text-slate-500 mb-2">
          Use &quot;Add cheapest option&quot; on the requirements below to start building your own estimate.
        </p>
        <Link href={requirementsUrl} className="text-sm font-medium text-emerald-700 hover:underline">
          Or browse every option on the requirements page →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Your list</p>
        <p className="text-lg font-bold text-emerald-900">
          {formatCurrency(totalCost, market)}{' '}
          <span className="text-sm font-normal text-emerald-700">
            · {totalItems} item{totalItems === 1 ? '' : 's'}
          </span>
        </p>
      </div>
      <Link
        href={requirementsUrl}
        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
      >
        Manage, save or export your list →
      </Link>
    </div>
  );
}