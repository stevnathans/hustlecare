'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import AssignRequirementModal from '@/components/admin/AssignRequirementModal';
import { Product, Vendor, SortField, SortDir, ViewMode, VendorTuple, ProductStatus } from 'types/vendor';
import { PRICE_RANGES } from 'lib/constants';
import styles from 'lib/styles';
import SortIcon from 'components/SortIcon';
import Pagination from 'components/Pagination';
import ProductCard from 'components/ProductCard';
import ProductFormModal from 'components/ProductFormModal';
import ProductCSVImport from 'components/ProductCSVImport';
import RequirementBadge from 'components/RequirementBadge';

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_META: Record<ProductStatus, { label: string; color: string; bg: string }> = {
  ACTIVE:         { label: 'Live',       color: '#34d399', bg: 'rgba(16,185,129,0.1)'  },
  PENDING_REVIEW: { label: 'In Review',  color: '#fbbf24', bg: 'rgba(245,158,11,0.1)'  },
  DRAFT:          { label: 'Draft',      color: '#9494b0', bg: 'rgba(148,148,176,0.1)' },
  REJECTED:       { label: 'Rejected',   color: '#f87171', bg: 'rgba(239,68,68,0.1)'   },
  ARCHIVED:       { label: 'Archived',   color: '#55556e', bg: 'rgba(85,85,110,0.1)'   },
};

type PageTab = 'catalog' | 'review';

// ─── Review action modal ──────────────────────────────────────────────────────

type ReviewModalProps = {
  product: Product;
  onClose: () => void;
  onDone: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
};

