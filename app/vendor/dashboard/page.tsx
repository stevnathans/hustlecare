'use client';
// app/vendor/dashboard/page.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, Eye, ShoppingCart, TrendingUp, Plus, ArrowRight,
  AlertCircle, CheckCircle2, Clock, XCircle, Archive,
  ArrowUpRight, RefreshCw,
} from 'lucide-react';
import { SuspensionBanner, AppealModal } from '@/components/vendors/SuspensionNotice';

type Product = {
  id: number;
  name: string;
  price: number | null;
  status: string;
  template: { name: string; category: string } | null;
  _count: { reviews: number; cartItems: number };
  createdAt: string;
};

type VendorProfile = {
  id: number;
  name: string;
  slug: string;
  status: string;
  suspendReason: string | null;
  tagline: string | null;
  logo: string | null;
  _count: { products: number };
  analytics: { date: string; profileViews: number; productClicks: number; cartAdds: number }[];
  appealStatus: 'NONE' | 'PENDING' | 'REJECTED';
  appealMessage: string | null;
  issueResolved: boolean;
  appealedAt: string | null;
  appealResponse: string | null;
  appealRespondedAt: string | null;
};

const STATUS_META: Record<string, { label: string; text: string; bg: string; ring: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Draft',     text: 'text-gray-500',   bg: 'bg-gray-50',    ring: 'border-gray-200',    icon: <Archive size={11} /> },
  PENDING_REVIEW: { label: 'In Review', text: 'text-amber-600',  bg: 'bg-amber-50',   ring: 'border-amber-200',   icon: <Clock size={11} /> },
  ACTIVE:         { label: 'Live',      text: 'text-emerald-600',bg: 'bg-emerald-50', ring: 'border-emerald-200', icon: <CheckCircle2 size={11} /> },
  REJECTED:       { label: 'Rejected',  text: 'text-red-500',    bg: 'bg-red-50',     ring: 'border-red-200',     icon: <XCircle size={11} /> },
  ARCHIVED:       { label: 'Archived',  text: 'text-gray-400',   bg: 'bg-gray-50',    ring: 'border-gray-200',    icon: <Archive size={11} /> },
};

