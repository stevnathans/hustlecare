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

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  DRAFT:          { color: '#9494b0', bg: 'rgba(148,148,176,0.12)', label: 'Draft'     },
  PENDING_REVIEW: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  label: 'In Review' },
  ACTIVE:         { color: '#34d399', bg: 'rgba(16,185,129,0.12)',  label: 'Live'      },
  REJECTED:       { color: '#f87171', bg: 'rgba(239,68,68,0.12)',   label: 'Rejected'  },
  ARCHIVED:       { color: '#55556e', bg: 'rgba(85,85,110,0.12)',   label: 'Archived'  },
  INACTIVE:       { color: '#f87171', bg: 'rgba(239,68,68,0.08)',   label: 'Inactive'  },
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
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          ...S.toast,
          background:  toast.type === 'success' ? 'rgba(16,185,129,0.14)'  : 'rgba(239,68,68,0.14)',
          borderColor: toast.type === 'success' ? 'rgba(16,185,129,0.28)'  : 'rgba(239,68,68,0.28)',
          color:       toast.type === 'success' ? '#6ee7b7'                 : '#fca5a5',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Suspension banner */}
      {isSuspended && (
        <div style={S.suspendBanner}>
          <ShieldOff size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Your account is <strong>suspended</strong>. All products are hidden and you cannot add new ones until reinstated.
            {profile?.suspendReason && <span style={{ color: '#fca5a5', fontStyle: 'italic' }}> Reason: {profile.suspendReason}</span>}
          </span>
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Products</h1>
          <p style={S.subtitle}>Manage what you sell on Hustlecare</p>
        </div>
        <Link
          href={isSuspended ? '#' : '/vendor/dashboard/products/new'}
          style={{ ...S.btnPrimary, ...(isSuspended ? S.btnDisabled : {}) }}
          onClick={e => { if (isSuspended) { e.preventDefault(); setShowSuspendNotice(true); } }}
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Tabs */}
      <div style={S.tabsWrap}>
        {STATUS_TABS.map(tab => {
          const label = isSuspended && tab.key === 'ARCHIVED' ? 'Inactive' : tab.label;
          const icon  = isSuspended && tab.key === 'ARCHIVED' ? <ShieldOff size={11} /> : tab.icon;
          const count = tab.key ? (counts[tab.key] ?? 0) : products.length;
          return (
            <button key={tab.key} style={{ ...S.tab, ...(activeTab === tab.key ? S.tabActive : {}) }} onClick={() => setActiveTab(tab.key)}>
              {icon && <span style={{ color: activeTab === tab.key ? '#fbbf24' : '#55556e' }}>{icon}</span>}
              {label}
              {count > 0 && (
                <span style={{ ...S.tabBadge, background: activeTab === tab.key ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)', color: activeTab === tab.key ? '#fbbf24' : '#55556e' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={S.searchRow}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 420 }}>
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
          <input
            style={S.searchInput}
            placeholder="Search products or requirements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={S.resultCount}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1,2,3,4].map(i => <div key={i} style={S.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.emptyState}>
          <Package size={32} style={{ color: '#3a3a56', marginBottom: '0.75rem' }} />
          <p style={{ color: '#55556e', fontSize: '0.84rem', marginBottom: '0.75rem' }}>
            {search ? 'No products match your search' : activeTab ? `No ${activeTab.toLowerCase().replace('_', ' ')} products` : 'No products yet'}
          </p>
          {!search && !activeTab && !isSuspended && (
            <Link href="/vendor/dashboard/products/new" style={S.btnPrimary}>
              <Plus size={13} /> Add your first product
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div style={S.tableWrap} className="vd-desktop-table">
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Product</th>
                  <th style={S.th}>Requirement</th>
                  <th style={S.th}>Price</th>
                  <th style={S.th}>Status</th>
                  <th style={{ ...S.th, textAlign: 'right' as const }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(product => {
                  const displayStatus = resolveDisplayStatus(product.status, isSuspended);
                  const meta = STATUS_META[displayStatus] ?? STATUS_META.DRAFT;
                  return (
                    <tr key={product.id} className="vd-tr">
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {product.image ? (
                            <Image src={product.image} alt={product.name} width={36} height={36} style={S.productImg} />
                          ) : (
                            <div style={S.productImgFallback}><Package size={14} color="#55556e" /></div>
                          )}
                          <div>
                            <div style={S.productName}>{product.name}</div>
                            <div style={S.productSubtext}>
                              {product._count.cartItems} cart · {product._count.reviews} reviews
                            </div>
                            {product.status === 'REJECTED' && product.rejectReason && (
                              <div style={S.rejectNote}>↳ {product.rejectReason}</div>
                            )}
                            {isSuspended && product.status === 'ARCHIVED' && (
                              <div style={S.suspendNote}><ShieldOff size={9} /> Hidden</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={S.td}>
                        {product.template
                          ? <span style={S.reqTag}>{product.template.name}</span>
                          : <span style={{ color: '#3a3a56', fontSize: '0.82rem' }}>—</span>}
                      </td>
                      <td style={S.td}>
                        <span style={S.price}>{priceDisplay(product)}</span>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, background: meta.bg, color: meta.color }}>{meta.label}</span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' as const }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                          {['DRAFT', 'REJECTED'].includes(product.status) && !isSuspended && (
                            <Link href={`/vendor/dashboard/products/${product.id}`} style={S.iconBtn}><Edit2 size={12} /></Link>
                          )}
                          {product.status === 'ACTIVE' && !isSuspended && (
                            <Link href={`/marketplace?product=${product.id}`} target="_blank" style={S.iconBtn}><Eye size={12} /></Link>
                          )}
                          <button style={{ ...S.iconBtn, ...S.iconBtnDanger }} onClick={() => setDeleteConfirm(product.id)}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }} className="vd-mobile-cards">
            {filtered.map(product => {
              const displayStatus = resolveDisplayStatus(product.status, isSuspended);
              const meta = STATUS_META[displayStatus] ?? STATUS_META.DRAFT;
              return (
                <div key={product.id} style={S.mobileCard}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {product.image
                      ? <Image src={product.image} alt={product.name} width={40} height={40} style={{ ...S.productImg, width: 40, height: 40 }} />
                      : <div style={{ ...S.productImgFallback, width: 40, height: 40 }}><Package size={15} color="#55556e" /></div>}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ ...S.productName, fontSize: '0.88rem' }}>{product.name}</div>
                        <span style={{ ...S.badge, background: meta.bg, color: meta.color, flexShrink: 0 }}>{meta.label}</span>
                      </div>
                      {product.template && <div style={{ ...S.productSubtext, marginTop: '0.15rem' }}>{product.template.name}</div>}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.6rem' }}>
                        <span style={S.price}>{priceDisplay(product)}</span>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          {['DRAFT', 'REJECTED'].includes(product.status) && !isSuspended && (
                            <Link href={`/vendor/dashboard/products/${product.id}`} style={S.iconBtn}><Edit2 size={12} /></Link>
                          )}
                          <button style={{ ...S.iconBtn, ...S.iconBtnDanger }} onClick={() => setDeleteConfirm(product.id)}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {product.status === 'REJECTED' && product.rejectReason && (
                    <div style={{ ...S.rejectNote, marginTop: '0.6rem', padding: '0.45rem 0.7rem', background: 'rgba(239,68,68,0.06)', borderRadius: 7 }}>
                      Rejected: {product.rejectReason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Delete modal */}
      {deleteConfirm !== null && (
        <div style={S.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={S.modalIconWrap}><Trash2 size={20} color="#f87171" /></div>
              <h3 style={S.modalTitle}>Delete product?</h3>
              <p style={S.modalDesc}>Draft products are permanently deleted. Live or reviewed products will be archived.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button style={S.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...S.btnPrimary, background: 'rgba(239,68,68,0.15)', color: '#f87171' }} onClick={() => handleDelete(deleteConfirm)}>
                Delete / Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend modal */}
      {showSuspendNotice && (
        <div style={S.overlay} onClick={() => setShowSuspendNotice(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ ...S.modalIconWrap, background: 'rgba(239,68,68,0.12)' }}><ShieldOff size={22} color="#f87171" /></div>
              <h3 style={S.modalTitle}>Account Suspended</h3>
              <p style={S.modalDesc}>You cannot add products while suspended. Contact support to get reinstated.</p>
              {profile?.suspendReason && (
                <p style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.65rem', fontStyle: 'italic', background: 'rgba(239,68,68,0.06)', padding: '0.5rem 0.75rem', borderRadius: 7 }}>
                  Reason: {profile.suspendReason}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button style={S.btnSecondary} onClick={() => setShowSuspendNotice(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  a { text-decoration: none; color: inherit; }
  .vd-tr:hover td { background: rgba(255,255,255,0.015) !important; }

  @media (min-width: 769px) {
    .vd-mobile-cards { display: none !important; }
  }
  @media (max-width: 768px) {
    .vd-desktop-table { display: none !important; }
    .vd-mobile-cards  { display: flex !important; }
  }
`;

const S: Record<string, React.CSSProperties> = {
  page:            { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 1020, paddingBottom: '2rem' },
  toast:           { position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, padding: '0.75rem 1.1rem', borderRadius: 10, fontSize: '0.82rem', fontWeight: 600, border: '1px solid' },
  suspendBanner:   { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.85rem 1.1rem', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.81rem', lineHeight: 1.6, marginBottom: '1.25rem' },
  header:          { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  h1:              { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.2rem', color: '#f0f0f5' },
  subtitle:        { fontSize: '0.81rem', color: '#55556e' },
  tabsWrap:        { display: 'flex', gap: '0.2rem', marginBottom: '1.1rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' },
  tab:             { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.38rem 0.75rem', borderRadius: 8, border: '1px solid transparent', background: 'transparent', color: '#55556e', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' },
  tabActive:       { background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)', color: '#fbbf24' },
  tabBadge:        { padding: '0.08rem 0.4rem', borderRadius: 100, fontSize: '0.65rem', fontWeight: 700 },
  searchRow:       { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' },
  searchInput:     { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '0.55rem 0.9rem 0.55rem 2.2rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem', outline: 'none' },
  resultCount:     { fontSize: '0.75rem', color: '#55556e', whiteSpace: 'nowrap' },
  skeleton:        { height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)' },
  emptyState:      { background: '#13131a', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 12, padding: '3rem', textAlign: 'center' },
  tableWrap:       { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, overflow: 'hidden' },
  table:           { width: '100%', borderCollapse: 'collapse' },
  th:              { padding: '0.6rem 1rem', textAlign: 'left', fontSize: '0.67rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#13131a', whiteSpace: 'nowrap' },
  td:              { padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' },
  productImg:      { width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 } as React.CSSProperties,
  productImgFallback: { width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  productName:     { fontWeight: 600, fontSize: '0.85rem', color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  productSubtext:  { fontSize: '0.7rem', color: '#55556e', marginTop: '0.1rem' },
  rejectNote:      { fontSize: '0.7rem', color: '#f87171', marginTop: '0.15rem' },
  suspendNote:     { fontSize: '0.7rem', color: '#f87171', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.2rem' },
  reqTag:          { display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  price:           { fontFamily: "'DM Mono', monospace", fontSize: '0.82rem', color: '#34d399' },
  badge:           { display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 },
  iconBtn:         { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9494b0', cursor: 'pointer', textDecoration: 'none' },
  iconBtnDanger:   { background: 'rgba(239,68,68,0.07)', borderColor: 'rgba(239,68,68,0.14)', color: '#f87171' },
  mobileCard:      { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '0.9rem 1rem' },
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' } as React.CSSProperties,
  modal:           { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '1.75rem', width: '100%', maxWidth: 380 },
  modalIconWrap:   { width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' },
  modalTitle:      { fontSize: '0.98rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.4rem' },
  modalDesc:       { fontSize: '0.81rem', color: '#9494b0', lineHeight: 1.6 },
  btnPrimary:      { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: 9, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.83rem', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none' },
  btnDisabled:     { background: 'rgba(245,158,11,0.2)', color: 'rgba(10,10,15,0.4)', cursor: 'not-allowed' },
  btnSecondary:    { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer' },
};