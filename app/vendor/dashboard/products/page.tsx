'use client';
// app/vendor/dashboard/products/page.tsx
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  Plus, Search, Edit2, Trash2, Eye, EyeOff,
  CheckCircle2, Clock, XCircle, Archive, Package,
  ShieldOff,
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

type VendorProfile = {
  status: string;
  suspendReason: string | null;
};

const STATUS_TABS = [
  { key: '',               label: 'All' },
  { key: 'ACTIVE',         label: 'Live',      icon: <CheckCircle2 size={12} /> },
  { key: 'PENDING_REVIEW', label: 'In Review',  icon: <Clock size={12} /> },
  { key: 'DRAFT',          label: 'Draft',      icon: <EyeOff size={12} /> },
  { key: 'REJECTED',       label: 'Rejected',   icon: <XCircle size={12} /> },
  { key: 'ARCHIVED',       label: 'Archived',   icon: <Archive size={12} /> },
];

const STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  DRAFT:          { color: '#9494b0', bg: 'rgba(148,148,176,0.1)',  label: 'Draft'      },
  PENDING_REVIEW: { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',   label: 'In Review'  },
  ACTIVE:         { color: '#34d399', bg: 'rgba(16,185,129,0.1)',   label: 'Live'       },
  REJECTED:       { color: '#f87171', bg: 'rgba(239,68,68,0.1)',    label: 'Rejected'   },
  ARCHIVED:       { color: '#55556e', bg: 'rgba(85,85,110,0.1)',    label: 'Archived'   },
  // Virtual — ARCHIVED during suspension surfaces as Inactive
  INACTIVE:       { color: '#f87171', bg: 'rgba(239,68,68,0.08)',   label: 'Inactive'   },
};

/** When vendor is suspended, ARCHIVED products display as Inactive */
function resolveDisplayStatus(productStatus: string, vendorSuspended: boolean): string {
  if (vendorSuspended && productStatus === 'ARCHIVED') return 'INACTIVE';
  return productStatus;
}

