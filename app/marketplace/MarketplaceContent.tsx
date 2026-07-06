// app/marketplace/MarketplaceContent.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SlidersHorizontal, ShieldCheck, Truck, X, ArrowRight, FileText } from 'lucide-react';

type CategoryFacet = { name: string; count: number };
type BusinessSuggestion = { id: number; name: string; slug: string };
type ActiveBusiness = { id: number; name: string; slug: string };

type Product = {
  id: number; name: string; price: number | null; priceMin: number | null; priceMax: number | null;
  currency: string; image: string | null; condition: string; negotiable: boolean;
  deliveryAvailable: boolean;
  vendor: { id: number; name: string; slug: string; logo: string | null; isVerified: boolean } | null;
  template: { id: number; name: string; category: string; necessity: string } | null;
  bulkPricing: { minQty: number; price: number }[];
};

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<CategoryFacet[]>([]);
  const [matchedBusinesses, setMatchedBusinesses] = useState<BusinessSuggestion[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<ActiveBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');

  const q = searchParams.get('q') || '';
  const businessSlug = searchParams.get('business') || '';
  const category = searchParams.get('category') || '';
  const condition = searchParams.get('condition') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page')) || 1;
  const pageSize = 20;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (businessSlug) params.set('business', businessSlug);
    if (category) params.set('category', category);
    if (condition) params.set('condition', condition);
    params.set('sort', sort);
    params.set('page', String(page));
    try {
      const res = await fetch(`/api/marketplace/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
      setCategories(data.categories || []);
      setMatchedBusinesses(data.matchedBusinesses || []);
      setActiveBusiness(data.activeBusiness || null);
    } finally {
      setLoading(false);
    }
  }, [q, businessSlug, category, condition, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Debounced search-as-you-type
  useEffect(() => {
    const t = setTimeout(() => {
      if (inputValue !== q) updateParams({ q: inputValue, business: '' });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value); else params.delete(key);
    });
    params.delete('page');
    router.push(`/marketplace?${params}`);
  };

  const selectBusiness = (b: BusinessSuggestion) => {
    setInputValue(b.name);
    updateParams({ business: b.slug, q: '' });
  };

  const clearBusiness = () => {
    setInputValue('');
    updateParams({ business: '', q: '' });
  };

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Marketplace</h1>
          <p className="mb-5 text-sm text-gray-500">
            Search by what you&apos;re starting — e.g. &ldquo;Barbershop&rdquo; or &ldquo;Bakery&rdquo; — or search for a specific product.
          </p>
          <div className="relative max-w-lg">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. Barbershop, clippers, POS system…"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          {/* Business disambiguation strip — shown when the free-text query
              matches more than one business, so "Salon" doesn't silently
              merge Hair Salon + Nail Salon results without explanation. */}
          {matchedBusinesses.length > 0 && !activeBusiness && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Shop for a specific business:</span>
              {matchedBusinesses.map((b) => (
                <button
                  key={b.id}
                  onClick={() => selectBusiness(b)}
                  className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business context banner — the thing that makes this feel purpose-built
          rather than a generic store. Ties back into the core product. */}
      {activeBusiness && (
        <div className="border-b border-emerald-100 bg-emerald-50">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Showing {total} product{total !== 1 ? 's' : ''} for starting a {activeBusiness.name} business
              </p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs">
                <Link href={`/businesses/${activeBusiness.slug}/how-to-start`} className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                  How to start a {activeBusiness.name} business <ArrowRight className="h-3 w-3" />
                </Link>
                <Link href={`/businesses/${activeBusiness.slug}/requirements`} className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline">
                  <FileText className="h-3 w-3" /> Full requirements checklist
                </Link>
              </div>
            </div>
            <button onClick={clearBusiness} className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Category chips — real data, ordered to match the rest of the app */}
        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => updateParams({ category: '' })}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${!category ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              All ({categories.reduce((s, c) => s + c.count, 0)})
            </button>
            {categories.map((c) => (
              <button
                key={c.name}
                onClick={() => updateParams({ category: c.name })}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${category === c.name ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {c.name} ({c.count})
              </button>
            ))}
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          {['', 'NEW', 'USED'].map((c) => (
            <button
              key={c || 'all'}
              onClick={() => updateParams({ condition: c })}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${condition === c ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              {c === '' ? 'All conditions' : c === 'NEW' ? 'Brand New' : 'Used'}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value })}
            className="ml-auto rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-400">
            {activeBusiness
              ? <>No products tagged to {activeBusiness.name} yet. <Link href={`/businesses/${activeBusiness.slug}/requirements`} className="font-semibold text-emerald-600 hover:underline">View the full requirements checklist</Link> for what&apos;s needed.</>
              : 'No products match your search.'}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-400">{total} product{total !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/marketplace/products/${p.id}-${slugify(p.name)}`}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="relative aspect-square bg-gray-50">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill className="object-cover p-3 transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">No image</div>
                    )}
                    {p.condition === 'USED' && (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-700">Used</span>
                    )}
                  </div>
                  <div className="p-3">
                    {/* Requirement context — the thing a generic product page
                        wouldn't show, but essential here: buyers think in
                        terms of "what does this satisfy," not just "product." */}
                    {p.template && (
                      <span className="mb-1 inline-block rounded-full bg-indigo-50 px-1.5 py-0.5 text-[0.6rem] font-bold text-indigo-600">
                        {p.template.name}
                      </span>
                    )}
                    <p className="mb-1 line-clamp-2 text-xs font-semibold text-gray-800">{p.name}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {p.price != null ? `${p.currency} ${p.price.toLocaleString()}` : p.priceMin != null ? `From ${p.currency} ${p.priceMin.toLocaleString()}` : '—'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[0.65rem] text-gray-400">
                      {p.vendor?.isVerified && <ShieldCheck className="h-3 w-3 text-emerald-500" />}
                      {p.deliveryAvailable && <Truck className="h-3 w-3" />}
                      {p.vendor?.name && <span className="truncate">{p.vendor.name}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateParams({ page: String(i + 1) })}
                    className={`h-8 w-8 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}