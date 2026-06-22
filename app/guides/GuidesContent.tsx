// app/guides/GuidesContent.tsx
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import GuideCard from './GuideCard';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Guide {
  id:            number;
  title:         string | null;
  intro:         string | null;
  isPublished:   boolean;
  publishedAt:   string | null;
  stepCount:     number;
  faqCount:      number;
  business: {
    name:     string;
    slug:     string;
    image:    string | null;
    category: string | null;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GUIDES_PER_PAGE = 12;


// ── Paginator ─────────────────────────────────────────────────────────────────

function Paginator({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1 mt-12">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`e${i}`} className="px-2 text-gray-400 select-none">…</span>
        ) : (
          <button key={page} onClick={() => onPageChange(page as number)}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`min-w-[2.25rem] h-9 px-3 rounded-lg text-sm font-medium border transition-colors ${
              currentPage === page
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
            }`}>
            {page}
          </button>
        )
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}


// ── Main Component ────────────────────────────────────────────────────────────

export default function GuidesContent() {
  const [guides,      setGuides]      = useState<Guide[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch('/api/guides')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setGuides(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [search, category]);

  const categories = useMemo(() => {
    const cats = guides.map(g => g.business.category).filter(Boolean) as string[];
    return ['all', ...Array.from(new Set(cats)).sort()];
  }, [guides]);

  const filtered = useMemo(() => {
    let f = guides;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(g =>
        g.business.name.toLowerCase().includes(q) ||
        g.title?.toLowerCase().includes(q) ||
        g.business.category?.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') f = f.filter(g => g.business.category === category);
    return f;
  }, [guides, search, category]);

  const totalPages      = Math.ceil(filtered.length / GUIDES_PER_PAGE);
  const paginated       = useMemo(() => {
    const start = (currentPage - 1) * GUIDES_PER_PAGE;
    return filtered.slice(start, start + GUIDES_PER_PAGE);
  }, [filtered, currentPage]);

  function handlePageChange(p: number) {
    setCurrentPage(p);
    document.getElementById('guides-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const year       = new Date().getFullYear();
  const heroCount  = guides.length;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <header className="relative bg-gradient-to-r from-emerald-600 to-teal-500 px-4 sm:px-6 lg:px-8 py-20 md:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover" aria-hidden="true" />

        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-teal-300/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex justify-center items-center gap-1.5 text-xs text-emerald-200">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li className="text-emerald-300">/</li>
              <li><Link href="/businesses" className="hover:text-white transition-colors">Businesses</Link></li>
              <li className="text-emerald-300">/</li>
              <li className="text-white font-medium">How-To Guides</li>
            </ol>
          </nav>

        
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-5 leading-tight">
            {loading
              ? `Learn How to Start Any Business in Kenya (${year})`
              : heroCount > 0
                ? `Learn How to Start Any Business in Kenya (${year})`
                : `How to Start a Business in Kenya (${year})`
            }
          </h1>
          <p className="text-lg text-emerald-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Free step-by-step guides on starting any business in Kenya. Each guide walks you through registration, sourcing, hiring, and getting your first customers.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="pl-5 pr-3 text-gray-400">
                <Search className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                type="search"
                placeholder="Search guides (e.g. 'salon', 'poultry', 'barbershop')…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search business guides"
                className="w-full px-3 py-4 border-0 focus:outline-none focus:ring-0 text-base placeholder-gray-400 text-gray-800"
              />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search" className="px-4 text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick stats */}
          {!loading && heroCount > 0 && (
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {[
                { value: heroCount,                          label: 'Guides'      },
                { value: categories.length - 1,             label: 'Categories'  },
                { value: guides.reduce((s, g) => s + g.stepCount, 0), label: 'Total steps' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-emerald-200 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">

          {/* ── Category filter strip ── */}
          {!loading && categories.length > 1 && (
            <nav aria-label="Filter by category" className="mb-8">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Browse by category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    aria-pressed={category === cat}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 whitespace-nowrap ${
                      category === cat
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700'
                    }`}
                  >
                    {cat === 'all' ? 'All guides' : cat}
                    {category === cat && cat !== 'all' && <X className="w-3 h-3 opacity-70" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </nav>
          )}

          {/* ── Grid header ── */}
          <div
            id="guides-grid"
            className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 scroll-mt-8"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {category === 'all' ? 'All Business Guides' : `${category} Guides`}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {filtered.length} {filtered.length === 1 ? 'guide' : 'guides'} available
                {totalPages > 1 && <span className="text-gray-400"> — page {currentPage} of {totalPages}</span>}
              </p>
            </div>
            {(search || category !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCategory('all'); }}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors self-start sm:self-auto"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ── Cards ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true">
              {Array.from({ length: GUIDES_PER_PAGE }).map((_, i) => (
                <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <>
              <section aria-label="Business guides grid">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {paginated.map(guide => (
                    <GuideCard
                      key={guide.id}
                      title={guide.title ?? ''}
                      businessName={guide.business.name}
                      businessSlug={guide.business.slug}
                      businessImage={guide.business.image}
                      category={guide.business.category}
                      stepCount={guide.stepCount}
                      faqCount={guide.faqCount}
                      intro={guide.intro}
                      publishedAt={guide.publishedAt}
                    />
                  ))}
                </div>
              </section>
              <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
              <BookOpen className="w-16 h-16 mx-auto text-gray-200 mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No guides found</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                {search
                  ? `No guides match "${search}". Try a different search term.`
                  : `No guides in the "${category}" category yet.`
                }
              </p>
              <button
                onClick={() => { setSearch(''); setCategory('all'); }}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                View all guides
              </button>
            </div>
          )}

          {/* ── Bottom CTA ── */}
          {!loading && guides.length > 0 && (
            <div className="mt-16 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 md:p-10 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')]" aria-hidden="true" />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Looking for more than a guide?
                </h2>
                <p className="text-emerald-100 text-sm mb-6 max-w-lg mx-auto">
                  Each guide links to a full requirements checklist, startup cost calculator, and local supplier directory for that business.
                </p>
                <Link
                  href="/businesses"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-md text-sm"
                >
                  Explore all business ideas
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          
        </div>
      </main>
    </div>
  );
}