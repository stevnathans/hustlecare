'use client';
// components/DetailsPage/CountySelector.tsx
//
// Single county selector at the business-page level (not per-requirement).
// Changing it immediately updates every Legal requirement (hard filter) and
// re-sorts every other category's products (soft prioritize) — see
// BusinessPageContent.tsx for the filtering/sorting logic itself.

import { useCounty } from '@/contexts/CountyContext';
import { MapPin } from 'lucide-react';

export default function CountySelector() {
  const { counties, selectedCounty, setSelectedCounty, loading } = useCounty();

  if (loading || counties.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <label htmlFor="county-select" className="text-sm text-slate-600 font-medium">
        Your county:
      </label>
      <select
        id="county-select"
        value={selectedCounty?.slug ?? ''}
        onChange={(e) => {
          const c = counties.find((c) => c.slug === e.target.value);
          setSelectedCounty(c ?? null);
        }}
        className="text-sm border border-slate-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        <option value="">All counties</option>
        {counties.map((c) => (
          <option key={c.id} value={c.slug}>{c.name}</option>
        ))}
      </select>
      {selectedCounty && (
        <span className="text-xs text-slate-400">
          Legal requirements now show {selectedCounty.name}-specific options; other categories are sorted to prioritize vendors near you.
        </span>
      )}
    </div>
  );
}