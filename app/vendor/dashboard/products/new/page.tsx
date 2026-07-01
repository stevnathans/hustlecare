'use client';
// app/vendor/dashboard/products/new/page.tsx
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Save, Send, Loader2, AlertCircle, CheckCircle2,
  Tag, Package, DollarSign, Layers, Info, Search, X, ChevronRight,
} from 'lucide-react';
import { AppealModal, VendorAppealData } from '@/components/vendors/SuspensionNotice';

type Template = {
  id: number;
  name: string;
  category: string;
  necessity: string;
  _count?: { businesses: number };
};

type ProductFormProps = { productId?: number };

export default function NewProductPage() {
  return <ProductForm />;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router    = useRouter();
  const isEditing = !!productId;

  const [templates,       setTemplates]       = useState<Template[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingTemplates,setLoadingTemplates] = useState(true);
  const [loadingProduct,  setLoadingProduct]  = useState(isEditing);
  const [checkingAccess,  setCheckingAccess]  = useState(!isEditing);
  const [error,           setError]           = useState('');
  const [saved,           setSaved]           = useState(false);
  const [suspendedVendor, setSuspendedVendor] = useState<VendorAppealData | null>(null);
  const [pickerOpen,      setPickerOpen]      = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', price: '', priceMin: '', priceMax: '',
    currency: 'KES', image: '', url: '', sku: '', stock: '',
    templateId: '', usePriceRange: false,
  });

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/requirements');
      if (res.ok) setTemplates(await res.json());
    } finally { setLoadingTemplates(false); }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendors/products/${productId}`);
      if (!res.ok) { router.push('/vendor/dashboard/products'); return; }
      const p = await res.json();
      setForm({
        name: p.name ?? '', description: p.description ?? '',
        price: p.price?.toString() ?? '', priceMin: p.priceMin?.toString() ?? '', priceMax: p.priceMax?.toString() ?? '',
        currency: p.currency ?? 'KES', image: p.image ?? '', url: p.url ?? '',
        sku: p.sku ?? '', stock: p.stock?.toString() ?? '',
        templateId: p.templateId?.toString() ?? '',
        usePriceRange: !!(p.priceMin || p.priceMax),
      });
    } catch { router.push('/vendor/dashboard/products'); }
    finally { setLoadingProduct(false); }
  }, [productId, router]);

  useEffect(() => {
    if (!isEditing) {
      fetch('/api/vendors/profile')
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (p?.status === 'SUSPENDED') {
            setSuspendedVendor(p as VendorAppealData);
          }
          setCheckingAccess(false);
        })
        .catch(() => setCheckingAccess(false));
    }
    fetchTemplates();
    if (isEditing) fetchProduct();
  }, [fetchTemplates, fetchProduct, isEditing, router]);

  async function handleSave(submitForReview: boolean) {
    setError('');
    setLoading(true);
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        price:    form.usePriceRange ? null : (form.price    ? parseFloat(form.price)    : null),
        priceMin: form.usePriceRange ? (form.priceMin ? parseFloat(form.priceMin) : null) : null,
        priceMax: form.usePriceRange ? (form.priceMax ? parseFloat(form.priceMax) : null) : null,
        currency: form.currency,
        image:    form.image || null,
        url:      form.url   || null,
        sku:      form.sku   || null,
        stock:    form.stock ? parseInt(form.stock) : null,
        templateId: form.templateId ? parseInt(form.templateId) : null,
        submitForReview,
      };
      const url    = isEditing ? `/api/vendors/products/${productId}` : '/api/vendors/products';
      const method = isEditing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) {
        if (data.code === 'VENDOR_SUSPENDED') {
          const profRes = await fetch('/api/vendors/profile');
          if (profRes.ok) setSuspendedVendor(await profRes.json());
          return;
        }
        throw new Error(data.error);
      }
      setSaved(true);
      setTimeout(() => router.push('/vendor/dashboard/products'), 800);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setLoading(false); }
  }

  const selectedTemplate = templates.find(t => t.id.toString() === form.templateId);
  const canSubmit = !loading && !!form.name && !!form.templateId;

  if (checkingAccess || loadingProduct) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] pb-20 text-gray-900">
      {suspendedVendor && (
        <AppealModal
          vendor={suspendedVendor}
          context="addProduct"
          onClose={() => {
            if (isEditing) {
              setSuspendedVendor(null);
            } else {
              router.push('/vendor/dashboard/products');
            }
          }}
          onSubmitted={(update) => setSuspendedVendor(v => v ? { ...v, ...update } : v)}
        />
      )}

      <RequirementPickerModal
        isOpen={pickerOpen}
        templates={templates}
        loading={loadingTemplates}
        selectedId={form.templateId}
        onClose={() => setPickerOpen(false)}
        onSelect={(id) => {
          setForm(f => ({ ...f, templateId: id }));
          setPickerOpen(false);
        }}
      />

      {/* Header */}
      <div className="mb-7">
        <Link
          href="/vendor/dashboard/products"
          className="mb-2.5 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-emerald-600"
        >
          <ChevronLeft size={14} /> Back to Products
        </Link>
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          {isEditing
            ? 'Update your product. Changes require re-submission for review.'
            : 'Add a product to a requirement so entrepreneurs can find and buy it.'}
        </p>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 size={14} className="flex-shrink-0" /> Saved — redirecting…
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex flex-col gap-4">

          {/* Requirement */}
          <div className={cardCls}>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-emerald-600" />
                <h2 className={cardTitleCls}>Requirement</h2>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Which business requirement does this product fulfil?
              </p>
            </div>

            {loadingTemplates ? (
              <div className="h-14 animate-pulse rounded-xl bg-gray-100" />
            ) : (
              <div className="mb-2">
                <label className={labelCls}>
                  Select Requirement <span className="text-red-500">*</span>
                </label>

                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-sm transition-all duration-150 hover:border-emerald-400 hover:bg-emerald-50/40 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {selectedTemplate ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-gray-900">
                        {selectedTemplate.name}
                      </span>
                      <span className="flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[0.68rem] font-semibold text-indigo-600">
                        {selectedTemplate.category}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">Search and select a requirement…</span>
                  )}
                  <ChevronRight size={16} className="flex-shrink-0 text-gray-400" />
                </button>

                {selectedTemplate && (
                  <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                    <div className="mb-1.5 flex flex-wrap gap-1.5">
                      <span className="inline-flex rounded-full bg-indigo-100 px-2.5 py-0.5 text-[0.68rem] font-bold text-indigo-600">
                        {selectedTemplate.category}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${
                          selectedTemplate.necessity === 'Required'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {selectedTemplate.necessity}
                      </span>
                    </div>
                    <p className="m-0 text-xs leading-relaxed text-gray-500">
                      Your product will appear to any entrepreneur whose business includes this requirement.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className={cardCls}>
            <div className="mb-4 flex items-center gap-2">
              <Package size={14} className="text-indigo-500" />
              <h2 className={cardTitleCls}>Product Details</h2>
            </div>

            <div className="mb-4">
              <label className={labelCls}>
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                className={inputCls}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. HP Pavilion 15 Laptop"
              />
            </div>

            <div className="mb-4">
              <label className={labelCls}>Description</label>
              <textarea
                className={`${inputCls} resize-y leading-relaxed`}
                rows={4}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Specs, features, and why entrepreneurs should choose this product…"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Product Image URL</label>
                <input
                  className={inputCls}
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
              <div>
                <label className={labelCls}>Product / Buy Link</label>
                <input
                  className={inputCls}
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://…"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className={cardCls}>
            <div className="mb-4 flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-600" />
              <h2 className={cardTitleCls}>Pricing</h2>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Currency</label>
                <select
                  className={inputCls}
                  value={form.currency}
                  onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                >
                  {['KES', 'USD', 'UGX', 'TZS', 'NGN', 'ZAR', 'GHS'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className={`${labelCls} mb-0`}>Price type</label>
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs font-normal normal-case tracking-normal text-gray-500">
                    <input
                      type="checkbox"
                      checked={form.usePriceRange}
                      onChange={e => setForm(f => ({ ...f, usePriceRange: e.target.checked }))}
                      className="h-3.5 w-3.5 cursor-pointer accent-emerald-600"
                    />
                    Use range
                  </label>
                </div>
                <div className="mt-1.5">
                  {!form.usePriceRange ? (
                    <input
                      className={inputCls}
                      type="number"
                      placeholder="0.00"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-gray-400">Min</div>
                        <input
                          className={inputCls}
                          type="number"
                          placeholder="0.00"
                          value={form.priceMin}
                          onChange={e => setForm(f => ({ ...f, priceMin: e.target.value }))}
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-gray-400">Max</div>
                        <input
                          className={inputCls}
                          type="number"
                          placeholder="0.00"
                          value={form.priceMax}
                          onChange={e => setForm(f => ({ ...f, priceMax: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className={cardCls}>
            <div className="mb-3.5 flex items-center gap-2">
              <Layers size={13} className="text-gray-400" />
              <h2 className={cardTitleCls}>Inventory</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelCls}>SKU</label>
                <input
                  className={inputCls}
                  placeholder="Optional"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelCls}>Stock</label>
                <input
                  className={inputCls}
                  type="number"
                  placeholder="Unlimited"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                />
              </div>
            </div>
            <span className="mt-2 block text-xs text-gray-400">
              Leave stock blank for unlimited / untracked.
            </span>
          </div>

          {/* How it works */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <h3 className="mb-1.5 text-sm font-bold text-indigo-600">How tagging works</h3>
            <p className="m-0 text-xs leading-relaxed text-gray-500">
              Once approved, your product is automatically shown to every entrepreneur starting a business that includes the requirement you selected.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden flex-col gap-4 lg:flex">
          <div className={cardCls}>
            <h2 className={`${cardTitleCls} mb-3.5`}>Publish</h2>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit for Review
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={loading || !form.name}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <Save size={14} /> Save as Draft
              </button>
            </div>
            <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-gray-600">
              <Info size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <span>Products are reviewed by the Hustlecare team before going live — usually within 1–2 business days.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile publish bar */}
      <div className="fixed inset-x-0 z-20 flex gap-2.5 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-lg lg:hidden"
        style={{ bottom: 'calc(var(--vd-bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={loading || !form.name}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 disabled:opacity-50"
        >
          <Save size={14} /> Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={!canSubmit}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Submit for Review
        </button>
      </div>
    </div>
  );
}

/* ── Requirement Picker Modal ──────────────────────────────────────
   Styled to match AddProductToRequirementModal: overlay, search bar,
   grouped/filterable list, hover states, entry animation.          */

function RequirementPickerModal({
  isOpen,
  templates,
  loading,
  selectedId,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  templates: Template[];
  loading: boolean;
  selectedId: string;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) setSearch('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = search.toLowerCase();
  const filtered = templates.filter(
    t => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
  );
  const grouped = filtered.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      style={{ animation: 'rq-fadeIn 0.18s ease' }}
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: '85vh', animation: 'rq-slideUp 0.2s ease' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Select Requirement</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              Choose which business requirement this product fulfils.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          >
            <X className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-50 px-4 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requirements…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-400"
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400">
              <Search className="mx-auto mb-2 h-10 w-10 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm">No requirements found</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category} className="mb-4 last:mb-0">
                <div className="mb-1.5 px-1 text-[0.68rem] font-bold uppercase tracking-wider text-gray-400">
                  {category}
                </div>
                <div className="space-y-1.5">
                  {items.map(t => {
                    const isSelected = t.id.toString() === selectedId;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onSelect(t.id.toString())}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-gray-100 bg-gray-50 hover:border-emerald-200 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{t.name}</p>
                          <span
                            className={`mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[0.66rem] font-bold ${
                              t.necessity === 'Required'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {t.necessity}
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 size={16} className="flex-shrink-0 text-emerald-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-4 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rq-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rq-slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

/* ── Shared class strings ───────────────────────────────────────── */
const cardCls = 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm';
const cardTitleCls = 'text-sm font-bold text-gray-900';
const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500';
const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';