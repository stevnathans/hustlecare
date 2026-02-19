'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import BusinessCard from '@/components/business/BusinessCards';
import { getCategoryIcon } from '@/components/CategoryCard';
import { Search, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';

type Requirement = {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  necessity: string;
  businessId: number;
  createdAt: Date;
  updatedAt: Date;
};

type Business = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  published: boolean;
  estimatedCost?: string;
  timeToLaunch?: string;
  groupedRequirements: Record<string, Requirement[]>;
  _count?: { requirements: number };
};

type CategoryDetail = {
  id: number;
  name: string;
  createdAt: string;
  businesses: Business[];
  _count: { businesses: number };
};

type SortOption = 'default' | 'name-asc' | 'name-desc' | 'cost-low' | 'cost-high';

const SORT_LABELS: Record<SortOption, string> = {
  default:     'Default',
  'name-asc':  'Name A → Z',
  'name-desc': 'Name Z → A',
  'cost-low':  'Cost: Low → High',
  'cost-high': 'Cost: High → Low',
};

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [category, setCategory]           = useState<CategoryDetail | null>(null);
  const [loading, setLoading]             = useState(true);
  const [notFound, setNotFound]           = useState(false);
  const [search, setSearch]               = useState('');
  const [sort, setSort]                   = useState<SortOption>('default');
  const [showUnpublished, setShowUnpublished] = useState(false);
  const [sortOpen, setSortOpen]           = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/categories/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => { if (data) setCategory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const filtered = useMemo(() => {
    if (!category) return [];
    let result = [...category.businesses];

    if (!showUnpublished) result = result.filter((b) => b.published);

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) => b.name.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name)); break;
      case 'cost-low':
        result.sort((a, b) => {
          const ac = parseInt(a.estimatedCost?.replace(/\D/g, '') || '0');
          const bc = parseInt(b.estimatedCost?.replace(/\D/g, '') || '0');
          return ac - bc;
        }); break;
      case 'cost-high':
        result.sort((a, b) => {
          const ac = parseInt(a.estimatedCost?.replace(/\D/g, '') || '0');
          const bc = parseInt(b.estimatedCost?.replace(/\D/g, '') || '0');
          return bc - ac;
        }); break;
    }

    return result;
  }, [category, search, sort, showUnpublished]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-[3px] border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !category) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Search className="w-7 h-7 text-gray-300" />
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">Category not found</h1>
        <p className="text-gray-400 text-sm mb-6">
          We couldn&apos;t find a category matching &ldquo;{slug}&rdquo;.
        </p>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to categories
        </Link>
      </div>
    );
  }

  const Icon = getCategoryIcon(category.name);
  const publishedCount = category.businesses.filter((b) => b.published).length;
  const draftCount = category._count.businesses - publishedCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-600 transition-colors mb-5 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            All categories
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {category.name}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {publishedCount.toLocaleString()} business{publishedCount !== 1 ? 'es' : ''}
                {draftCount > 0 && (
                  <span className="text-gray-300"> &middot; {draftCount} draft{draftCount !== 1 ? 's' : ''}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search in ${category.name}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-emerald-300 shadow-sm transition-colors whitespace-nowrap"
            >
              {SORT_LABELS[sort]}
              <X className={`w-3 h-3 text-gray-300 transition-transform duration-200 ${sortOpen ? 'rotate-0' : 'rotate-45'}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-48 py-1">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSort(key); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
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

          {/* Show drafts — only if drafts exist */}
          {draftCount > 0 && (
            <button
              onClick={() => setShowUnpublished(!showUnpublished)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border shadow-sm transition-colors whitespace-nowrap ${
                showUnpublished
                  ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showUnpublished ? 'Showing all' : 'Show drafts'}
            </button>
          )}
        </div>

        {/* Result count when filtering */}
        {(search || sort !== 'default') && (
          <p className="text-xs text-gray-400 mb-5">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {search && <> for <span className="text-gray-600 font-medium">&ldquo;{search}&rdquo;</span></>}
          </p>
        )}

        {/* Business cards — same grid as /businesses page */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((biz) => (
              <BusinessCard
                key={biz.id}
                id={biz.id}
                name={biz.name}
                image={biz.image}
                slug={biz.slug}
                category={category.name}
                estimatedCost={biz.estimatedCost}
                timeToLaunch={biz.timeToLaunch}
                groupedRequirements={biz.groupedRequirements ?? {}}
                requirements={[]}
                sortedCategories={[]}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <Search className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No businesses found</p>
            <p className="text-xs text-gray-400 mt-1">
              {search
                ? `Nothing in ${category.name} matches "${search}"`
                : `No published businesses in ${category.name} yet`}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-xs text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}