function ReviewModal({ product, onClose, onDone, showToast }: ReviewModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const handleSubmit = async () => {
    if (!action) return;
    if (action === 'reject' && !rejectReason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/products/${product.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectReason: rejectReason.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(action === 'approve' ? 'Product approved and now live ✓' : 'Product rejected');
      onDone();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Action failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Review Product</div>
            <div className="modal-subtitle">Approve to make live, or reject with a reason</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-divider" />
        <div className="modal-body">
          {/* Product summary */}
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', marginBottom: '1.5rem', padding: '0.85rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)' }}>
            {product.image ? (
              <Image src={product.image} alt={product.name} width={56} height={56} style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" color="#3a3a56"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f0f0ff', marginBottom: '0.2rem' }}>{product.name}</div>
              {product.vendor && (
                <div style={{ fontSize: '0.78rem', color: '#6b6b8a', marginBottom: '0.3rem' }}>by {product.vendor.name}</div>
              )}
              {product.template && (
                <div style={{ display: 'inline-flex', padding: '0.15rem 0.55rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(124,106,247,0.1)', color: '#a89cf7' }}>
                  {product.template.name}
                </div>
              )}
              {product.description && (
                <div style={{ fontSize: '0.78rem', color: '#5a5a7a', marginTop: '0.35rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {product.description}
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', color: '#a4f4b0', fontWeight: 500, flexShrink: 0 }}>
              {product.price != null ? `$${product.price.toLocaleString()}` : '—'}
            </div>
          </div>

          {/* Action choice */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <button
              onClick={() => setAction('approve')}
              style={{
                padding: '0.85rem', borderRadius: 10, border: `2px solid ${action === 'approve' ? 'rgba(52,211,153,0.6)' : 'rgba(255,255,255,0.08)'}`,
                background: action === 'approve' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                color: action === 'approve' ? '#34d399' : '#6b6b8a',
                cursor: 'pointer', fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: '0.85rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.15s',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              Approve
              <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>Product goes live</span>
            </button>
            <button
              onClick={() => setAction('reject')}
              style={{
                padding: '0.85rem', borderRadius: 10, border: `2px solid ${action === 'reject' ? 'rgba(248,113,113,0.6)' : 'rgba(255,255,255,0.08)'}`,
                background: action === 'reject' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)',
                color: action === 'reject' ? '#f87171' : '#6b6b8a',
                cursor: 'pointer', fontFamily: "'Sora', sans-serif", fontWeight: 600, fontSize: '0.85rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'all 0.15s',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              Reject
              <span style={{ fontSize: '0.7rem', fontWeight: 400, opacity: 0.7 }}>Vendor notified</span>
            </button>
          </div>

          {action === 'reject' && (
            <div className="form-group">
              <label className="form-label">Rejection Reason <span className="form-required">*</span></label>
              <textarea
                className="form-input form-textarea"
                placeholder="Explain why this product was rejected so the vendor can fix it…"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                autoFocus
              />
              <div style={{ fontSize: '0.72rem', color: '#4a4a66', marginTop: '0.3rem' }}>
                This message is shown to the vendor on their products page.
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`btn ${action === 'approve' ? 'btn-primary' : 'btn-danger'}`}
            style={action === 'approve' ? { background: 'linear-gradient(135deg, #34d399, #059669)' } : {}}
            onClick={handleSubmit}
            disabled={loading || !action || (action === 'reject' && !rejectReason.trim())}
          >
            {loading ? (
              <>
                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                Processing…
              </>
            ) : action === 'approve' ? 'Approve & Publish' : action === 'reject' ? 'Reject Product' : 'Choose an action'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProductStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.DRAFT;
  return (
    <span style={{
      display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: 100,
      fontSize: '0.7rem', fontWeight: 700,
      background: meta.bg, color: meta.color,
    }}>
      {meta.label}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products,           setProducts]           = useState<Product[]>([]);
  const [modalOpen,          setModalOpen]          = useState(false);
  const [editingProduct,     setEditingProduct]     = useState<Product | null>(null);
  const [reviewProduct,      setReviewProduct]      = useState<Product | null>(null);
  const [searchTerm,         setSearchTerm]         = useState('');
  const [sortField,          setSortField]          = useState<SortField>('id');
  const [sortDir,            setSortDir]            = useState<SortDir>('desc');
  const [selectedIds,        setSelectedIds]        = useState<Set<number>>(new Set());
  const [viewMode,           setViewMode]           = useState<ViewMode>('table');
  const [priceRangeIdx,      setPriceRangeIdx]      = useState(0);
  const [vendorFilter,       setVendorFilter]       = useState('');
  const [requirementFilter,  setRequirementFilter]  = useState('');
  const [statusFilter,       setStatusFilter]       = useState('');
  const [isLoading,          setIsLoading]          = useState(true);
  const [toast,              setToast]              = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId,    setDeleteConfirmId]    = useState<number | null>(null);
  const [page,               setPage]               = useState(1);
  const [pageSize,           setPageSize]           = useState(25);
  const [allVendors,         setAllVendors]         = useState<Vendor[]>([]);
  const [assignModalProduct, setAssignModalProduct] = useState<Product | null>(null);
  const [activeTab,          setActiveTab]          = useState<PageTab>('catalog');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Admin endpoint — fetches all products regardless of status
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
      showToast('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVendors = useCallback(async () => {
    try {
      const res = await fetch('/api/vendors');
      if (!res.ok) return;
      const data = await res.json();
      setAllVendors(Array.isArray(data) ? data : []);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { fetchProducts(); fetchVendors(); }, [fetchProducts, fetchVendors]);
  useEffect(() => { setPage(1); }, [searchTerm, vendorFilter, requirementFilter, statusFilter, priceRangeIdx, sortField, sortDir, activeTab]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !modalOpen && !e.ctrlKey && !e.metaKey &&
        document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setEditingProduct(null);
        setModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const vendors = useMemo<VendorTuple[]>(() => allVendors.map(v => [String(v.id), v.name]), [allVendors]);

  const vendorsInProducts = useMemo<VendorTuple[]>(() => {
    const seen = new Map<string, string>();
    products.forEach(p => { if (p.vendor) seen.set(String(p.vendor.id), p.vendor.name); });
    return Array.from(seen.entries());
  }, [products]);

  const requirementsInProducts = useMemo<VendorTuple[]>(() => {
    const seen = new Map<string, string>();
    products.forEach(p => { if (p.template) seen.set(String(p.template.id), p.template.name); });
    return Array.from(seen.entries());
  }, [products]);

  // Products in the review queue
  const pendingProducts = useMemo(() => products.filter(p => p.status === 'PENDING_REVIEW'), [products]);

  const priceRange = PRICE_RANGES[priceRangeIdx];

  const filteredAndSorted = useMemo(() => {
    // Review tab: only show pending, ignore other filters
    const base = activeTab === 'review' ? pendingProducts : products;

    const list = base.filter(p => {
      const q = searchTerm.toLowerCase();
      return (
        (!q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.vendor?.name.toLowerCase().includes(q) || p.template?.name.toLowerCase().includes(q)) &&
        (!vendorFilter || String(p.vendor?.id) === vendorFilter) &&
        (!requirementFilter || String(p.template?.id) === requirementFilter) &&
        (!statusFilter || p.status === statusFilter) &&
        (p.price == null || (p.price >= priceRange.min && p.price < priceRange.max))
      );
    });

    return [...list].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === 'name')    { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortField === 'price')  { va = a.price ?? 0; vb = b.price ?? 0; }
      else if (sortField === 'vendor') { va = a.vendor?.name.toLowerCase() ?? ''; vb = b.vendor?.name.toLowerCase() ?? ''; }
      else if (sortField === 'status') { va = a.status; vb = b.status; }
      else { va = a.id; vb = b.id; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, pendingProducts, activeTab, searchTerm, vendorFilter, requirementFilter, statusFilter, priceRange, sortField, sortDir]);

  const paginated = useMemo(() => filteredAndSorted.slice((page - 1) * pageSize, page * pageSize), [filteredAndSorted, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDeleteConfirmId(null);
      fetchProducts();
      showToast('Product deleted');
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} products?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })));
    setSelectedIds(new Set());
    fetchProducts();
    showToast(`${selectedIds.size} products deleted`);
  };

  const toggleSelect = (id: number) => setSelectedIds(prev => {
    const n = new Set(prev);
    if (n.has(id)) {
      n.delete(id);
    } else {
      n.add(id);
    }
    return n;
  });

  const toggleSelectAll = () => {
    const pageIds = paginated.map(p => p.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (allSelected) {
        pageIds.forEach(id => n.delete(id));
      } else {
        pageIds.forEach(id => n.add(id));
      }
      return n;
    });
  };

  const clearFilters = () => { setSearchTerm(''); setVendorFilter(''); setRequirementFilter(''); setStatusFilter(''); setPriceRangeIdx(0); };
  const hasActiveFilters = !!(searchTerm || vendorFilter || requirementFilter || statusFilter || priceRangeIdx !== 0);
  const allOnPageSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.id));

  const exportCSV = () => {
    const rows = [
      ['ID', 'Name', 'Description', 'Price', 'Status', 'Vendor', 'Requirement', 'URL', 'Image'],
      ...filteredAndSorted.map(p => [p.id, p.name, p.description || '', p.price ?? '', p.status, p.vendor?.name || '', p.template?.name || '', p.url || '', p.image || '']),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'products.csv';
    a.click();
    showToast('Exported to CSV');
  };

  const skeletonRows = Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} className="skeleton-row">
      <td><div className="skel" style={{ width: 16, height: 16, borderRadius: 4 }} /></td>
      <td><div className="skel skel-avatar" /></td>
      <td><div className="skel" style={{ width: '70%' }} /></td>
      <td><div className="skel" style={{ width: '50%' }} /></td>
      <td><div className="skel" style={{ width: '60%' }} /></td>
      <td><div className="skel" style={{ width: 60 }} /></td>
      <td><div className="skel" style={{ width: 70 }} /></td>
      <td><div className="skel" style={{ width: 90 }} /></td>
      <td><div className="skel" style={{ width: 40 }} /></td>
      <td><div className="skel" style={{ width: 80 }} /></td>
    </tr>
  ));

  return (
    <>
      <style>{styles}</style>
      <div className="products-root">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* ── Header ── */}
          <div className="page-header">
            <div>
              <div className="page-title">Product Catalog</div>
              <div className="page-subtitle mono">
                {isLoading ? 'Loading…' : `${filteredAndSorted.length} of ${products.length} products`}
              </div>
            </div>
            <div className="header-actions">
              <span className="shortcut-hint"><span className="kbd">N</span> new</span>
              <ProductCSVImport onImportComplete={fetchProducts} />
              <button className="btn btn-ghost" onClick={exportCSV}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export CSV
              </button>
              <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setModalOpen(true); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                New Product
              </button>
            </div>
          </div>

          {/* ── Stats ── */}
          {!isLoading && (
            <div className="stats-row">
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                Total <strong>{products.length}</strong>
              </div>
              <div className="stat-pill" style={{ background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.2)', color: '#34d399' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                Live <strong style={{ color: '#e2e2ef' }}>{products.filter(p => p.status === 'ACTIVE').length}</strong>
              </div>
              {pendingProducts.length > 0 && (
                <div
                  className="stat-pill"
                  style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24', cursor: 'pointer' }}
                  onClick={() => setActiveTab('review')}
                  title="Switch to Review Queue"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                  Pending Review <strong style={{ color: '#e2e2ef' }}>{pendingProducts.length}</strong>
                </div>
              )}
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
                Avg price <strong className="mono">${products.filter(p => p.price != null).length ? Math.round(products.filter(p => p.price != null).reduce((s, p) => s + (p.price || 0), 0) / products.filter(p => p.price != null).length).toLocaleString() : 0}</strong>
              </div>
              {hasActiveFilters && <div className="stat-pill">Filtered to <strong>{filteredAndSorted.length}</strong></div>}
            </div>
          )}

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '0' }}>
            {([
              { key: 'catalog', label: 'All Products', icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /></svg>
              )},
              { key: 'review', label: 'Review Queue', icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              ), badge: pendingProducts.length },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.6rem 1rem',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: "'Sora', sans-serif", fontSize: '0.82rem', fontWeight: 600,
                  color: activeTab === tab.key ? '#a89cf7' : '#4a4a66',
                  borderBottom: `2px solid ${activeTab === tab.key ? '#7c6af7' : 'transparent'}`,
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {tab.icon}
                {tab.label}
                {'badge' in tab && tab.badge > 0 && (
                  <span style={{
                    background: activeTab === tab.key ? 'rgba(124,106,247,0.2)' : 'rgba(245,158,11,0.15)',
                    color: activeTab === tab.key ? '#a89cf7' : '#fbbf24',
                    borderRadius: 100, padding: '0.1rem 0.45rem', fontSize: '0.68rem', fontWeight: 700,
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Main panel ── */}
          <div className="glass" style={{ overflow: 'hidden' }}>

            {/* Toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name, description, vendor, requirement…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button className="search-clear" onClick={() => setSearchTerm('')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="divider" />
              <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="filter-select">
                <option value="">All vendors</option>
                {vendorsInProducts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
              <select value={requirementFilter} onChange={e => setRequirementFilter(e.target.value)} className="filter-select">
                <option value="">All requirements</option>
                {requirementsInProducts.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
              {activeTab === 'catalog' && (
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
                  <option value="">All statuses</option>
                  <option value="ACTIVE">Live</option>
                  <option value="PENDING_REVIEW">In Review</option>
                  <option value="DRAFT">Draft</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              )}
              <select value={priceRangeIdx} onChange={e => setPriceRangeIdx(Number(e.target.value))} className="filter-select">
                {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>
              {hasActiveFilters && <button className="filter-tag" onClick={clearFilters}>Clear filters ×</button>}
              {activeTab === 'catalog' && (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                  <button className={`btn btn-ghost btn-icon ${viewMode === 'table' ? 'btn-active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>
                  </button>
                  <button className={`btn btn-ghost btn-icon ${viewMode === 'grid' ? 'btn-active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="bulk-bar">
                <span>{selectedIds.size} selected</span>
                <button className="btn btn-danger" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={handleBulkDelete}>Delete selected</button>
                <button className="btn btn-ghost" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={() => setSelectedIds(new Set())}>Clear selection</button>
              </div>
            )}

            {/* ── REVIEW QUEUE TAB ── */}
            {activeTab === 'review' && (
              <div style={{ overflowX: 'auto' }}>
                {!isLoading && pendingProducts.length === 0 ? (
                  <div className="empty-state">
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>All caught up</div>
                    <p>No products are pending review right now.</p>
                  </div>
                ) : (
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>Image</th>
                        <th className="sortable" onClick={() => handleSort('name')}>Product <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></th>
                        <th className="sortable" onClick={() => handleSort('vendor')}>Vendor <SortIcon field="vendor" sortField={sortField} sortDir={sortDir} /></th>
                        <th>Requirement</th>
                        <th className="sortable" onClick={() => handleSort('price')}>Price <SortIcon field="price" sortField={sortField} sortDir={sortDir} /></th>
                        <th>Submitted</th>
                        <th style={{ textAlign: 'right' as const }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? skeletonRows : paginated.map(product => (
                        <tr key={product.id}>
                          <td>
                            {product.image ? (
                              <div className="prod-img">
                                <Image src={product.image} alt={product.name} width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div className="prod-img-placeholder">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#e2e2ef', fontSize: '0.88rem' }}>{product.name}</div>
                            {product.description && (
                              <div style={{ fontSize: '0.75rem', color: '#5a5a7a', marginTop: '0.15rem', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.description}
                              </div>
                            )}
                          </td>
                          <td>
                            {product.vendor ? (
                              <span className="vendor-badge" style={{ cursor: 'default' }}>
                                {product.vendor.logo && <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                              </span>
                            ) : <span style={{ color: '#3a3a56' }}>—</span>}
                          </td>
                          <td>
                            {product.template ? (
                              <span style={{ display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(124,106,247,0.1)', color: '#a89cf7' }}>
                                {product.template.name}
                              </span>
                            ) : <span style={{ color: '#3a3a56' }}>—</span>}
                          </td>
                          <td><span className="price-tag">{product.price != null ? `$${product.price.toLocaleString()}` : '—'}</span></td>
                          <td>
                            <span style={{ fontSize: '0.78rem', color: '#4a4a66', fontFamily: "'DM Mono', monospace" }}>
                              {new Date(product.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' as const }}>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
                              onClick={() => setReviewProduct(product)}
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* ── CATALOG TAB — TABLE VIEW ── */}
            {activeTab === 'catalog' && viewMode === 'table' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, paddingLeft: '1.25rem' }}>
                        <input type="checkbox" className="cb" checked={allOnPageSelected} onChange={toggleSelectAll} style={{ display: paginated.length ? 'block' : 'none' }} />
                      </th>
                      <th style={{ width: 60 }}>Image</th>
                      <th className="sortable" onClick={() => handleSort('name')}>Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></th>
                      <th>Description</th>
                      <th className="sortable" onClick={() => handleSort('vendor')}>Vendor <SortIcon field="vendor" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('price')}>Price <SortIcon field="price" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('status')}>Status <SortIcon field="status" sortField={sortField} sortDir={sortDir} /></th>
                      <th>Requirement</th>
                      <th>Link</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? skeletonRows : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={10}>
                          <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>No products found</div>
                            <p>{hasActiveFilters ? 'Try clearing your filters' : 'Add your first product to get started'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : paginated.map(product => (
                      <tr key={product.id} className={selectedIds.has(product.id) ? 'selected' : ''}>
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <input type="checkbox" className="cb" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} />
                        </td>
                        <td>
                          {product.image ? (
                            <div className="prod-img">
                              <Image src={product.image} alt={product.name} width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          ) : (
                            <div className="prod-img-placeholder">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#e2e2ef', fontSize: '0.88rem' }}>{product.name}</div>
                          {product.status === 'REJECTED' && product.rejectReason && (
                            <div style={{ fontSize: '0.7rem', color: '#f87171', marginTop: '0.2rem' }}>↳ {product.rejectReason}</div>
                          )}
                        </td>
                        <td>
                          <span style={{ color: '#5a5a7a', fontSize: '0.8rem', display: 'block', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {product.description || '—'}
                          </span>
                        </td>
                        <td>
                          {product.vendor ? (
                            product.vendor.website ? (
                              <a href={product.vendor.website} target="_blank" rel="noopener noreferrer" className="vendor-badge">
                                {product.vendor.logo && <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                              </a>
                            ) : (
                              <span className="vendor-badge" style={{ cursor: 'default' }}>
                                {product.vendor.logo && <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                              </span>
                            )
                          ) : <span style={{ color: '#3a3a56' }}>—</span>}
                        </td>
                        <td><span className="price-tag">{product.price != null ? `$${product.price.toLocaleString()}` : '—'}</span></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <StatusBadge status={product.status} />
                            {product.status === 'PENDING_REVIEW' && (
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                                onClick={() => setReviewProduct(product)}
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                        <td><RequirementBadge product={product} onAssign={setAssignModalProduct} /></td>
                        <td>
                          {product.url ? (
                            <a href={product.url} target="_blank" rel="noopener noreferrer" className="url-link">
                              Visit
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                            </a>
                          ) : <span style={{ color: '#3a3a56' }}>—</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <button className="action-btn action-edit" onClick={() => { setEditingProduct(product); setModalOpen(true); }}>Edit</button>
                            <button className="action-btn action-delete" onClick={() => setDeleteConfirmId(product.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── CATALOG TAB — GRID VIEW ── */}
            {activeTab === 'catalog' && viewMode === 'grid' && (
              <div className="grid-view">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                      <div className="skel" style={{ width: '100%', height: 130, borderRadius: 0 }} />
                      <div style={{ padding: '1rem' }}>
                        <div className="skel" style={{ width: '70%', marginBottom: 8 }} />
                        <div className="skel" style={{ width: '90%', height: 10 }} />
                      </div>
                    </div>
                  ))
                ) : paginated.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    <div className="empty-icon">📦</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>No products found</div>
                    <p>{hasActiveFilters ? 'Try clearing your filters' : 'Add your first product to get started'}</p>
                  </div>
                ) : paginated.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selected={selectedIds.has(product.id)}
                    onSelect={() => toggleSelect(product.id)}
                    onEdit={() => { setEditingProduct(product); setModalOpen(true); }}
                    onDelete={() => setDeleteConfirmId(product.id)}
                    onAssign={() => setAssignModalProduct(product)}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredAndSorted.length > 0 && (
              <Pagination total={filteredAndSorted.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {deleteConfirmId !== null && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-title" style={{ color: '#e2e2ef' }}>Delete product?</div>
            <div className="confirm-sub">This action cannot be undone. The product will be permanently removed.</div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirmId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      <ProductFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        fetchProducts={fetchProducts}
        editingProduct={editingProduct}
        vendors={vendors}
      />

      {assignModalProduct && (
        <AssignRequirementModal
          productId={assignModalProduct.id}
          productName={assignModalProduct.name}
          currentTemplateId={assignModalProduct.templateId ?? null}
          currentTemplateName={assignModalProduct.template?.name ?? null}
          isOpen={!!assignModalProduct}
          onClose={() => setAssignModalProduct(null)}
          onAssigned={() => {
            fetchProducts();
            showToast(`Requirement assigned to "${assignModalProduct.name}"`);
          }}
        />
      )}

      {/* Review modal */}
      {reviewProduct && (
        <ReviewModal
          product={reviewProduct}
          onClose={() => setReviewProduct(null)}
          onDone={() => { setReviewProduct(null); fetchProducts(); }}
          showToast={showToast}
        />
      )}
    </>
  );
}