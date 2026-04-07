// components/business/BusinessCards.tsx
'use client';
import { FiArrowRight, FiFileText, FiDollarSign, FiInfo } from 'react-icons/fi';
import { useMemo, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

type Requirement = {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  necessity: string;
};

type BusinessCardProps = {
  id: string | number;
  name: string;
  image?: string;
  slug: string;
  category?: string;
  estimatedCost?: string;
  requirements: Requirement[];
  sortedCategories: string[];
  timeToLaunch?: string;
  groupedRequirements?: Record<string, Requirement[]>;
};

interface CostData {
  low: number;
  high: number;
  hasPricing: boolean;
}

function formatKES(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export default function BusinessCard({
  name,
  image,
  slug,
  category,
  groupedRequirements = {},
}: BusinessCardProps) {
  const [cost, setCost]           = useState<CostData | null>(null);
  const [costLoading, setCostLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/businesses/${slug}/cost`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { setCost(data); setCostLoading(false); })
      .catch(() => setCostLoading(false));
  }, [slug]);

  const totalRequirements = useMemo(() => {
    if (!groupedRequirements || Object.keys(groupedRequirements).length === 0) return 0;
    return Object.values(groupedRequirements).reduce(
      (total, reqs) => total + (reqs?.length || 0),
      0
    );
  }, [groupedRequirements]);

  const overviewHref     = `/businesses/${slug}`;
  const requirementsHref = `/businesses/${slug}/requirements`;

  // Cost display value
  const costDisplay = (() => {
    if (costLoading) return null;              // show skeleton
    if (!cost?.hasPricing) return '—';
    return `KES ${formatKES(cost.low)} – ${formatKES(cost.high)}`;
  })();

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col border border-gray-100">
      {/* Subtle hover shimmer */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

      {/* ── Image ── */}
      <Link href={overviewHref} className="relative block overflow-hidden flex-shrink-0">
        {image ? (
          <>
            <Image
              src={image}
              alt={name}
              width={800}
              height={400}
              className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
            <div className="text-center">
              <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center mb-2 mx-auto">
                <FiFileText className="w-7 h-7 text-gray-500" />
              </div>
              <span className="text-gray-500 text-xs font-medium">No Image</span>
            </div>
          </div>
        )}

        {/* Requirement count badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
          <FiFileText className="w-3 h-3 text-emerald-600" />
          <span className="text-xs font-bold text-gray-800">{totalRequirements}</span>
        </div>

        {/* Category badge */}
        {category && (
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
            <span className="text-xs font-medium text-white">{category}</span>
          </div>
        )}
      </Link>

      {/* ── Body ── */}
      <div className="p-5 flex-grow flex flex-col">
        <Link href={overviewHref}>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug mb-3">
            {name}
          </h3>
        </Link>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-5 flex-grow">
          <div className="bg-gray-50 rounded-xl p-3 group-hover:bg-emerald-50 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <FiFileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span className="text-base font-bold text-gray-900 leading-none">
                {totalRequirements}
              </span>
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Requirements
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 group-hover:bg-blue-50 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <FiDollarSign className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost</span>
            </div>
            {/* Cost value or skeleton */}
            {costLoading ? (
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mt-0.5" />
            ) : (
              <div
                className="text-xs font-semibold text-gray-900 leading-tight"
                title={cost?.hasPricing ? `KES ${cost.low.toLocaleString()} – ${cost.high.toLocaleString()}` : undefined}
              >
                {costDisplay}
              </div>
            )}
          </div>
        </div>

        {/* ── Dual CTAs ── */}
        <div className="flex gap-2 mt-auto">
          {/* Overview — secondary */}
          <Link
            href={overviewHref}
            className="flex items-center justify-center gap-1.5 flex-1 py-2.5 px-3 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl text-sm font-medium text-gray-600 hover:text-emerald-700 transition-all"
          >
            <FiInfo className="w-3.5 h-3.5 flex-shrink-0" />
            Overview
          </Link>

          {/* Requirements — primary */}
          <Link
            href={requirementsHref}
            className="relative overflow-hidden flex items-center justify-center gap-1.5 flex-[2] py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-semibold text-white transition-colors group/btn"
          >
            {/* Shine sweep */}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <FiFileText className="w-3.5 h-3.5 flex-shrink-0 relative" />
            <span className="relative">Requirements</span>
            <FiArrowRight className="w-3.5 h-3.5 relative group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20 transition-all duration-300 pointer-events-none" />
    </div>
  );
}