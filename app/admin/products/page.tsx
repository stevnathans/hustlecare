'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import ProductFormModal from '@/components/product/ProductFormModal';
import Image from 'next/image';

type Vendor = {
  id: number;
  name: string;
  website: string;
  logo: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  url: string;
  vendorId: number | null;
  vendor: Vendor | null;
};

type SortField = 'name' | 'price' | 'vendor' | 'id';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

const PRICE_RANGES = [
  { label: 'All prices', min: 0, max: Infinity },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50–$200', min: 50, max: 200 },
  { label: '$200–$1,000', min: 200, max: 1000 },
  { label: '$1,000+', min: 1000, max: Infinity },
];

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  const active = sortField === field;
  return (
    <span className={`inline-flex flex-col ml-1 ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`mb-0.5 transition-opacity ${active && sortDir === 'asc' ? 'opacity-100' : 'opacity-30'}`}>
        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`transition-opacity ${active && sortDir === 'desc' ? 'opacity-100' : 'opacity-30'}`}>
        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setProducts([]);
      showToast('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const vendors = useMemo(() => {
    const set = new Map<string, string>();
    products.forEach(p => { if (p.vendor) set.set(String(p.vendor.id), p.vendor.name); });
    return Array.from(set.entries());
  }, [products]);

  const priceRange = PRICE_RANGES[priceRangeIdx];

  const filteredAndSorted = useMemo(() => {
    let list = products.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.vendor?.name.toLowerCase().includes(q);
      const matchVendor = !vendorFilter || String(p.vendor?.id) === vendorFilter;
      const matchPrice = p.price >= priceRange.min && p.price < priceRange.max;
      return matchSearch && matchVendor && matchPrice;
    });

    list = [...list].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortField === 'price') { va = a.price; vb = b.price; }
      else if (sortField === 'vendor') { va = a.vendor?.name.toLowerCase() ?? ''; vb = b.vendor?.name.toLowerCase() ?? ''; }
      else { va = a.id; vb = b.id; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, searchTerm, vendorFilter, priceRange, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSorted.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAndSorted.map(p => p.id)));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setVendorFilter('');
    setPriceRangeIdx(0);
  };

  const hasActiveFilters = searchTerm || vendorFilter || priceRangeIdx !== 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');

        .products-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          background: #0f0f14;
          color: #e2e2ef;
          padding: 2rem;
        }

        .mono { font-family: 'DM Mono', monospace; }

        /* Glass card */
        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          backdrop-filter: blur(12px);
        }

        /* Header */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #fff 40%, #7c6af7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
        }
        .page-subtitle { color: #6b6b8a; font-size: 0.85rem; margin-top: 0.25rem; }

        /* Stats pills */
        .stats-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .stat-pill {
          background: rgba(124,106,247,0.12);
          border: 1px solid rgba(124,106,247,0.2);
          border-radius: 100px;
          padding: 0.35rem 1rem;
          font-size: 0.78rem;
          color: #a89cf7;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stat-pill strong { color: #e2e2ef; font-size: 0.9rem; }

        /* Toolbar */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 1rem 1.25rem;
          margin-bottom: 0.5rem;
        }

        /* Search */
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6b6b8a;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.55rem 0.9rem 0.55rem 2.4rem;
          color: #e2e2ef;
          font-family: 'Sora', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: #4a4a66; }
        .search-input:focus {
          border-color: rgba(124,106,247,0.5);
          box-shadow: 0 0 0 3px rgba(124,106,247,0.1);
        }

        /* Selects */
        .filter-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.55rem 2rem 0.55rem 0.85rem;
          color: #e2e2ef;
          font-family: 'Sora', sans-serif;
          font-size: 0.82rem;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b6b8a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.6rem center;
          transition: border-color 0.2s;
        }
        .filter-select:focus { border-color: rgba(124,106,247,0.5); }
        .filter-select option { background: #1a1a26; }

        /* Buttons */
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7c6af7, #5a47e0);
          color: #fff;
          box-shadow: 0 4px 16px rgba(124,106,247,0.3);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,106,247,0.45); }
        .btn-ghost {
          background: rgba(255,255,255,0.06);
          color: #b0b0cc;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); color: #e2e2ef; }
        .btn-danger {
          background: rgba(239,68,68,0.15);
          color: #f87171;
          border: 1px solid rgba(239,68,68,0.25);
        }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }
        .btn-icon {
          padding: 0.5rem;
          border-radius: 8px;
        }
        .btn-active {
          background: rgba(124,106,247,0.2);
          color: #a89cf7;
          border-color: rgba(124,106,247,0.4);
        }

        /* Clear filter tag */
        .filter-tag {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: rgba(124,106,247,0.1);
          border: 1px solid rgba(124,106,247,0.2);
          border-radius: 100px;
          padding: 0.28rem 0.75rem;
          font-size: 0.75rem;
          color: #a89cf7;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-tag:hover { background: rgba(124,106,247,0.2); }

        /* Bulk action bar */
        .bulk-bar {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.7rem 1.25rem;
          border-bottom: 1px solid rgba(124,106,247,0.15);
          background: rgba(124,106,247,0.06);
          font-size: 0.83rem;
          color: #a89cf7;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

        /* Table */
        .products-table { width: 100%; border-collapse: collapse; }
        .products-table th {
          padding: 0.65rem 1rem;
          text-align: left;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #4a4a66;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          white-space: nowrap;
          user-select: none;
        }
        .products-table th.sortable { cursor: pointer; transition: color 0.15s; }
        .products-table th.sortable:hover { color: #a89cf7; }
        .products-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .products-table tbody tr {
          transition: background 0.15s;
        }
        .products-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .products-table tbody tr.selected { background: rgba(124,106,247,0.06); }

        /* Checkbox */
        .cb {
          width: 16px;
          height: 16px;
          accent-color: #7c6af7;
          cursor: pointer;
        }

        /* Product image */
        .prod-img {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
        }
        .prod-img-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: rgba(255,255,255,0.04);
          border: 1px dashed rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3a3a56;
          flex-shrink: 0;
        }

        /* Vendor badge */
        .vendor-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px;
          padding: 0.2rem 0.6rem 0.2rem 0.3rem;
          font-size: 0.78rem;
          color: #b0b0cc;
          transition: all 0.15s;
          text-decoration: none;
          max-width: 150px;
          overflow: hidden;
        }
        .vendor-badge:hover { border-color: rgba(124,106,247,0.4); color: #a89cf7; }
        .vendor-logo {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        /* Price */
        .price-tag {
          font-family: 'DM Mono', monospace;
          font-size: 0.88rem;
          color: #a4f4b0;
          font-weight: 500;
        }

        /* URL link */
        .url-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: #7c6af7;
          font-size: 0.8rem;
          text-decoration: none;
          transition: color 0.15s;
        }
        .url-link:hover { color: #a89cf7; }

        /* Actions */
        .action-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.35rem 0.6rem;
          border-radius: 7px;
          font-size: 0.78rem;
          font-family: 'Sora', sans-serif;
          font-weight: 600;
          transition: all 0.15s;
        }
        .action-edit { color: #7c6af7; }
        .action-edit:hover { background: rgba(124,106,247,0.15); }
        .action-delete { color: #f87171; }
        .action-delete:hover { background: rgba(239,68,68,0.12); }

        /* Empty state */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #3a3a56;
        }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .empty-state p { font-size: 0.9rem; margin-top: 0.4rem; color: #4a4a66; }

        /* Grid view */
        .grid-view {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
          padding: 1.25rem;
        }
        .product-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          overflow: hidden;
          transition: all 0.2s;
          position: relative;
          cursor: pointer;
        }
        .product-card:hover {
          border-color: rgba(124,106,247,0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .product-card.selected { border-color: rgba(124,106,247,0.5); background: rgba(124,106,247,0.06); }
        .card-img {
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
          background: rgba(255,255,255,0.04);
        }
        .card-img-placeholder {
          width: 100%;
          aspect-ratio: 16/9;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255,255,255,0.03);
          color: #2a2a3e;
          font-size: 2rem;
        }
        .card-body { padding: 1rem; }
        .card-name { font-size: 0.92rem; font-weight: 600; color: #e2e2ef; margin-bottom: 0.35rem; line-height: 1.3; }
        .card-desc { font-size: 0.75rem; color: #5a5a7a; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .card-cb { position: absolute; top: 0.6rem; left: 0.6rem; }
        .card-actions { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.15s; }
        .product-card:hover .card-actions { opacity: 1; }
        .card-action-btn {
          width: 28px; height: 28px;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          border: none; cursor: pointer; font-size: 0.75rem; transition: all 0.15s;
        }
        .card-action-edit { background: rgba(124,106,247,0.8); color: #fff; }
        .card-action-edit:hover { background: #7c6af7; }
        .card-action-del { background: rgba(239,68,68,0.8); color: #fff; }
        .card-action-del:hover { background: #ef4444; }

        /* Loading skeleton */
        .skeleton-row td { padding: 0.85rem 1rem; }
        .skel {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px;
          height: 14px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skel-avatar { width: 48px; height: 48px; border-radius: 10px; }

        /* Toast */
        .toast {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          font-size: 0.84rem;
          font-family: 'Sora', sans-serif;
          z-index: 9999;
          animation: toastIn 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; }
        .toast-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        /* Confirm overlay */
        .confirm-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9998;
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.15s ease;
        }
        .confirm-box {
          background: #1a1a26;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.75rem;
          max-width: 380px;
          width: 90%;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6);
        }
        .confirm-title { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; }
        .confirm-sub { font-size: 0.84rem; color: #6b6b8a; margin-bottom: 1.5rem; }
        .confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

        .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.08); flex-shrink: 0; }
      `}</style>

      <div className="products-root">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Page header */}
          <div className="page-header">
            <div>
              <div className="page-title">Product Catalog</div>
              <div className="page-subtitle mono">
                {isLoading ? 'Loading...' : `${filteredAndSorted.length} of ${products.length} products`}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => { setEditingProduct(null); setModalOpen(true); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16m8-8H4" />
              </svg>
              New Product
            </button>
          </div>

          {/* Stats */}
          {!isLoading && (
            <div className="stats-row">
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                </svg>
                Total <strong>{products.length}</strong>
              </div>
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                Vendors <strong>{vendors.length}</strong>
              </div>
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
                Avg price <strong className="mono">
                  ${products.length ? Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / products.length).toLocaleString() : 0}
                </strong>
              </div>
              {hasActiveFilters && (
                <div className="stat-pill">
                  Filtered to <strong>{filteredAndSorted.length}</strong>
                </div>
              )}
            </div>
          )}

          {/* Main panel */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            {/* Toolbar */}
            <div className="toolbar">
              {/* Search */}
              <div className="search-wrap">
                <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search name, description, vendor…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              <div className="divider" />

              {/* Vendor filter */}
              <select
                value={vendorFilter}
                onChange={e => setVendorFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All vendors</option>
                {vendors.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              {/* Price filter */}
              <select
                value={priceRangeIdx}
                onChange={e => setPriceRangeIdx(Number(e.target.value))}
                className="filter-select"
              >
                {PRICE_RANGES.map((r, i) => (
                  <option key={i} value={i}>{r.label}</option>
                ))}
              </select>

              {hasActiveFilters && (
                <button className="filter-tag" onClick={clearFilters}>
                  Clear filters ×
                </button>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn btn-ghost btn-icon ${viewMode === 'table' ? 'btn-active' : ''}`}
                  onClick={() => setViewMode('table')}
                  title="Table view"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" />
                  </svg>
                </button>
                <button
                  className={`btn btn-ghost btn-icon ${viewMode === 'grid' ? 'btn-active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="bulk-bar">
                <span>{selectedIds.size} selected</span>
                <button className="btn btn-danger" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={handleBulkDelete}>
                  Delete selected
                </button>
                <button className="btn btn-ghost" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </button>
              </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, paddingLeft: '1.25rem' }}>
                        <input
                          type="checkbox"
                          className="cb"
                          checked={selectedIds.size === filteredAndSorted.length && filteredAndSorted.length > 0}
                          onChange={toggleSelectAll}
                          style={{ display: filteredAndSorted.length ? 'block' : 'none' }}
                        />
                      </th>
                      <th style={{ width: 60 }}>Image</th>
                      <th className="sortable" onClick={() => handleSort('name')}>
                        Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th>Description</th>
                      <th className="sortable" onClick={() => handleSort('vendor')}>
                        Vendor <SortIcon field="vendor" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th className="sortable" onClick={() => handleSort('price')}>
                        Price <SortIcon field="price" sortField={sortField} sortDir={sortDir} />
                      </th>
                      <th>Link</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="skeleton-row">
                          <td><div className="skel" style={{ width: 16, height: 16, borderRadius: 4 }} /></td>
                          <td><div className="skel skel-avatar" /></td>
                          <td><div className="skel" style={{ width: '70%' }} /></td>
                          <td><div className="skel" style={{ width: '90%' }} /></td>
                          <td><div className="skel" style={{ width: '50%' }} /></td>
                          <td><div className="skel" style={{ width: 60 }} /></td>
                          <td><div className="skel" style={{ width: 40 }} /></td>
                          <td><div className="skel" style={{ width: 80 }} /></td>
                        </tr>
                      ))
                    ) : filteredAndSorted.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>No products found</div>
                            <p>{hasActiveFilters ? 'Try clearing your filters' : 'Add your first product to get started'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAndSorted.map(product => (
                        <tr
                          key={product.id}
                          className={selectedIds.has(product.id) ? 'selected' : ''}
                        >
                          <td style={{ paddingLeft: '1.25rem' }}>
                            <input
                              type="checkbox"
                              className="cb"
                              checked={selectedIds.has(product.id)}
                              onChange={() => toggleSelect(product.id)}
                            />
                          </td>
                          <td>
                            {product.image ? (
                              <div className="prod-img">
                                <Image src={product.image} alt={product.name} width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div className="prod-img-placeholder">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
                                  <path d="M21 15l-5-5L5 21" />
                                </svg>
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, color: '#e2e2ef', fontSize: '0.88rem' }}>{product.name}</span>
                          </td>
                          <td>
                            <span style={{ color: '#5a5a7a', fontSize: '0.8rem', display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {product.description || '—'}
                            </span>
                          </td>
                          <td>
                            {product.vendor ? (
                              product.vendor.website ? (
                                <a href={product.vendor.website} target="_blank" rel="noopener noreferrer" className="vendor-badge">
                                  {product.vendor.logo && (
                                    <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />
                                  )}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                                </a>
                              ) : (
                                <span className="vendor-badge" style={{ cursor: 'default' }}>
                                  {product.vendor.logo && (
                                    <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />
                                  )}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                                </span>
                              )
                            ) : <span style={{ color: '#3a3a56' }}>—</span>}
                          </td>
                          <td>
                            <span className="price-tag">${product.price?.toLocaleString() ?? '—'}</span>
                          </td>
                          <td>
                            {product.url ? (
                              <a href={product.url} target="_blank" rel="noopener noreferrer" className="url-link">
                                Visit
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                                  <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                              </a>
                            ) : <span style={{ color: '#3a3a56' }}>—</span>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <button className="action-btn action-edit" onClick={() => handleEdit(product)}>Edit</button>
                              <button className="action-btn action-delete" onClick={() => setDeleteConfirmId(product.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
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
                ) : filteredAndSorted.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    <div className="empty-icon">📦</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>No products found</div>
                    <p>{hasActiveFilters ? 'Try clearing your filters' : 'Add your first product to get started'}</p>
                  </div>
                ) : (
                  filteredAndSorted.map(product => (
                    <div key={product.id} className={`product-card ${selectedIds.has(product.id) ? 'selected' : ''}`}>
                      <div className="card-cb">
                        <input type="checkbox" className="cb" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} />
                      </div>
                      <div className="card-actions">
                        <button className="card-action-btn card-action-edit" onClick={() => handleEdit(product)} title="Edit">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button className="card-action-btn card-action-del" onClick={() => setDeleteConfirmId(product.id)} title="Delete">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" />
                          </svg>
                        </button>
                      </div>
                      {product.image ? (
                        <Image src={product.image} alt={product.name} width={300} height={160} className="card-img" style={{ display: 'block', width: '100%', height: 130, objectFit: 'cover' }} />
                      ) : (
                        <div className="card-img-placeholder">📦</div>
                      )}
                      <div className="card-body">
                        <div className="card-name">{product.name}</div>
                        <div className="card-desc">{product.description || <span style={{ color: '#3a3a56' }}>No description</span>}</div>
                      </div>
                      <div className="card-footer">
                        <span className="price-tag">${product.price?.toLocaleString() ?? '—'}</span>
                        {product.vendor && (
                          <span style={{ fontSize: '0.73rem', color: '#5a5a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                            {product.vendor.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
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

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <ProductFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        fetchProducts={fetchProducts}
        editingProduct={editingProduct}
      />
    </>
  );
}