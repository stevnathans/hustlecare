'use client';
// components/tools/PermitCostsCalculator.tsx
//
// Standalone calculator: county + business category + size band -> an
// itemized breakdown of every county-issued Legal requirement, resolved
// via /api/legal-fee-schedules/resolve. Not tied to any specific business
// listing — usable by anyone who just wants to know "what will this cost
// me in my county."

import { useEffect, useState } from 'react';
import { FiMapPin, FiBriefcase, FiUsers, FiLoader, FiInfo, FiFileText } from 'react-icons/fi';

type County = { id: number; name: string; slug: string };
type BusinessCategory = { id: number; name: string; slug: string };
type SizeBand = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

type Resolution =
  | { status: 'unavailable' }
  | { status: 'exact'; price: number; matchedRow: { validityValue: number | null; validityUnit: string | null; processingTimeMinDays: number | null; processingTimeMaxDays: number | null } }
  | { status: 'range'; lowPrice: number; highPrice: number };

type ResolvedItem = {
  templateId: number;
  name: string;
  description: string | null;
  category: string;
  resolution: Resolution;
};

const SIZE_BAND_OPTIONS: { value: SizeBand; label: string; hint: string }[] = [
  { value: 'MICRO', label: 'Micro', hint: '1–9 employees' },
  { value: 'SMALL', label: 'Small', hint: '10–49 employees' },
  { value: 'MEDIUM', label: 'Medium', hint: '50–99 employees' },
  { value: 'LARGE', label: 'Large', hint: '100+ employees' },
];

function formatDuration(value?: number | null, unit?: string | null): string | null {
  if (value == null || !unit) return null;
  const label = value === 1 ? unit.slice(0, -1) : unit;
  return `${value} ${label}`;
}

function formatProcessingTime(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} Days`;
  const val = min ?? max;
  return `${val} Day${val === 1 ? '' : 's'}`;
}

export default function PermitCostsCalculator() {
  const [counties, setCounties] = useState<County[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const [countyId, setCountyId] = useState<string>('');
  const [businessCategoryId, setBusinessCategoryId] = useState<string>('');
  const [sizeBand, setSizeBand] = useState<SizeBand | ''>('');

  const [results, setResults] = useState<ResolvedItem[] | null>(null);
  const [resultCountyName, setResultCountyName] = useState<string>('');
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/counties').then((r) => r.json()),
      fetch('/api/business-categories').then((r) => r.json()),
    ])
      .then(([c, cat]) => {
        setCounties(Array.isArray(c) ? c : []);
        setCategories(Array.isArray(cat) ? cat : []);
      })
      .catch(() => {})
      .finally(() => setLoadingOptions(false));
  }, []);

  async function handleCalculate() {
    if (!countyId) {
      setError('Please select your county.');
      return;
    }
    setError('');
    setLoadingResults(true);
    setResults(null);

    try {
      const params = new URLSearchParams({ countyId });
      if (businessCategoryId) params.set('businessCategoryId', businessCategoryId);
      if (sizeBand) params.set('sizeBand', sizeBand);

      const res = await fetch(`/api/legal-fee-schedules/resolve?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to calculate');

      setResults(data.items);
      setResultCountyName(data.county?.name || '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoadingResults(false);
    }
  }

  const availableItems = results?.filter((r) => r.resolution.status !== 'unavailable') ?? [];
  const unavailableItems = results?.filter((r) => r.resolution.status === 'unavailable') ?? [];

  const totals = availableItems.reduce(
    (acc, item) => {
      if (item.resolution.status === 'exact') {
        acc.low += item.resolution.price;
        acc.high += item.resolution.price;
      } else if (item.resolution.status === 'range') {
        acc.low += item.resolution.lowPrice;
        acc.high += item.resolution.highPrice;
      }
      return acc;
    },
    { low: 0, high: 0 }
  );
  const hasRangeItem = availableItems.some((i) => i.resolution.status === 'range');

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FiMapPin size={12} /> County <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={countyId}
              onChange={(e) => setCountyId(e.target.value)}
              disabled={loadingOptions}
            >
              <option value="">Select county…</option>
              {counties.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FiBriefcase size={12} /> Business Type
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={businessCategoryId}
              onChange={(e) => setBusinessCategoryId(e.target.value)}
              disabled={loadingOptions}
            >
              <option value="">Any type</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <FiUsers size={12} /> Business Size
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={sizeBand}
              onChange={(e) => setSizeBand(e.target.value as SizeBand | '')}
              disabled={loadingOptions}
            >
              <option value="">Any size</option>
              {SIZE_BAND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label} ({o.hint})</option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Leaving business type or size unselected shows the standard county rate where available, or a
          price range if it varies.
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            <FiInfo size={14} className="flex-shrink-0" /> {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCalculate}
          disabled={loadingResults || loadingOptions}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-sm transition-colors disabled:opacity-60"
        >
          {loadingResults ? <FiLoader className="animate-spin" size={16} /> : <FiFileText size={16} />}
          {loadingResults ? 'Calculating…' : 'Calculate Costs'}
        </button>
      </div>

      {/* Results */}
      {results !== null && (
        <div className="space-y-4">
          {availableItems.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100 p-5 sm:p-6 text-center">
              <p className="text-sm text-slate-600 mb-1">
                Estimated total for {resultCountyName}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
                {hasRangeItem || totals.low !== totals.high
                  ? `KSh ${totals.low.toLocaleString()} – ${totals.high.toLocaleString()}`
                  : `KSh ${totals.low.toLocaleString()}`}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Based on {availableItems.length} {availableItems.length === 1 ? 'requirement' : 'requirements'} with pricing on file
              </p>
            </div>
          )}

          <div className="space-y-3">
            {availableItems.map((item) => (
              <div key={item.templateId} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                  <span className="text-base font-bold text-slate-900 whitespace-nowrap">
                    {item.resolution.status === 'exact'
                      ? `KSh ${item.resolution.price.toLocaleString()}`
                      : item.resolution.status === 'range'
                      ? `KSh ${item.resolution.lowPrice.toLocaleString()} – ${item.resolution.highPrice.toLocaleString()}`
                      : '—'}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 mb-2">{item.description}</p>
                )}
                {item.resolution.status === 'exact' && (
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {formatDuration(item.resolution.matchedRow.validityValue, item.resolution.matchedRow.validityUnit) && (
                      <span>Validity: {formatDuration(item.resolution.matchedRow.validityValue, item.resolution.matchedRow.validityUnit)}</span>
                    )}
                    {formatProcessingTime(item.resolution.matchedRow.processingTimeMinDays, item.resolution.matchedRow.processingTimeMaxDays) && (
                      <span>Processing: {formatProcessingTime(item.resolution.matchedRow.processingTimeMinDays, item.resolution.matchedRow.processingTimeMaxDays)}</span>
                    )}
                  </div>
                )}
                {item.resolution.status === 'range' && (
                  <p className="text-xs text-amber-600">Price varies by business type/size in this county.</p>
                )}
              </div>
            ))}
          </div>

          {unavailableItems.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
              <p className="text-sm font-medium text-amber-800 mb-1.5">
                Not yet priced for {resultCountyName}
              </p>
              <ul className="text-xs text-amber-700 space-y-1">
                {unavailableItems.map((item) => (
                  <li key={item.templateId}>• {item.name}</li>
                ))}
              </ul>
              <a href="/contact" className="inline-block mt-2 text-xs text-amber-800 underline">
                Let us know and we&apos;ll add pricing for these
              </a>
            </div>
          )}

          {availableItems.length === 0 && unavailableItems.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No county-issued requirements are configured yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}