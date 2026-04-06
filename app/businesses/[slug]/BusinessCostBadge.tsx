// app/businesses/[slug]/BusinessCostBadge.tsx
'use client';

import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

interface CostData {
  low: number;
  medium: number;
  high: number;
  requirementsWithProducts: number;
  totalRequirements: number;
  hasPricing: boolean;
}

interface BusinessCostBadgeProps {
  slug: string;
}

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

export default function BusinessCostBadge({ slug }: BusinessCostBadgeProps) {
  const [cost, setCost]       = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/businesses/${slug}/cost`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setCost(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Don't render anything while loading or if no pricing data
  if (loading || !cost?.hasPricing) return null;

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white">
      <DollarSign className="w-4 h-4 text-emerald-300" />
      <span className="font-semibold">{formatKES(cost.low)}</span>
      <span className="text-white/50">–</span>
      <span className="font-semibold">{formatKES(cost.high)}</span>
      <span className="text-white/70">est. cost</span>
    </div>
  );
}