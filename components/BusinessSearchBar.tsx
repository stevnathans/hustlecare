// components/BusinessSearchBar.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type BusinessResult = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  costMin: number | null;
  costMax: number | null;
  category: { name: string; slug: string } | null;
  _count: { requirements: number };
};

export default function BusinessSearchBar({
  placeholder = "What business do you want to start? e.g. 'Bakery', 'Salon'…",
}: { placeholder?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BusinessResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searched, setSearched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearched(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/business/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const goTo = (slug: string) => { setOpen(false); router.push(`/business/${slug}`); };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) goTo(results[activeIndex].slug); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <input
        type="text"
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-4 text-sm text-gray-400">Searching…</div>
          ) : results.length === 0 ? (
            searched && (
              <div className="p-4">
                <p className="mb-1 text-sm text-gray-500">No business called &ldquo;{query}&rdquo; yet.</p>
                <p className="text-xs text-gray-400">We&apos;re adding new business types regularly — try a broader term.</p>
              </div>
            )
          ) : (
            results.map((b, i) => (
              <button
                key={b.id}
                onClick={() => goTo(b.slug)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${i === activeIndex ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}
              >
                {b.image ? (
                  <Image src={b.image} alt={b.name} width={36} height={36} className="flex-shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{b.name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    {b.category?.name && <span>{b.category.name}</span>}
                    {b.costMin != null && <span>· from KSh {b.costMin.toLocaleString()}</span>}
                    <span>· {b._count.requirements} requirements</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}