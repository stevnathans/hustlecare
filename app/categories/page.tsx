/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import CategoryCard, { CategoryCardData } from '@/components/CategoryCard';
import { Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react';

type SortOption = 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc';

const SORT_LABELS: Record<SortOption, string> = {
  'count-desc': 'Most businesses',
  'count-asc':  'Fewest businesses',
  'name-asc':   'Name A → Z',
  'name-desc':  'Name Z → A',
};

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

    if (hideEmpty) {
      result = result.filter((c) => (c._count?.businesses ?? 0) > 0);
    }

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

  // Slug-safe href
  const categoryHref = (name: string) =>
    `/categories/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50/50 to-white">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/30 to-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-50 to-white border-b border-emerald-100/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-[0.2em] mb-3">
            Browse
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
            Business Categories
          </h1>
          <p className="text-gray-500 text-base mt-3">
            {categories.length} categories · {totalBusinesses.toLocaleString()} businesses
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full pl-11 pr-10 py-3 bg-white/80 backdrop-blur-sm
                border border-emerald-100 rounded-2xl text-sm text-gray-800
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                shadow-sm hover:shadow-md transition-shadow
              "
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="
                flex items-center gap-2 px-5 py-3 bg-white/80 backdrop-blur-sm
                border border-emerald-100 rounded-2xl text-sm text-gray-700
                hover:border-emerald-300 hover:bg-white
                shadow-sm hover:shadow-md transition-all whitespace-nowrap
              "
            >
              <ChevronDown className="w-4 h-4 text-gray-400" />
              {SORT_LABELS[sort]}
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-20 bg-white/90 backdrop-blur-md border border-emerald-100 rounded-2xl shadow-xl overflow-hidden w-48 py-1">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSort(key); setSortOpen(false); }}
                      className={`
                        w-full text-left px-4 py-2.5 text-sm transition-colors
                        ${sort === key
                          ? 'text-emerald-700 font-semibold bg-emerald-50'
                          : 'text-gray-600 hover:bg-emerald-50/50'}
                      `}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Hide empty toggle */}
          <button
            onClick={() => setHideEmpty(!hideEmpty)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium
              border shadow-sm transition-all whitespace-nowrap
              ${hideEmpty
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md'
                : 'bg-white/80 backdrop-blur-sm text-gray-700 border-emerald-100 hover:border-emerald-300 hover:bg-white hover:shadow-md'}
            `}
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hideEmpty ? 'Showing active' : 'Active only'}
          </button>
        </div>

        {/* Result count */}
        {(search || hideEmpty) && (
          <p className="text-sm text-gray-500 mb-5 animate-in fade-in slide-in-from-top-2 duration-300">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {search && <> for <span className="text-gray-700 font-medium">&ldquo;{search}&rdquo;</span></>}
          </p>
        )}

        {/* Cards grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {filtered.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                href={categoryHref(category.name)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-base font-medium text-gray-600">No categories found</p>
            <p className="text-sm text-gray-400 mt-1.5">
              {search ? `Nothing matches "${search}"` : 'Try adjusting your filters'}
            </p>
            <button
              onClick={() => { setSearch(''); setHideEmpty(false); }}
              className="mt-6 text-sm text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-4 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}