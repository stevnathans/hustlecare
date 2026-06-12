'use client';
// app/vendor/dashboard/page.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, Eye, ShoppingCart, TrendingUp, Plus, ArrowRight,
  AlertCircle, CheckCircle2, Clock, XCircle, Archive, ShieldOff,
  ArrowUpRight, RefreshCw, BarChart2, Star,
} from 'lucide-react';

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
};

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT:          { label: 'Draft',     color: '#9494b0', bg: 'rgba(148,148,176,0.1)', icon: <Archive size={11} /> },
  PENDING_REVIEW: { label: 'In Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={11} /> },
  ACTIVE:         { label: 'Live',      color: '#34d399', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={11} /> },
  REJECTED:       { label: 'Rejected',  color: '#f87171', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={11} /> },
  ARCHIVED:       { label: 'Archived',  color: '#55556e', bg: 'rgba(85,85,110,0.1)',  icon: <Archive size={11} /> },
};

export default function VendorDashboardPage() {
  const [profile,    setProfile]    = useState<VendorProfile | null>(null);
  const [products,   setProducts]   = useState<Product[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  const avgRating    = products.reduce((sum, p) => sum + p._count.reviews, 0);

  if (loading) return <PageSkeleton />;

  return (
    <div style={P.page}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={P.header}>
        <div style={{ minWidth: 0 }}>
          <h1 style={P.h1}>
            {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Vendor Dashboard'}
          </h1>
          <p style={P.subtitle}>
            {isSuspended
              ? 'Your account is currently suspended. Contact support for assistance.'
              : "Here's how your storefront is performing today."}
          </p>
        </div>
        <div className="vd-header-actions" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' as const }}>
          {!isSuspended && profile?.slug && (
            <Link href={`/vendors/${profile.slug}`} target="_blank" style={P.btnSecondary}>
              <Eye size={13} /> View Store
            </Link>
          )}
          <button
            className={`vd-refresh${refreshing ? ' vd-spinning' : ''}`}
            style={P.refreshBtn}
            onClick={() => fetchData(true)}
          >
            <RefreshCw size={13} />
            <span className="vd-refresh-label">{refreshing ? 'Refreshing…' : 'Refresh'}</span>
          </button>
          {!isSuspended ? (
            <Link href="/vendor/dashboard/products/new" className="vd-add-btn-desktop" style={P.btnPrimary}>
              <Plus size={13} /> Add Product
            </Link>
          ) : (
            <button className="vd-add-btn-desktop" style={{ ...P.btnPrimary, ...P.btnDisabled }} disabled>
              <Plus size={13} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Suspension banner */}
      {isSuspended && (
        <div style={P.suspendBanner}>
          <div style={P.suspendIconWrap}><ShieldOff size={16} color="#f87171" /></div>
          <div style={{ flex: 1 }}>
            <div style={P.suspendTitle}>Account Suspended</div>
            <div style={P.suspendBody}>
              Your storefront and all products are hidden from the marketplace.
              {profile?.suspendReason && <span style={{ color: '#fca5a5', fontStyle: 'italic' }}> Reason: {profile.suspendReason}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Rejection alert */}
      {!isSuspended && rejectedCount > 0 && (
        <div style={P.alertBanner}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />
          <span>
            {rejectedCount} product{rejectedCount > 1 ? 's need' : ' needs'} attention —{' '}
            <Link href="/vendor/dashboard/products?status=REJECTED" style={{ color: '#fca5a5', textDecoration: 'underline' }}>
              review feedback
            </Link>
          </span>
        </div>
      )}

      {/* Stat cards */}
      <div className="vd-stats" style={P.statsGrid}>
        <StatCard title="Profile Views"   value={totalViews}   icon={Eye}         color="#818cf8" bg="rgba(99,102,241,0.12)"  />
        <StatCard title="Product Clicks"  value={totalClicks}  icon={Package}     color="#34d399" bg="rgba(16,185,129,0.12)" />
        <StatCard title="Cart Adds"       value={totalCart}    icon={ShoppingCart} color="#f59e0b" bg="rgba(245,158,11,0.12)" />
        <StatCard
          title={isSuspended ? 'Archived' : 'Live Products'}
          value={isSuspended ? products.filter(p => p.status === 'ARCHIVED').length : activeCount}
          icon={TrendingUp}
          color={isSuspended ? '#f87171' : '#a78bfa'}
          bg={isSuspended ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.12)'}
        />
      </div>

      {/* Product status row + Recent products */}
      <div className="vd-two-col" style={P.twoColGrid}>

        {/* Left: status tiles + recent */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>

          {/* Product status breakdown */}
          <div style={P.card}>
            <div style={P.cardHeader}>
              <div style={P.cardTitle}>Product Overview</div>
              <Link href="/vendor/dashboard/products" style={P.cardLink}>
                See all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="vd-status-grid" style={P.statusGrid}>
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
                    style={{ ...P.statusTile, borderColor: count > 0 ? meta.color + '30' : 'rgba(255,255,255,0.06)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                      <span style={{ color: meta.color }}>{meta.icon}</span>
                      <span style={{ fontSize: '0.65rem', color: meta.color, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                        {isSuspended && key === 'ARCHIVED' ? 'Inactive' : meta.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: count > 0 ? meta.color : '#3a3a56', lineHeight: 1 }}>
                      {count}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Recent products */}
          {products.length > 0 && (
            <div style={P.card}>
              <div style={P.cardHeader}>
                <div style={P.cardTitle}>Recent Products</div>
                <Link href="/vendor/dashboard/products" style={P.cardLink}>
                  Manage all <ArrowRight size={12} />
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {products.slice(0, 5).map((product, i) => {
                  const meta = STATUS_META[product.status] ?? STATUS_META.ARCHIVED;
                  return (
                    <Link
                      key={product.id}
                      href={`/vendor/dashboard/products/${product.id}`}
                      style={{
                        ...P.productRow,
                        borderBottom: i < Math.min(products.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      }}
                    >
                      <div style={P.productIconBox}>
                        <Package size={14} style={{ color: '#55556e' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={P.productName}>{product.name}</div>
                        {product.template && (
                          <div style={P.productMeta}>{product.template.name}</div>
                        )}
                      </div>
                      <div className="vd-product-meta-col" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {product.price && (
                          <span className="vd-price-hide-mobile" style={P.productPrice}>KES {product.price.toLocaleString()}</span>
                        )}
                        <span style={{ ...P.statusBadge, background: meta.bg, color: meta.color }}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </div>
                      <ArrowUpRight size={12} style={{ color: '#3a3a56', flexShrink: 0 }} />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: quick stats panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>

          {/* Engagement */}
          <div style={P.card}>
            <div style={{ ...P.cardHeader, marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={14} style={{ color: '#818cf8' }} />
                <div style={P.cardTitle}>Engagement</div>
              </div>
            </div>
            {[
              { label: 'Total Views',   value: totalViews,  bar: Math.min(totalViews  / Math.max(totalViews, 1) * 100, 100), color: '#818cf8' },
              { label: 'Product Clicks',value: totalClicks, bar: Math.min(totalClicks / Math.max(totalViews, 1) * 100, 100), color: '#34d399' },
              { label: 'Cart Adds',     value: totalCart,   bar: Math.min(totalCart   / Math.max(totalViews, 1) * 100, 100), color: '#f59e0b' },
            ].map(r => (
              <div key={r.label} style={{ marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#9494b0' }}>{r.label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#f0f0f5' }}>{r.value.toLocaleString()}</span>
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: `${Math.max(r.bar, 2)}%`, background: r.color, borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Reviews summary */}
          <div style={P.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <Star size={14} style={{ color: '#fbbf24' }} />
              <div style={P.cardTitle}>Reviews</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {products.filter(p => p._count.reviews > 0).slice(0, 3).map(p => (
                <div key={p.id} style={P.reviewRow}>
                  <span style={{ fontSize: '0.78rem', color: '#9494b0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{p.name}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fbbf24', fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                    ★ {p._count.reviews}
                  </span>
                </div>
              ))}
              {avgRating === 0 && (
                <p style={{ fontSize: '0.78rem', color: '#55556e', textAlign: 'center', padding: '0.5rem 0' }}>No reviews yet</p>
              )}
              <Link href="/vendor/dashboard/products" style={{ ...P.cardLink, marginTop: '0.25rem', justifyContent: 'center', display: 'flex' }}>
                View all products <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Quick actions - hidden on mobile (bottom nav covers these) */}
          <div className="vd-quick-actions" style={P.card}>
            <div style={{ marginBottom: '0.85rem' }}>
              <div style={P.cardTitle}>Quick Actions</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {!isSuspended && (
                <Link href="/vendor/dashboard/products/new" style={P.quickAction}>
                  <Plus size={14} style={{ color: '#f59e0b' }} />
                  <span>Add new product</span>
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: '#55556e' }} />
                </Link>
              )}
              <Link href="/vendor/dashboard/profile" style={P.quickAction}>
                <Eye size={14} style={{ color: '#818cf8' }} />
                <span>Edit store profile</span>
                <ArrowRight size={13} style={{ marginLeft: 'auto', color: '#55556e' }} />
              </Link>
              {profile?.slug && (
                <Link href={`/vendors/${profile.slug}`} target="_blank" style={P.quickAction}>
                  <ArrowUpRight size={14} style={{ color: '#34d399' }} />
                  <span>Preview storefront</span>
                  <ArrowRight size={13} style={{ marginLeft: 'auto', color: '#55556e' }} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {products.length === 0 && !loading && (
        <div style={P.emptyState}>
          <Package size={36} style={{ color: '#3a3a56', marginBottom: '0.85rem' }} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#9494b0', marginBottom: '0.4rem' }}>No products yet</h3>
          <p style={{ fontSize: '0.82rem', color: '#55556e', marginBottom: '1.1rem' }}>
            {isSuspended
              ? 'Products will be restored once your account is reinstated.'
              : 'Add your first product to start reaching entrepreneurs on Hustlecare.'}
          </p>
          {!isSuspended && (
            <Link href="/vendor/dashboard/products/new" style={P.btnPrimary}>
              <Plus size={13} /> Add your first product
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: {
  title: string; value: number; icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <div style={P.statCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={P.statLabel}>{title}</div>
          <div style={P.statValue}>{value.toLocaleString()}</div>
        </div>
        <div style={{ ...P.statIcon, background: bg }}>
          <Icon size={17} color={color} />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <style>{CSS}</style>
      <div style={P.skelBlock} />
      <div className="vd-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem' }}>
        {[1,2,3,4].map(i => <div key={i} style={{ ...P.skelBlock, height: 88 }} />)}
      </div>
      <div style={{ ...P.skelBlock, height: 200 }} />
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  a { text-decoration: none; color: inherit; }
  .vd-refresh { font-family: 'DM Sans', sans-serif; }
  .vd-spinning svg { animation: vd-rot 0.7s linear infinite; }
  @keyframes vd-rot { to { transform: rotate(360deg); } }
  @keyframes vd-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .vd-two-col { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; align-items: start; }
  .vd-status-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.6rem; }

  @media (max-width: 900px) {
    .vd-two-col { grid-template-columns: 1fr !important; }
  }

  @media (max-width: 640px) {
    .vd-stats       { grid-template-columns: repeat(2,1fr) !important; }
    .vd-status-grid { grid-template-columns: repeat(2,1fr) !important; }
    .vd-quick-actions { display: none !important; }
    .vd-add-btn-desktop { display: none !important; }
    .vd-header-actions { width: 100%; }
    .vd-refresh { flex: 1; justify-content: center; }
    .vd-price-hide-mobile { display: none !important; }
  }
`;

const P: Record<string, React.CSSProperties> = {
  page:        { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 1020, paddingBottom: '1rem' },
  header:      { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  h1:          { fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.2rem', color: '#f0f0f5' },
  subtitle:    { fontSize: '0.82rem', color: '#55556e' },
  suspendBanner:{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem' },
  suspendIconWrap: { width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  suspendTitle:{ fontSize: '0.88rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.2rem' },
  suspendBody: { fontSize: '0.78rem', color: '#9494b0', lineHeight: 1.6 },
  alertBanner: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1.25rem' },
  statsGrid:   { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' },
  statCard:    { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.1rem 1.25rem', transition: 'all 0.15s', cursor: 'default', minWidth: 0 },
  statLabel:   { fontSize: '0.7rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.45rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  statValue:   { fontSize: '1.75rem', fontWeight: 700, fontFamily: "'DM Mono', monospace", color: '#f0f0f5', lineHeight: 1 },
  statIcon:    { width: 38, height: 38, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  twoColGrid:  {},
  card:        { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.1rem 1.25rem' },
  cardHeader:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' },
  cardTitle:   { fontSize: '0.88rem', fontWeight: 700, color: '#e2e2f0' },
  cardLink:    { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', fontWeight: 600, color: '#818cf8' },
  statusGrid:  {},
  statusTile:  { display: 'block', background: '#1a1a24', border: '1px solid', borderRadius: 10, padding: '0.75rem 0.85rem', textDecoration: 'none', transition: 'all 0.15s' },
  productRow:  { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', transition: 'all 0.15s', cursor: 'pointer' },
  productIconBox: { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  productName: { fontSize: '0.84rem', fontWeight: 600, color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  productMeta: { fontSize: '0.7rem', color: '#55556e', marginTop: '0.1rem' },
  productPrice:{ fontFamily: "'DM Mono', monospace", fontSize: '0.78rem', color: '#34d399' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.18rem 0.55rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700, whiteSpace: 'nowrap' },
  reviewRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.6rem', borderRadius: 7, background: 'rgba(255,255,255,0.02)' },
  quickAction: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.75rem', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', fontSize: '0.82rem', color: '#9494b0', transition: 'all 0.15s', fontWeight: 500 },
  emptyState:  { background: '#13131a', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 14, padding: '3rem 1.5rem', textAlign: 'center' },
  skelBlock:   { height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'vd-shimmer 1.4s linear infinite', backgroundSize: '200% 100%' },
  btnPrimary:  { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: 9, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.83rem', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none' },
  btnSecondary:{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.83rem', fontWeight: 600, textDecoration: 'none' },
  btnDisabled: { background: 'rgba(245,158,11,0.2)', color: 'rgba(10,10,15,0.4)', cursor: 'not-allowed' },
  refreshBtn:  { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' },
};