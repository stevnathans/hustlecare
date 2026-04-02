'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, X, SlidersHorizontal, ChevronDown, ArrowRight,
  ShoppingBag, Utensils, Laptop, Scissors, Truck, Wrench,
  Heart, GraduationCap, Home, Leaf, Zap, Camera, Music,
  Package, Briefcase, DollarSign, Users, Globe,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryCardData {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  _count?: { businesses: number };
}

type SortOption = 'name-asc' | 'name-desc' | 'count-desc' | 'count-asc';

const SORT_LABELS: Record<SortOption, string> = {
  'count-desc': 'Most businesses',
  'count-asc':  'Fewest businesses',
  'name-asc':   'Name A → Z',
  'name-desc':  'Name Z → A',
};

// ── Icon map — matches category names to icons ─────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  retail:       ShoppingBag,
  food:         Utensils,
  restaurant:   Utensils,
  tech:         Laptop,
  technology:   Laptop,
  beauty:       Scissors,
  salon:        Scissors,
  logistics:    Truck,
  transport:    Truck,
  repair:       Wrench,
  health:       Heart,
  healthcare:   Heart,
  education:    GraduationCap,
  real:         Home,
  property:     Home,
  agriculture:  Leaf,
  farm:         Leaf,
  energy:       Zap,
  media:        Camera,
  photography:  Camera,
  music:        Music,
  events:       Music,
  manufacturing: Package,
  consulting:   Briefcase,
  finance:      DollarSign,
  community:    Users,
  online:       Globe,
};

function getCategoryIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return Briefcase;
}

// ── Colour palette — cycles through accent colours per card ───────────────────

const ACCENTS = [
  { bar: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700' },
  { bar: 'bg-teal-500',    iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',    badge: 'bg-teal-50 text-teal-700' },
  { bar: 'bg-blue-500',    iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    badge: 'bg-blue-50 text-blue-700' },
  { bar: 'bg-violet-500',  iconBg: 'bg-violet-50',  iconColor: 'text-violet-600',  badge: 'bg-violet-50 text-violet-700' },
  { bar: 'bg-amber-500',   iconBg: 'bg-amber-50',   iconColor: 'text-amber-600',   badge: 'bg-amber-50 text-amber-700' },
  { bar: 'bg-rose-500',    iconBg: 'bg-rose-50',    iconColor: 'text-rose-600',    badge: 'bg-rose-50 text-rose-700' },
];

// ── CategoryCard ──────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: CategoryCardData;
  href: string;
  accentIndex: number;
}

function CategoryCard({ category, href, accentIndex }: CategoryCardProps) {
  const accent = ACCENTS[accentIndex % ACCENTS.length];
  const Icon = getCategoryIcon(category.name);
  const count = category._count?.businesses ?? 0;

  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex overflow-hidden"
    >
      {/* Left accent bar */}
      <div className={`w-1 flex-shrink-0 ${accent.bar} rounded-l-2xl`} />

      {/* Card body */}
      <div className="flex-1 p-5 flex flex-col gap-4">
        {/* Top row: icon + count */}
        <div className="flex items-start justify-between gap-3">
          <div className={`w-11 h-11 rounded-xl ${accent.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`w-5 h-5 ${accent.iconColor}`} strokeWidth={1.75} />
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-gray-900 leading-none tabular-nums">
              {count > 0 ? count : '—'}
            </div>
            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-0.5">
              {count === 1 ? 'business' : 'businesses'}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-xs text-gray-400 mt-1 leading-relaxed line-clamp-2">
              {category.description}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accent.badge}`}>
            {count > 0 ? `${count} listed` : 'No listings yet'}
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 group-hover:text-emerald-600 transition-colors">
            Explore
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden animate-pulse">
      <div className="w-1 bg-gray-200 rounded-l-2xl flex-shrink-0" />
      <div className="flex-1 p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-gray-100" />
          <div className="text-right space-y-1.5">
            <div className="h-7 w-8 bg-gray-100 rounded ml-auto" />
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
          <div className="h-3 w-1/2 bg-gray-100 rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t border-gray-50">
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
          <div className="h-4 w-14 bg-gray-100 rounded" />
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

  const categoryHref = (name: string) =>
    `/categories/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="relative bg-white border-b border-gray-100 overflow-hidden">
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle, #059669 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
          aria-hidden="true"
        />
        {/* Emerald glow blob */}
        <div
          className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-20">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.05]">
                Business<br className="hidden sm:block" />{' '}
                <span className="text-emerald-600">Categories</span>
              </h1>
            </div>

            {/* Stats pills */}
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
          {/* Search */}
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

          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              aria-expanded={sortOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 hover:border-emerald-300 hover:bg-white shadow-sm hover:shadow-md transition-all whitespace-nowrap"
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

          {/* Hide-empty toggle */}
          <button
            onClick={() => setHideEmpty(!hideEmpty)}
            aria-pressed={hideEmpty}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-medium border shadow-sm transition-all whitespace-nowrap ${
              hideEmpty
                ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-md'
                : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-white hover:shadow-md'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 auto-rows-fr">
            {filtered.map((category, idx) => (
              <CategoryCard
                key={category.id}
                category={category}
                href={categoryHref(category.name)}
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