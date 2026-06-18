'use client';
import { useEffect, useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import CategoryCard, { type CategoryCardData } from '@/components/CategoryCard';

// ── Types ─────────────────────────────────────────────────────────────────────

type SortOption = 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc';

const SORT_LABELS: Record<SortOption, string> = {
  'count-desc': 'Most businesses',
  'count-asc':  'Fewest businesses',
  'name-asc':   'Name A → Z',
  'name-desc':  'Name Z → A',
};

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="bg-gray-200 px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-300" />
          <div className="h-6 w-24 rounded-full bg-gray-300" />
        </div>
        <div className="mt-3 h-5 w-3/4 rounded bg-gray-300" />
      </div>
      <div className="px-5 pt-3 pb-4 flex flex-col gap-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-0">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="h-3 rounded bg-gray-100" style={{ width: `${50 + (i % 3) * 18}%` }} />
          </div>
        ))}
        <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between">
          <div className="h-3 w-16 rounded bg-gray-100" />
          <div className="h-3 w-4 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryCardData[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [sort, setSort]             = useState<SortOption>('count-desc');
  const [hideEmpty, setHideEmpty]   = useState(false);
  const [sortOpen, setSortOpen]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => { setCategories(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = [...categories];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (hideEmpty) result = result.filter((c) => (c._count?.businesses ?? 0) > 0);
    result.sort((a, b) => {
      const ac = a._count?.businesses ?? 0;
      const bc = b._count?.businesses ?? 0;
      switch (sort) {
        case 'name-asc':   return a.name.localeCompare(b.name);
        case 'name-desc':  return b.name.localeCompare(a.name);
        case 'count-desc': return bc - ac;
        case 'count-asc':  return ac - bc;
      }
    });
    return result;
  }, [categories, search, sort, hideEmpty]);

  const totalBusinesses = useMemo(
    () => categories.reduce((s, c) => s + (c._count?.businesses ?? 0), 0),
    [categories]
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, #059669 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.05]">
              Business<br className="hidden sm:block" />{' '}
              <span className="text-emerald-600">Categories</span>
            </h1>

            {!loading && (
              <div className="flex flex-wrap gap-3 md:flex-col md:items-end md:gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm">
                  <span className="font-black text-gray-900 text-lg leading-none">{categories.length}</span>
                  <span className="text-gray-500 font-medium">categories</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm">
                  <span className="font-black text-emerald-700 text-lg leading-none">{totalBusinesses.toLocaleString()}</span>
                  <span className="text-emerald-600 font-medium">businesses</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search categories"
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
              {SORT_LABELS[sort]}
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div
                  role="listbox"
                  className="absolute right-0 top-full mt-2 z-20 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden w-48 py-1"
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      role="option"
                      aria-selected={sort === key}
                      onClick={() => { setSort(key); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        sort === key
                          ? 'text-emerald-700 font-semibold bg-emerald-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setHideEmpty(!hideEmpty)}
            aria-pressed={hideEmpty}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium border shadow-sm transition-all whitespace-nowrap ${
              hideEmpty
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:shadow-md'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hideEmpty ? 'Showing active' : 'Active only'}
          </button>
        </div>

        {/* Result count */}
        {(search || hideEmpty) && !loading && (
          <p className="text-sm text-gray-500 mb-6">
            <span className="font-semibold text-gray-900">{filtered.length}</span>{' '}
            result{filtered.length !== 1 ? 's' : ''}
            {search && (
              <> for <span className="text-gray-700 font-medium">&ldquo;{search}&rdquo;</span></>
            )}
          </p>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((category, idx) => (
              <CategoryCard
                key={category.id}
                category={category}
                accentIndex={idx}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-base font-semibold text-gray-700">No categories found</p>
            <p className="text-sm text-gray-400 mt-1.5">
              {search ? `Nothing matches "${search}"` : 'Try adjusting your filters'}
            </p>
            <button
              onClick={() => { setSearch(''); setHideEmpty(false); }}
              className="mt-6 text-sm text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-4 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}