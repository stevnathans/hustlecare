// app/businesses/[slug]/cost/CostSummaryPanel.tsx
//
// SIZE BAND (new): accepts a full matrix (every SizeBand × includeOptional
// combination), computed server-side in page.tsx, and switches between
// them with local state — no client fetch, same trick as the optional-
// items toggle. "Working capital months" and "include stock" remain pure
// client-side arithmetic on whichever cell of the matrix is active.

'use client';

import { useMemo, useState } from 'react';
import { formatCurrency, formatMoneyRange } from '@/lib/currency';
import type { MarketCode } from '@/lib/markets';
import { ALL_SIZE_BANDS, DEFAULT_SIZE_BAND, type CostSource, type MoneyRange, type SizeBand } from '@/lib/cost-engine';

export interface CostPanelSummary {
  oneTime: MoneyRange;
  monthlyRecurring: MoneyRange;
  stock: MoneyRange;
  stockCount: number;
  coverage: { totalRequirements: number; requirementsWithPricing: number };
  hasPricing: boolean;
  source: CostSource;
  workingCapitalMonths: number;
}

interface CostSummaryPanelProps {
  businessName: string;
  market: MarketCode;
  matrix: Record<SizeBand, { requiredOnly: CostPanelSummary; withOptional: CostPanelSummary }>;
  optionalCount: number;
}

const SIZE_BAND_LABELS: Record<SizeBand, string> = {
  MICRO: 'Micro',
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

function scale(range: MoneyRange, factor: number): MoneyRange {
  return { low: range.low * factor, typical: range.typical * factor, high: range.high * factor };
}

function add(a: MoneyRange, b: MoneyRange): MoneyRange {
  return { low: a.low + b.low, typical: a.typical + b.typical, high: a.high + b.high };
}

export default function CostSummaryPanel({
  businessName,
  market,
  matrix,
  optionalCount,
}: CostSummaryPanelProps) {
  const [sizeBand, setSizeBand] = useState<SizeBand>(DEFAULT_SIZE_BAND);
  const [includeOptional, setIncludeOptional] = useState(false);
  const [includeStock, setIncludeStock] = useState(false);
  const [months, setMonths] = useState(matrix[DEFAULT_SIZE_BAND].requiredOnly.workingCapitalMonths);

  const active = includeOptional ? matrix[sizeBand].withOptional : matrix[sizeBand].requiredOnly;
  const requiredOnlyForBand = matrix[sizeBand].requiredOnly;

  const workingCapital = useMemo(() => scale(active.monthlyRecurring, months), [active, months]);

  const cashToOpen = useMemo(() => {
    let total = add(active.oneTime, workingCapital);
    if (includeStock) total = add(total, active.stock);
    return total;
  }, [active, workingCapital, includeStock]);

  const money = (n: number) => formatCurrency(n, market);
  const range = (r: MoneyRange) => formatMoneyRange(r, market);

  const isEditorial = active.source === 'EDITORIAL';
  const missingCount = active.coverage.totalRequirements - active.coverage.requirementsWithPricing;
  const hasStockToOffer = requiredOnlyForBand.stockCount > 0;

  if (!active.hasPricing) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 text-center">
        <p className="text-slate-600">
          We&apos;re still pricing the requirements for a {businessName.toLowerCase()} business — check
          back soon for a full cost breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Cash needed to open
        </p>
        <p className="text-3xl sm:text-4xl font-bold text-emerald-700">{range(cashToOpen)}</p>
        <p className="text-sm text-slate-500 mt-2">
          Typical: <span className="font-semibold text-slate-700">{money(cashToOpen.typical)}</span>
        </p>

        {isEditorial && (
          <p className="text-xs text-amber-600 mt-2">
            Estimated range — individual requirements for this business are still being priced.
          </p>
        )}

        {!isEditorial && missingCount > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            Based on {active.coverage.requirementsWithPricing} of {active.coverage.totalRequirements}{' '}
            requirements with real supplier prices — the actual cost may be higher.
          </p>
        )}
      </div>

      {/* ── Business size ────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-sm text-slate-600 mb-2 text-center">Business size</p>
        <div className="grid grid-cols-4 gap-2">
          {ALL_SIZE_BANDS.map((band) => (
            <button
              key={band}
              type="button"
              onClick={() => setSizeBand(band)}
              aria-pressed={sizeBand === band}
              className={`px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                sizeBand === band
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              {SIZE_BAND_LABELS[band]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Other controls ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center mb-6 pb-6 border-b border-slate-100">
        {optionalCount > 0 && (
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeOptional}
              onChange={(e) => setIncludeOptional(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Include {optionalCount} optional item{optionalCount === 1 ? '' : 's'}
          </label>
        )}

        {hasStockToOffer && (
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeStock}
              onChange={(e) => setIncludeStock(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            Include starting stock ({formatMoneyRange(requiredOnlyForBand.stock, market)})
          </label>
        )}
      </div>

      <div className="mb-6">
        <label htmlFor="working-capital-months" className="block text-sm text-slate-600 mb-2">
          Months of running costs to budget for:{' '}
          <span className="font-semibold text-slate-800">{months}</span>
        </label>
        <input
          id="working-capital-months"
          type="range"
          min={0}
          max={12}
          step={1}
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full accent-emerald-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>0 months</span>
          <span>12 months</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">One-time setup</p>
          <p className="text-lg font-bold text-slate-900">{range(active.oneTime)}</p>
          <p className="text-xs text-slate-400 mt-1">Legal, equipment, documents, branding</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Monthly running costs</p>
          <p className="text-lg font-bold text-slate-900">
            {active.monthlyRecurring.high > 0 ? range(active.monthlyRecurring) : money(0)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Rent, utilities, subscriptions</p>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
            Working capital ({months} mo)
          </p>
          <p className="text-lg font-bold text-emerald-800">{range(workingCapital)}</p>
          <p className="text-xs text-emerald-600/70 mt-1">Running costs until break-even</p>
        </div>
      </div>
    </div>
  );
}