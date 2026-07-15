// lib/necessity.ts
//
// Single source of truth for necessity/demand display options across the app.
// Most categories use a simple Required/Optional scale. "Stock" (products a
// business sells, e.g. spare parts) uses a 3-way demand scale instead, since
// stock items aren't "optional" in the same sense — they're fast- or
// slow-moving. Add any future demand-scale categories to DEMAND_CATEGORIES.
//
// Stock is also excluded from the site-wide "requirements to start" count
// and cost estimate (see EXCLUDED_FROM_TOTALS_CATEGORIES below) — it
// represents optional/scalable inventory, not a fixed one-time startup
// requirement.

export interface NecOption {
  value: string;
  label: string;
  // Tailwind tokens — used by customer-facing components (RequirementCard, CategorySection)
  text: string;
  bg: string;
  border: string;
  dot: string;
  // Hex/rgba tokens — used by admin components with inline styles
  hexColor: string;
  hexBg: string;
}

/** Categories that use a demand scale instead of Required/Optional. */
export const DEMAND_CATEGORIES = new Set(['Stock']);

export function isDemandCategory(category: string): boolean {
  return DEMAND_CATEGORIES.has(category);
}

/**
 * Categories excluded from the site-wide "requirements to start" count and
 * cost estimate, because they represent optional/scalable inventory rather
 * than fixed one-time startup requirements. Currently the same set as
 * DEMAND_CATEGORIES, but kept as a separate concept in case that changes —
 * e.g. a future demand-scale category that should still count toward cost.
 */
export const EXCLUDED_FROM_TOTALS_CATEGORIES = new Set(['Stock']);

export function isExcludedFromTotals(category: string): boolean {
  return EXCLUDED_FROM_TOTALS_CATEGORIES.has(category);
}

const STANDARD: NecOption[] = [
  {
    value: 'Required', label: 'Required',
    text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-green-500',
    hexColor: '#34d399', hexBg: 'rgba(16,185,129,0.1)',
  },
  {
    value: 'Optional', label: 'Optional',
    text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500',
    hexColor: '#fbbf24', hexBg: 'rgba(245,158,11,0.1)',
  },
];

const DEMAND: NecOption[] = [
  {
    value: 'High Demand', label: 'High Demand',
    text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-green-500',
    hexColor: '#34d399', hexBg: 'rgba(16,185,129,0.1)',
  },
  {
    value: 'Medium Demand', label: 'Medium Demand',
    text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500',
    hexColor: '#fbbf24', hexBg: 'rgba(245,158,11,0.1)',
  },
  {
    value: 'Low Demand', label: 'Low Demand',
    text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500',
    hexColor: '#f87171', hexBg: 'rgba(239,68,68,0.1)',
  },
];

/** All valid necessity/demand options for a given category. */
export function necessityOptions(category: string): NecOption[] {
  return isDemandCategory(category) ? DEMAND : STANDARD;
}

/** Default necessity value to preselect when creating a requirement in this category. */
export function defaultNecessity(category: string): string {
  return isDemandCategory(category) ? 'Medium Demand' : 'Required';
}

/** Look up display config for a specific necessity value within a category (case-insensitive). */
export function necessityStyle(category: string, value: string): NecOption {
  const opts = necessityOptions(category);
  const match = opts.find((o) => o.value.toLowerCase() === (value || '').toLowerCase());
  return (
    match ?? {
      value,
      label: value || 'Unspecified',
      text: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400',
      hexColor: '#9494b0', hexBg: 'rgba(148,148,176,0.1)',
    }
  );
}

/** True if `value` is one of the valid necessity/demand options for `category` (case-insensitive). */
export function isValidNecessity(category: string, value: string): boolean {
  return necessityOptions(category).some((o) => o.value.toLowerCase() === (value || '').toLowerCase());
}

/** All necessity/demand values across every scale — used for admin filter dropdowns that aren't scoped to a single category. */
export function allNecessityOptions(): NecOption[] {
  return [...STANDARD, ...DEMAND];
}