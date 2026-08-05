'use client';
// components/DetailsPage/CountySelector.tsx
//
// Single county selector at the business-page level (not per-requirement).
// Lives in the sticky nav bar so it stays visible while scrolling.
// Changing it immediately updates every Legal requirement (hard filter) and
// re-sorts every other category's products (soft prioritize) — see
// BusinessPageContent.tsx for the filtering/sorting logic itself.

import { useCounty } from '@/contexts/CountyContext';

export default function CountySelector() {
  const { counties, selectedCounty, setSelectedCounty, loading } = useCounty();

  if (loading || counties.length === 0) return null;

  return (
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
  );
}