export default function VendorProductsPage() {
  const searchParams  = useSearchParams();

  const [profile,        setProfile]        = useState<VendorProfile | null>(null);
  const [products,       setProducts]       = useState<Product[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState('');
  const [activeTab,      setActiveTab]      = useState(searchParams.get('status') ?? '');
  const [deleteConfirm,  setDeleteConfirm]  = useState<number | null>(null);
  const [toast,          setToast]          = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  // Controls the suspended-add-product notice modal
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
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDelete(id: number) {
    try {
      const res  = await fetch(`/api/vendors/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    }
  }

  /** Called when the Add Product button is clicked while suspended */
  function handleAddProductClick(e: React.MouseEvent) {
    if (isSuspended) {
      e.preventDefault();
      setShowSuspendNotice(true);
    }
  }

  const isSuspended = profile?.status === 'SUSPENDED';

  const filtered = useMemo(() => {
    return products
      .filter(p => !activeTab || p.status === activeTab)
      .filter(p => !search
        || p.name.toLowerCase().includes(search.toLowerCase())
        || p.template?.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, activeTab, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach(p => { map[p.status] = (map[p.status] ?? 0) + 1; });
    return map;
  }, [products]);

  function priceDisplay(p: Product) {
    if (p.priceMin && p.priceMax) return `${p.currency} ${p.priceMin.toLocaleString()} – ${p.priceMax.toLocaleString()}`;
    if (p.price)                  return `${p.currency} ${p.price.toLocaleString()}`;
    return '—';
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {toast && (
        <div style={{
          ...S.toast,
          background:   toast.type === 'success' ? 'rgba(16,185,129,0.15)'  : 'rgba(239,68,68,0.15)',
          borderColor:  toast.type === 'success' ? 'rgba(16,185,129,0.3)'   : 'rgba(239,68,68,0.3)',
          color:        toast.type === 'success' ? '#6ee7b7'                 : '#fca5a5',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Suspension banner */}
      {isSuspended && (
        <div style={S.suspendBanner}>
          <ShieldOff size={15} style={{ flexShrink: 0 }} />
          <span>
            Your account is <strong>suspended</strong>. All previously active products are now inactive and hidden
            from the marketplace. You cannot add new products until your account is reinstated.
            {profile?.suspendReason && (
              <span style={{ color: '#fca5a5', fontStyle: 'italic' }}> Reason: {profile.suspendReason}</span>
            )}
          </span>
        </div>
      )}

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Products</h1>
          <p style={S.subtitle}>Manage the products you sell on Hustlecare</p>
        </div>
        {/* Button always rendered; click is intercepted when suspended */}
        <Link
          href={isSuspended ? '#' : '/vendor/dashboard/products/new'}
          style={{ ...S.btnPrimary, ...(isSuspended ? S.btnPrimaryDisabled : {}) }}
          onClick={handleAddProductClick}
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      {/* Status tabs — swap ARCHIVED label to "Inactive" when vendor is suspended */}
      <div style={S.tabs}>
        {STATUS_TABS.map(tab => {
          // When suspended, relabel the ARCHIVED tab as "Inactive"
          const label = (isSuspended && tab.key === 'ARCHIVED') ? 'Inactive' : tab.label;
          const icon  = (isSuspended && tab.key === 'ARCHIVED') ? <ShieldOff size={12} /> : tab.icon;
          return (
            <button key={tab.key} style={{
              ...S.tab,
              ...(activeTab === tab.key ? S.tabActive : {}),
            }} onClick={() => setActiveTab(tab.key)}>
              {icon}
              {label}
              {(counts[tab.key] ?? 0) > 0 && (
                <span style={{
                  ...S.tabCount,
                  background: activeTab === tab.key ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                  color:      activeTab === tab.key ? '#fbbf24'              : '#55556e',
                }}>
                  {tab.key ? counts[tab.key] ?? 0 : products.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div style={S.searchRow}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
          <input
            style={S.searchInput}
            placeholder="Search products or requirements…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Product list */}
      {loading ? (
        <div style={S.loadWrap}>
          {[1, 2, 3].map(i => <div key={i} style={S.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={S.emptyState}>
          <Package size={32} style={{ color: '#3a3a56', marginBottom: '0.75rem' }} />
          <p style={{ color: '#55556e', fontSize: '0.84rem' }}>
            {search ? 'No products match your search'
              : activeTab ? `No ${activeTab.toLowerCase().replace('_', ' ')} products`
              : 'No products yet'}
          </p>
          {!search && !activeTab && !isSuspended && (
            <Link href="/vendor/dashboard/products/new" style={{ ...S.btnPrimary, marginTop: '0.75rem' }}>
              <Plus size={14} /> Add your first product
            </Link>
          )}
        </div>
      ) : (
        <div style={S.productTable}>
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
                  <tr key={product.id} style={S.tr}>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name || 'Product image'}
                            width={36}
                            height={36}
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Package size={14} color="#55556e" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#f0f0f5' }}>{product.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#55556e' }}>
                            {product._count.cartItems} cart · {product._count.reviews} reviews
                          </div>
                          {product.status === 'REJECTED' && product.rejectReason && (
                            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '0.15rem' }}>
                              ↳ {product.rejectReason}
                            </div>
                          )}
                          {/* Suspension context note */}
                          {isSuspended && product.status === 'ARCHIVED' && (
                            <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <ShieldOff size={10} /> Hidden due to account suspension
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>
                      {product.template ? (
                        <span style={S.requirementTag}>{product.template.name}</span>
                      ) : <span style={{ color: '#3a3a56' }}>—</span>}
                    </td>
                    <td style={S.td}>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.83rem', color: '#34d399' }}>
                        {priceDisplay(product)}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.statusBadge, background: meta.bg, color: meta.color }}>
                        {meta.label}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign: 'right' as const }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.3rem' }}>
                        {/* Editing only allowed for DRAFT/REJECTED — not while suspended */}
                        {['DRAFT', 'REJECTED'].includes(product.status) && !isSuspended && (
                          <Link href={`/vendor/dashboard/products/${product.id}`} style={S.iconBtn}>
                            <Edit2 size={13} />
                          </Link>
                        )}
                        {product.status === 'ACTIVE' && !isSuspended && (
                          <Link href={`/marketplace?product=${product.id}`} target="_blank" style={S.iconBtn}>
                            <Eye size={13} />
                          </Link>
                        )}
                        <button
                          style={{ ...S.iconBtn, ...S.iconBtnDanger }}
                          onClick={() => setDeleteConfirm(product.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteConfirm !== null && (
        <div style={S.modalOverlay} onClick={() => setDeleteConfirm(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                <Trash2 size={20} color="#f87171" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.4rem' }}>Delete product?</h3>
              <p style={{ fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.5 }}>
                Draft products are permanently deleted. Live or reviewed products will be archived instead.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button style={S.btnSecondary} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button
                style={{ ...S.btnPrimary, background: 'rgba(239,68,68,0.15)', color: '#f87171', boxShadow: 'none' }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete / Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspended — Add Product notice modal */}
      {showSuspendNotice && (
        <div style={S.modalOverlay} onClick={() => setShowSuspendNotice(false)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                <ShieldOff size={22} color="#f87171" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.5rem' }}>
                Account Suspended
              </h3>
              <p style={{ fontSize: '0.83rem', color: '#9494b0', lineHeight: 1.65 }}>
                You cannot add new products while your account is suspended.
                Please contact support or wait for an admin to reinstate your account.
              </p>
              {profile?.suspendReason && (
                <p style={{ fontSize: '0.78rem', color: '#f87171', marginTop: '0.65rem', fontStyle: 'italic', background: 'rgba(239,68,68,0.06)', padding: '0.5rem 0.75rem', borderRadius: 7 }}>
                  Suspension reason: {profile.suspendReason}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button style={S.btnSecondary} onClick={() => setShowSuspendNotice(false)}>
                Close
              </button>
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
  tr:hover td { background: rgba(255,255,255,0.015) !important; }
`;

const S: Record<string, React.CSSProperties> = {
  page:           { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 1000 },
  toast:          { position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, padding: '0.75rem 1.25rem', borderRadius: 10, fontSize: '0.83rem', fontWeight: 600, border: '1px solid' },
  suspendBanner:  { display: 'flex', alignItems: 'flex-start', gap: '0.65rem', padding: '0.85rem 1.1rem', borderRadius: 10, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)', color: '#fca5a5', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: '1.25rem' },
  header:         { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' },
  h1:             { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.2rem' },
  subtitle:       { fontSize: '0.82rem', color: '#55556e' },
  tabs:           { display: 'flex', gap: '0.25rem', marginBottom: '1rem', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' },
  tab:            { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.8rem', borderRadius: 8, border: '1px solid transparent', background: 'transparent', color: '#55556e', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' },
  tabActive:      { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
  tabCount:       { padding: '0.1rem 0.4rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700 },
  searchRow:      { display: 'flex', gap: '0.65rem', marginBottom: '1rem' },
  searchInput:    { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '0.55rem 0.9rem 0.55rem 2.2rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem', outline: 'none' },
  loadWrap:       { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  skeleton:       { height: 56, borderRadius: 10, background: 'rgba(255,255,255,0.04)' },
  emptyState:     { background: '#0f0f1a', border: '1px dashed rgba(255,255,255,0.09)', borderRadius: 12, padding: '3rem', textAlign: 'center' as const },
  productTable:   { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' },
  table:          { width: '100%', borderCollapse: 'collapse' },
  th:             { padding: '0.65rem 1rem', textAlign: 'left' as const, fontSize: '0.7rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f0f1a', whiteSpace: 'nowrap' as const },
  td:             { padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' as const },
  tr:             { transition: 'background 0.15s' },
  requirementTag: { display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  statusBadge:    { display: 'inline-flex', padding: '0.22rem 0.65rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700 },
  iconBtn:        { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', cursor: 'pointer', textDecoration: 'none' },
  iconBtnDanger:  { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.15)', color: '#f87171' },
  modalOverlay:   { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' },
  modal:          { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '1.75rem', width: '100%', maxWidth: 380 },
  btnPrimary:     { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.1rem', borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0a0f', fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer', textDecoration: 'none', boxShadow: '0 4px 12px rgba(245,158,11,0.2)' },
  btnPrimaryDisabled: { background: 'rgba(245,158,11,0.2)', color: 'rgba(10,10,15,0.45)', boxShadow: 'none', cursor: 'not-allowed' },
  btnSecondary:   { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' },
};