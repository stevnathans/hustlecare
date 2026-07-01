'use client';
// app/vendor/dashboard/products/page.tsx
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Edit2, Trash2, Eye,
  CheckCircle2, Clock, XCircle, Archive, Package,
  ShieldOff, EyeOff,
} from 'lucide-react';

type Product = {
  id: number;
  name: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  status: string;
  image: string | null;
  rejectReason: string | null;
  template: { id: number; name: string; category: string } | null;
  _count: { reviews: number; cartItems: number };
  createdAt: string;
  publishedAt: string | null;
};

type VendorProfile = { status: string; suspendReason: string | null };

const STATUS_TABS = [
  { key: '',               label: 'All' },
  { key: 'ACTIVE',         label: 'Live',      icon: <CheckCircle2 size={11} /> },
  { key: 'PENDING_REVIEW', label: 'In Review',  icon: <Clock size={11} /> },
  { key: 'DRAFT',          label: 'Draft',      icon: <EyeOff size={11} /> },
  { key: 'REJECTED',       label: 'Rejected',   icon: <XCircle size={11} /> },
  { key: 'ARCHIVED',       label: 'Archived',   icon: <Archive size={11} /> },
];

const STATUS_META: Record<string, { text: string; bg: string; label: string }> = {
  DRAFT:          { text: 'text-gray-500',    bg: 'bg-gray-100',    label: 'Draft'     },
  PENDING_REVIEW: { text: 'text-amber-600',   bg: 'bg-amber-100',   label: 'In Review' },
  ACTIVE:         { text: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Live'      },
  REJECTED:       { text: 'text-red-500',     bg: 'bg-red-100',     label: 'Rejected'  },
  ARCHIVED:       { text: 'text-gray-400',    bg: 'bg-gray-100',    label: 'Archived'  },
  INACTIVE:       { text: 'text-red-500',     bg: 'bg-red-50',      label: 'Inactive'  },
};

function resolveDisplayStatus(status: string, suspended: boolean) {
  return suspended && status === 'ARCHIVED' ? 'INACTIVE' : status;
}

export default function VendorProductsPage() {
  const searchParams = useSearchParams();
  const [profile,        setProfile]        = useState<VendorProfile | null>(null);
  const [products,       setProducts]       = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [activeTab,      setActiveTab]      = useState(searchParams.get('status') ?? '');
  const [deleteConfirm,  setDeleteConfirm]  = useState<number | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showSuspendNotice, setShowSuspendNotice] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/vendors/profile').then(r => r.ok ? r.json() : null),
      fetchProducts(),
    ]).then(([prof]) => setProfile(prof));
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/products');
      if (res.ok) setProducts(await res.json());
    } finally { setLoading(false); }
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  async function handleDelete(id: number) {
    try {
      const res  = await fetch(`/api/vendors/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
  }

  const isSuspended = profile?.status === 'SUSPENDED';

  const filtered = useMemo(() =>
    products
      .filter(p => !activeTab || p.status === activeTab)
      .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.template?.name.toLowerCase().includes(search.toLowerCase()))
  , [products, activeTab, search]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach(p => { m[p.status] = (m[p.status] ?? 0) + 1; });
    return m;
  }, [products]);

  function priceDisplay(p: Product) {
    if (p.priceMin && p.priceMax) return `${p.currency} ${p.priceMin.toLocaleString()}–${p.priceMax.toLocaleString()}`;
    if (p.price) return `${p.currency} ${p.price.toLocaleString()}`;
    return '—';
  }

  return (
    <div className="max-w-[1020px] pb-4 text-gray-900">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed inset-x-4 top-4 z-[9999] rounded-xl border px-4 py-3 text-center text-sm font-semibold ${
            toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Suspension banner */}
      {isSuspended && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-relaxed text-red-600">
          <ShieldOff size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            Your account is <strong>suspended</strong>. All products are hidden and you cannot add new ones until reinstated.
            {profile?.suspendReason && <span className="italic"> Reason: {profile.suspendReason}</span>}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-0.5 text-2xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-sm text-gray-500">Manage what you sell on Hustlecare</p>
        </div>
        <Link
          href={isSuspended ? '#' : '/vendor/dashboard/products/new'}
          className={`hidden items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors sm:inline-flex ${
            isSuspended
              ? 'cursor-not-allowed bg-emerald-100 text-emerald-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
          onClick={e => { if (isSuspended) { e.preventDefault(); setShowSuspendNotice(true); } }}
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-4.5 flex flex-nowrap gap-1 overflow-x-auto border-b border-gray-200 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap">
        {STATUS_TABS.map(tab => {
          const label = isSuspended && tab.key === 'ARCHIVED' ? 'Inactive' : tab.label;
          const icon  = isSuspended && tab.key === 'ARCHIVED' ? <ShieldOff size={11} /> : tab.icon;
          const count = tab.key ? (counts[tab.key] ?? 0) : products.length;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:bg-gray-50'
              }`}
            >
              {icon && <span className={active ? 'text-emerald-600' : 'text-gray-400'}>{icon}</span>}
              {label}
              {count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold ${
                    active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-[420px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            placeholder="Search products or requirements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="whitespace-nowrap text-xs text-gray-400">
          {filtered.length} product{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Package size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="mb-3 text-sm text-gray-400">
            {search ? 'No products match your search' : activeTab ? `No ${activeTab.toLowerCase().replace('_', ' ')} products` : 'No products yet'}
          </p>
          {!search && !activeTab && !isSuspended && (
            <Link
              href="/vendor/dashboard/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus size={13} /> Add your first product
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Product', 'Requirement', 'Price', 'Status', ''].map((h, i) => (
                    <th
                      key={h + i}
                      className={`whitespace-nowrap border-b border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-[0.67rem] font-bold uppercase tracking-wider text-gray-400 ${i === 4 ? 'text-right' : ''}`}
                    >
                      {h || 'Actions'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const displayStatus = resolveDisplayStatus(product.status, isSuspended);
                  const meta = STATUS_META[displayStatus] ?? STATUS_META.DRAFT;
                  return (
                    <tr key={product.id} className="transition-colors hover:bg-gray-50">
                      <td className="border-b border-gray-100 px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} width={36} height={36} className="h-9 w-9 flex-shrink-0 rounded-lg border border-gray-200 object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                              <Package size={14} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="truncate text-sm font-semibold text-gray-900">{product.name}</div>
                            <div className="text-xs text-gray-400">
                              {product._count.cartItems} cart · {product._count.reviews} reviews
                            </div>
                            {product.status === 'REJECTED' && product.rejectReason && (
                              <div className="mt-0.5 text-xs text-red-500">↳ {product.rejectReason}</div>
                            )}
                            {isSuspended && product.status === 'ARCHIVED' && (
                              <div className="mt-0.5 flex items-center gap-1 text-xs text-red-500">
                                <ShieldOff size={9} /> Hidden
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-3.5 align-middle">
                        {product.template ? (
                          <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                            {product.template.name}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-300">—</span>
                        )}
                      </td>
                      <td className="border-b border-gray-100 px-4 py-3.5 align-middle">
                        <span className="font-mono text-sm text-emerald-600">{priceDisplay(product)}</span>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-3.5 align-middle">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="border-b border-gray-100 px-4 py-3.5 text-right align-middle">
                        <div className="flex justify-end gap-1.5">
                          {['DRAFT', 'REJECTED'].includes(product.status) && !isSuspended && (
                            <Link href={`/vendor/dashboard/products/${product.id}`} className={iconBtnCls}><Edit2 size={12} /></Link>
                          )}
                          {product.status === 'ACTIVE' && !isSuspended && (
                            <Link href={`/marketplace?product=${product.id}`} target="_blank" className={iconBtnCls}><Eye size={12} /></Link>
                          )}
                          <button type="button" className={`${iconBtnCls} border-red-100 bg-red-50 text-red-500`} onClick={() => setDeleteConfirm(product.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {filtered.map(product => {
              const displayStatus = resolveDisplayStatus(product.status, isSuspended);
              const meta = STATUS_META[displayStatus] ?? STATUS_META.DRAFT;
              return (
                <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-3.5">
                  <Link href={`/vendor/dashboard/products/${product.id}`} className="flex items-start gap-3">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} width={44} height={44} className="h-11 w-11 flex-shrink-0 rounded-lg border border-gray-200 object-cover" />
                    ) : (
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                        <Package size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-gray-900">{product.name}</div>
                        <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.text}`}>
                          {meta.label}
                        </span>
                      </div>
                      {product.template && <div className="mt-0.5 text-xs text-gray-400">{product.template.name}</div>}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-sm text-emerald-600">{priceDisplay(product)}</span>
                        <span className="text-xs text-gray-400">{product._count.cartItems} cart · {product._count.reviews} reviews</span>
                      </div>
                    </div>
                  </Link>
                  {product.status === 'REJECTED' && product.rejectReason && (
                    <div className="mt-2.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-500">
                      Rejected: {product.rejectReason}
                    </div>
                  )}
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                    {['DRAFT', 'REJECTED'].includes(product.status) && !isSuspended && (
                      <Link href={`/vendor/dashboard/products/${product.id}`} className={mobileActionBtnCls}>
                        <Edit2 size={13} /> Edit
                      </Link>
                    )}
                    {product.status === 'ACTIVE' && !isSuspended && (
                      <Link href={`/marketplace?product=${product.id}`} target="_blank" className={mobileActionBtnCls}>
                        <Eye size={13} /> View
                      </Link>
                    )}
                    <button
                      type="button"
                      className={`${mobileActionBtnCls} border-red-100 bg-red-50 text-red-500`}
                      onClick={() => setDeleteConfirm(product.id)}
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 size={20} className="text-red-500" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900">Delete product?</h3>
              <p className="text-sm leading-relaxed text-gray-500">
                Draft products are permanently deleted. Live or reviewed products will be archived.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button type="button" className={secondaryBtnCls} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete / Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend modal */}
      {showSuspendNotice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowSuspendNotice(false)}>
          <div className="w-full max-w-[380px] rounded-2xl border border-gray-200 bg-white p-7 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3.5 flex h-13 w-13 items-center justify-center rounded-full bg-red-50">
                <ShieldOff size={22} className="text-red-500" />
              </div>
              <h3 className="mb-1 text-base font-bold text-gray-900">Account Suspended</h3>
              <p className="text-sm leading-relaxed text-gray-500">
                You cannot add products while suspended. Contact support to get reinstated.
              </p>
              {profile?.suspendReason && (
                <p className="mt-2.5 rounded-lg bg-red-50 px-3 py-2 text-xs italic text-red-500">
                  Reason: {profile.suspendReason}
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <button type="button" className={secondaryBtnCls} onClick={() => setShowSuspendNotice(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const iconBtnCls =
  'inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100';
const mobileActionBtnCls =
  'flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-600';
const secondaryBtnCls =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50';