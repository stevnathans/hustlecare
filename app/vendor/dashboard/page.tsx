'use client';
// app/vendor/dashboard/page.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package, Eye, ShoppingCart, TrendingUp,
  Plus, ArrowRight, AlertCircle, CheckCircle2,
  Clock, XCircle, Archive, ShieldOff,
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
  DRAFT:          { label: 'Draft',     color: '#9494b0', bg: 'rgba(148,148,176,0.1)', icon: <Archive size={12} /> },
  PENDING_REVIEW: { label: 'In Review', color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={12} /> },
  ACTIVE:         { label: 'Live',      color: '#34d399', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={12} /> },
  REJECTED:       { label: 'Rejected',  color: '#f87171', bg: 'rgba(239,68,68,0.1)',  icon: <XCircle size={12} /> },
  ARCHIVED:       { label: 'Archived',  color: '#55556e', bg: 'rgba(85,85,110,0.1)',  icon: <Archive size={12} /> },
};

export default function VendorDashboardPage() {
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/vendors/profile').then(r => r.ok ? r.json() : null),
      fetch('/api/vendors/products').then(r => r.ok ? r.json() : []),
    ]).then(([prof, prods]) => {
      setProfile(prof);
      setProducts(prods);
    }).finally(() => setLoading(false));
  }, []);

  const isSuspended = profile?.status === 'SUSPENDED';

  const totalViews    = profile?.analytics.reduce((s, a) => s + a.profileViews,  0) ?? 0;
  const totalClicks   = profile?.analytics.reduce((s, a) => s + a.productClicks, 0) ?? 0;
  const totalCartAdds = profile?.analytics.reduce((s, a) => s + a.cartAdds,      0) ?? 0;

  const activeCount   = products.filter(p => p.status === 'ACTIVE').length;
  const pendingCount  = products.filter(p => p.status === 'PENDING_REVIEW').length;
  const draftCount    = products.filter(p => p.status === 'DRAFT').length;
  const rejectedCount = products.filter(p => p.status === 'REJECTED').length;
  const archivedCount = products.filter(p => p.status === 'ARCHIVED').length;

  // The four tiles shown in the Product Overview section.
  // When suspended: replace Live with Archived (products were archived on suspension).
  const statusTiles = isSuspended
    ? [
        { key: 'ARCHIVED',       count: archivedCount },
        { key: 'PENDING_REVIEW', count: pendingCount  },
        { key: 'DRAFT',          count: draftCount    },
        { key: 'REJECTED',       count: rejectedCount },
      ]
    : [
        { key: 'ACTIVE',         count: activeCount   },
        { key: 'PENDING_REVIEW', count: pendingCount  },
        { key: 'DRAFT',          count: draftCount    },
        { key: 'REJECTED',       count: rejectedCount },
      ];

  if (loading) {
    return (
      <div style={S.loadingWrap}>
        <div style={S.skeleton} />
        <div style={{ ...S.skeleton, width: '60%' }} />
        <div style={{ ...S.skeleton, height: 120 }} />
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Suspension banner */}
      {isSuspended && (
        <div style={S.suspendBanner}>
          <div style={S.suspendBannerInner}>
            <div style={S.suspendIconWrap}>
              <ShieldOff size={18} color="#f87171" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={S.suspendTitle}>Your account has been suspended</div>
              <div style={S.suspendBody}>
                Your storefront and all products are hidden from the marketplace.
                You cannot add new products until your account is reinstated by an admin.
                {profile?.suspendReason && (
                  <span style={S.suspendReasonText}> Reason: {profile.suspendReason}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>
            Welcome back{profile?.name ? `, ${profile.name.split(' ')[0]}` : ''}
          </h1>
          <p style={S.subtitle}>
            {isSuspended
              ? 'Your account is currently suspended. Contact support for assistance.'
              : "Here's how your storefront is performing"}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {!isSuspended && (
            <Link href={`/vendors/${profile?.slug}`} target="_blank" style={S.btnSecondary}>
              <Eye size={14} /> View Storefront
            </Link>
          )}
          {isSuspended ? (
            <button
              style={{ ...S.btnPrimary, ...S.btnPrimaryDisabled }}
              onClick={() => document.getElementById('suspend-notice')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Plus size={14} /> Add Product
            </button>
          ) : (
            <Link href="/vendor/dashboard/products/new" style={S.btnPrimary}>
              <Plus size={14} /> Add Product
            </Link>
          )}
        </div>
      </div>

      {/* Suspended — inline notice anchored below header */}
      {isSuspended && (
        <div id="suspend-notice" style={S.suspendNotice}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            New products cannot be added while your account is suspended.
            Once reinstated by an admin, you&rsquo;ll be able to add and manage products again.
          </span>
        </div>
      )}

      {/* Rejection alert — only when not suspended */}
      {!isSuspended && rejectedCount > 0 && (
        <div style={S.alertBanner}>
          <AlertCircle size={15} />
          <span>
            {rejectedCount} product{rejectedCount > 1 ? 's' : ''} need{rejectedCount === 1 ? 's' : ''} your attention —{' '}
            <Link href="/vendor/dashboard/products?status=REJECTED" style={{ color: '#fca5a5', textDecoration: 'underline' }}>
              review feedback
            </Link>
          </span>
        </div>
      )}

      {/* Stats */}
      <div style={S.statsGrid}>
        {[
          { label: 'Profile Views',  value: totalViews,    icon: <Eye          size={18} color="#818cf8" />, bg: 'rgba(99,102,241,0.1)',  color: '#818cf8' },
          { label: 'Product Clicks', value: totalClicks,   icon: <Package      size={18} color="#34d399" />, bg: 'rgba(16,185,129,0.1)',  color: '#34d399' },
          { label: 'Added to Cart',  value: totalCartAdds, icon: <ShoppingCart size={18} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
          {
            label: isSuspended ? 'Archived Products' : 'Live Products',
            value: isSuspended ? archivedCount : activeCount,
            icon:  <TrendingUp size={18} color={isSuspended ? '#f87171' : '#a78bfa'} />,
            bg:    isSuspended ? 'rgba(239,68,68,0.08)' : 'rgba(139,92,246,0.1)',
            color: isSuspended ? '#f87171' : '#a78bfa',
          },
        ].map(stat => (
          <div key={stat.label} style={S.statCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={S.statLabel}>{stat.label}</div>
                <div style={S.statValue}>{stat.value.toLocaleString()}</div>
              </div>
              <div style={{ ...S.statIconWrap, background: stat.bg }}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Product status breakdown */}
      <div style={S.section}>
        <div style={S.sectionHeader}>
          <h2 style={S.sectionTitle}>Product Overview</h2>
          <Link href="/vendor/dashboard/products" style={S.seeAll}>
            See all <ArrowRight size={13} />
          </Link>
        </div>

        <div style={S.statusRow}>
          {statusTiles.map(({ key, count }) => {
            const meta = STATUS_META[key];
            return (
              <Link
                key={key}
                href={`/vendor/dashboard/products?status=${key}`}
                style={{ ...S.statusTile, borderColor: count > 0 ? meta.color + '33' : 'rgba(255,255,255,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <span style={{ color: meta.color }}>{meta.icon}</span>
                  <span style={{ fontSize: '0.72rem', color: meta.color, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontSize: '1.6rem', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: count > 0 ? meta.color : '#3a3a56' }}>
                  {count}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent products */}
      {products.length > 0 && (
        <div style={S.section}>
          <div style={S.sectionHeader}>
            <h2 style={S.sectionTitle}>Recent Products</h2>
            <Link href="/vendor/dashboard/products" style={S.seeAll}>
              Manage all <ArrowRight size={13} />
            </Link>
          </div>

          <div style={S.productList}>
            {products.slice(0, 5).map(product => {
              const meta = STATUS_META[product.status] ?? STATUS_META.ARCHIVED;
              return (
                <Link key={product.id} href={`/vendor/dashboard/products/${product.id}`} style={S.productRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={S.productName}>{product.name}</div>
                    <div style={S.productMeta}>
                      {product.template && (
                        <span style={S.templateTag}>{product.template.name}</span>
                      )}
                      <span style={{ color: '#55556e', fontSize: '0.75rem' }}>
                        {product._count.cartItems} cart adds · {product._count.reviews} reviews
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    {product.price && (
                      <span style={S.productPrice}>KES {product.price.toLocaleString()}</span>
                    )}
                    <span style={{ ...S.statusBadge, background: meta.bg, color: meta.color }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {products.length === 0 && (
        <div style={S.emptyState}>
          <Package size={36} style={{ color: '#3a3a56', marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#9494b0', marginBottom: '0.4rem' }}>
            No products yet
          </h3>
          <p style={{ fontSize: '0.83rem', color: '#55556e', marginBottom: '1.25rem' }}>
            {isSuspended
              ? 'Your account is suspended. Products will be restored once your account is reinstated.'
              : 'Add your first product and start reaching entrepreneurs on Hustlecare.'}
          </p>
          {!isSuspended && (
            <Link href="/vendor/dashboard/products/new" style={S.btnPrimary}>
              <Plus size={14} /> Add your first product
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  a { text-decoration: none; color: inherit; }
`;

const S: Record<string, React.CSSProperties> = {
  page:               { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 900 },
  loadingWrap:        { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  skeleton:           { height: 48, borderRadius: 10, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' },
  suspendBanner:      { marginBottom: '1.25rem', borderRadius: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', padding: '1rem 1.25rem' },
  suspendBannerInner: { display: 'flex', alignItems: 'flex-start', gap: '0.85rem' },
  suspendIconWrap:    { width: 36, height: 36, borderRadius: 9, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  suspendTitle:       { fontSize: '0.9rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.3rem' },
  suspendBody:        { fontSize: '0.8rem', color: '#9494b0', lineHeight: 1.6 },
  suspendReasonText:  { color: '#fca5a5', fontStyle: 'italic' },
  suspendNotice:      { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 1rem', borderRadius: 9, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: '0.8rem', lineHeight: 1.55, marginBottom: '1.25rem' },
  pageHeader:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' as const, gap: '1rem', marginBottom: '1.25rem' },
  h1:                 { fontSize: '1.6rem', fontFamily: "'Instrument Serif', serif", fontWeight: 400, letterSpacing: '-0.02em', marginBottom: '0.2rem' },
  subtitle:           { fontSize: '0.83rem', color: '#55556e' },
  alertBanner:        { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.83rem', marginBottom: '1.25rem' },
  statsGrid:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.75rem', marginBottom: '2rem' },
  statCard:           { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1rem 1.25rem' },
  statLabel:          { fontSize: '0.72rem', color: '#55556e', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: '0.4rem' },
  statValue:          { fontSize: '1.8rem', fontFamily: "'DM Mono', monospace", fontWeight: 700 },
  statIconWrap:       { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  section:            { marginBottom: '2rem' },
  sectionHeader:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' },
  sectionTitle:       { fontSize: '0.9rem', fontWeight: 700, color: '#e2e2f0' },
  seeAll:             { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#818cf8' },
  statusRow:          { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.65rem' },
  statusTile:         { display: 'block', background: '#0f0f1a', border: '1px solid', borderRadius: 11, padding: '0.9rem 1rem', textDecoration: 'none', transition: 'all 0.15s' },
  productList:        { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' },
  productRow:         { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.9rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' },
  productName:        { fontSize: '0.87rem', fontWeight: 600, color: '#f0f0f5', marginBottom: '0.2rem', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' },
  productMeta:        { display: 'flex', alignItems: 'center', gap: '0.6rem' },
  templateTag:        { fontSize: '0.72rem', color: '#818cf8', background: 'rgba(99,102,241,0.1)', padding: '0.15rem 0.5rem', borderRadius: 100 },
  productPrice:       { fontFamily: "'DM Mono', monospace", fontSize: '0.83rem', color: '#34d399' },
  statusBadge:        { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.22rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700 },
  emptyState:         { background: '#0f0f1a', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 14, padding: '3rem', textAlign: 'center' as const },
  btnPrimary:         { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0a0f', fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none' },
  btnPrimaryDisabled: { background: 'rgba(245,158,11,0.25)', color: 'rgba(10,10,15,0.5)', cursor: 'not-allowed' },
  btnSecondary:       { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.1rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.84rem', fontWeight: 600, textDecoration: 'none' },
};