export default function VendorDashboardPage() {
  const [profile,    setProfile]    = useState<VendorProfile | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appealOpen, setAppealOpen] = useState(false);

  async function fetchData(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const [profRes, prodRes] = await Promise.all([
        fetch('/api/vendors/profile'),
        fetch('/api/vendors/products'),
      ]);
      if (profRes.ok) setProfile(await profRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const isSuspended  = profile?.status === 'SUSPENDED';
  const totalViews   = profile?.analytics.reduce((s, a) => s + a.profileViews,  0) ?? 0;
  const totalClicks  = profile?.analytics.reduce((s, a) => s + a.productClicks, 0) ?? 0;
  const totalCart    = profile?.analytics.reduce((s, a) => s + a.cartAdds,      0) ?? 0;
  const activeCount  = products.filter(p => p.status === 'ACTIVE').length;
  const pendingCount = products.filter(p => p.status === 'PENDING_REVIEW').length;
  const draftCount   = products.filter(p => p.status === 'DRAFT').length;
  const rejectedCount= products.filter(p => p.status === 'REJECTED').length;

  if (loading) return <PageSkeleton />;

  return (
    <div className="w-full max-w-[1020px] pb-4 text-gray-900">
      {/* Header */}
      <div className="mb-6 flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="mb-0.5 text-2xl font-bold tracking-tight text-gray-900">
            {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Vendor Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">
            {isSuspended
              ? 'Your account is currently suspended. Contact support for assistance.'
              : "Here's how your storefront is performing today."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {!isSuspended && profile?.slug && (
            <Link
              href={`/vendors/${profile.slug}`}
              target="_blank"
              className="hidden items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 sm:inline-flex"
            >
              <Eye size={13} /> View Store
            </Link>
          )}
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors hover:bg-indigo-100 sm:flex-initial"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
          {!isSuspended ? (
            <Link
              href="/vendor/dashboard/products/new"
              className="hidden items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 sm:inline-flex"
            >
              <Plus size={13} /> Add Product
            </Link>
          ) : (
            <button
              disabled
              className="hidden cursor-not-allowed items-center gap-1.5 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-300 sm:inline-flex"
            >
              <Plus size={13} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Suspension banner */}
      {isSuspended && profile && (
        <SuspensionBanner vendor={profile} onAppeal={() => setAppealOpen(true)} />
      )}

      {/* Appeal modal */}
      {appealOpen && profile && (
        <AppealModal
          vendor={profile}
          onClose={() => setAppealOpen(false)}
          onSubmitted={(update) => {
            setProfile(p => p ? { ...p, ...update } : p);
            setAppealOpen(false);
          }}
        />
      )}

      {/* Rejection alert */}
      {!isSuspended && rejectedCount > 0 && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span>
            {rejectedCount} product{rejectedCount > 1 ? 's need' : ' needs'} attention —{' '}
            <Link href="/vendor/dashboard/products?status=REJECTED" className="underline">
              review feedback
            </Link>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard title="Profile Views"  value={totalViews}  icon={Eye}          iconClass="text-indigo-500"  iconBg="bg-indigo-50" />
        <StatCard title="Product Clicks" value={totalClicks} icon={Package}      iconClass="text-emerald-600" iconBg="bg-emerald-50" />
        <StatCard title="Cart Adds"      value={totalCart}   icon={ShoppingCart} iconClass="text-amber-500"   iconBg="bg-amber-50" />
        <StatCard
          title={isSuspended ? 'Archived' : 'Live Products'}
          value={isSuspended ? products.filter(p => p.status === 'ARCHIVED').length : activeCount}
          icon={TrendingUp}
          iconClass={isSuspended ? 'text-red-500' : 'text-purple-500'}
          iconBg={isSuspended ? 'bg-red-50' : 'bg-purple-50'}
        />
      </div>

      <div className="flex flex-col gap-4">
        {/* Product status breakdown */}
        <div className={cardCls}>
          <div className="mb-4 flex items-center justify-between">
            <div className={cardTitleCls}>Product Overview</div>
            <Link href="/vendor/dashboard/products" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              { key: isSuspended ? 'ARCHIVED' : 'ACTIVE', count: isSuspended ? products.filter(p => p.status === 'ARCHIVED').length : activeCount },
              { key: 'PENDING_REVIEW', count: pendingCount  },
              { key: 'DRAFT',          count: draftCount    },
              { key: 'REJECTED',       count: rejectedCount },
            ].map(({ key, count }) => {
              const meta = STATUS_META[key];
              return (
                <Link
                  key={key}
                  href={`/vendor/dashboard/products?status=${key}`}
                  className={`block rounded-xl border p-3.5 transition-colors ${count > 0 ? meta.ring : 'border-gray-100'} ${count > 0 ? meta.bg : 'bg-gray-50'}`}
                >
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className={meta.text}>{meta.icon}</span>
                    <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${meta.text}`}>
                      {isSuspended && key === 'ARCHIVED' ? 'Inactive' : meta.label}
                    </span>
                  </div>
                  <div className={`font-mono text-2xl font-bold leading-none ${count > 0 ? meta.text : 'text-gray-300'}`}>
                    {count}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent products */}
        {products.length > 0 && (
          <div className={cardCls}>
            <div className="mb-3 flex items-center justify-between">
              <div className={cardTitleCls}>Recent Products</div>
              <Link href="/vendor/dashboard/products" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                Manage all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col">
              {products.slice(0, 5).map((product, i) => {
                const meta = STATUS_META[product.status] ?? STATUS_META.ARCHIVED;
                return (
                  <Link
                    key={product.id}
                    href={`/vendor/dashboard/products/${product.id}`}
                    className={`flex items-center gap-3 py-3 transition-colors hover:bg-gray-50 ${
                      i < Math.min(products.length, 5) - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                      <Package size={14} className="text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-900">{product.name}</div>
                      {product.template && (
                        <div className="truncate text-xs text-gray-400">{product.template.name}</div>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {product.price && (
                        <span className="hidden font-mono text-xs text-emerald-600 sm:inline">
                          KES {product.price.toLocaleString()}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.68rem] font-bold ${meta.bg} ${meta.text}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                    <ArrowUpRight size={12} className="flex-shrink-0 text-gray-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className={cardCls}>
          <div className={`${cardTitleCls} mb-3`}>Quick Actions</div>
          <div className="flex flex-col gap-2">
            {!isSuspended ? (
              <Link href="/vendor/dashboard/products/new" className={quickActionCls}>
                <Plus size={14} className="text-emerald-600" />
                <span>Add new product</span>
                <ArrowRight size={13} className="ml-auto text-gray-300" />
              </Link>
            ) : (
              <button type="button" onClick={() => setAppealOpen(true)} className={`${quickActionCls} w-full cursor-pointer`}>
                <Plus size={14} className="text-gray-400" />
                <span>Add new product — account suspended</span>
                <ArrowRight size={13} className="ml-auto text-gray-300" />
              </button>
            )}
            {profile?.slug && (
              <Link href={`/vendors/${profile.slug}`} target="_blank" className={quickActionCls}>
                <ArrowUpRight size={14} className="text-emerald-600" />
                <span>Preview storefront</span>
                <ArrowRight size={13} className="ml-auto text-gray-300" />
              </Link>
            )}
            <Link href="/vendor/dashboard/profile" className={quickActionCls}>
              <Eye size={14} className="text-indigo-500" />
              <span>Edit store profile</span>
              <ArrowRight size={13} className="ml-auto text-gray-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {products.length === 0 && !loading && (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <Package size={36} className="mx-auto mb-3 text-gray-300" />
          <h3 className="mb-1 text-sm font-semibold text-gray-600">No products yet</h3>
          <p className="mb-4 text-sm text-gray-400">
            {isSuspended
              ? 'Products will be restored once your account is reinstated.'
              : 'Add your first product to start reaching entrepreneurs on Hustlecare.'}
          </p>
          {!isSuspended && (
            <Link
              href="/vendor/dashboard/products/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              <Plus size={13} /> Add your first product
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, iconClass, iconBg }: {
  title: string; value: number; icon: React.ElementType; iconClass: string; iconBg: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="mb-1.5 truncate text-[0.68rem] font-bold uppercase tracking-wider text-gray-400">{title}</div>
          <div className="font-mono text-2xl font-bold leading-none text-gray-900">{value.toLocaleString()}</div>
        </div>
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon size={17} className={iconClass} />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="w-full max-w-[1020px]">
      <div className="flex flex-col gap-4">
        <div className="h-12 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-22 animate-pulse rounded-xl bg-gray-100" />)}
        </div>
        <div className="h-50 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

const cardCls = 'rounded-2xl border border-gray-200 bg-white p-5';
const cardTitleCls = 'text-sm font-bold text-gray-900';
const quickActionCls =
  'flex items-center gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100';