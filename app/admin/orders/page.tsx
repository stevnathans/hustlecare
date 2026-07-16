/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/admin/orders/page.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';
import { getAllServiceSlugs, getQuestionnaireConfig } from '@/lib/questionnaires/registry';
import type { FormattedSection } from '@/lib/orders/format-answers';

// ── Types ────────────────────────────────────────────────────────────────
type OrderRow = {
  id: string;
  orderNumber: string | null;
  serviceSlug: string;
  packageTier: string | null;
  status: string; // "draft" | "submitted"
  adminStatus: string; // "new" | "in_progress" | "delivered" | "cancelled"
  archived: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

type OrderDetail = {
  id: string;
  orderNumber: string | null;
  serviceSlug: string;
  serviceName: string;
  packageTier: string | null;
  packageTierLabel: string | null;
  status: string;
  adminStatus: string;
  adminNotes: string | null;
  archived: boolean;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

type SortField = 'orderNumber' | 'serviceSlug' | 'contactName' | 'createdAt';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'cards';

const PAGE_SIZE = 12;

const ADMIN_STATUSES = [
  { value: 'new', label: 'New', hexBg: 'rgba(99,102,241,0.12)', hexColor: '#818cf8' },
  { value: 'in_progress', label: 'In Progress', hexBg: 'rgba(245,158,11,0.1)', hexColor: '#fbbf24' },
  { value: 'delivered', label: 'Delivered', hexBg: 'rgba(16,185,129,0.12)', hexColor: '#34d399' },
  { value: 'cancelled', label: 'Cancelled', hexBg: 'rgba(239,68,68,0.1)', hexColor: '#f87171' },
];

function adminStatusStyle(value: string) {
  return ADMIN_STATUSES.find((s) => s.value === value) ?? ADMIN_STATUSES[0];
}

const SERVICE_SLUGS = getAllServiceSlugs();
const SERVICE_LABELS: Record<string, string> = SERVICE_SLUGS.reduce((acc, slug) => {
  acc[slug] = getQuestionnaireConfig(slug)?.serviceName ?? slug;
  return acc;
}, {} as Record<string, string>);

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; cursor:pointer; background:#13131a; transition:color 0.15s; }
  .r-table th:hover { color:#a5b4fc; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .r-table tbody tr.sel { background:rgba(99,102,241,0.06); }
  .r-table th.no-sort { cursor:default; }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-primary:disabled { opacity:0.5; transform:none; cursor:not-allowed; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-danger:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-filter { background:rgba(255,255,255,0.05); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-filter.active { background:rgba(99,102,241,0.12); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .btn-view { padding:0.45rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); color:#9494b0; cursor:pointer; transition:all 0.15s; }
  .btn-view.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }
  .stat-pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 1rem; border-radius:10px; }
  .bulk-bar { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 1rem; background:rgba(99,102,241,0.07); border-bottom:1px solid rgba(99,102,241,0.15); font-size:0.82rem; color:#a5b4fc; }
  .filter-panel { background:#1a1a24; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; margin-bottom:1rem; }
  .r-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:13px; overflow:hidden; transition:all 0.2s; }
  .r-card:hover { border-color:rgba(99,102,241,0.25); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:520px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .modal-lg { max-width:720px; }
  .modal-sm { max-width:400px; }
  .pg-btn { display:inline-flex; align-items:center; justify-content:center; min-width:32px; height:32px; padding:0 0.5rem; border-radius:7px; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); color:#9494b0; transition:all 0.15s; }
  .pg-btn:hover:not(:disabled) { background:rgba(255,255,255,0.09); color:#f0f0f5; }
  .pg-btn.pg-active { background:rgba(99,102,241,0.2); border-color:rgba(99,102,241,0.4); color:#a5b4fc; }
  .pg-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .draft-badge { display:inline-flex; align-items:center; gap:0.3rem; padding:0.2rem 0.6rem; border-radius:100px; font-size:0.68rem; font-weight:700; background:rgba(148,148,176,0.12); color:#9494b0; border:1px solid rgba(148,148,176,0.2); }
  .status-select { border:none; border-radius:100px; padding:0.25rem 0.7rem 0.25rem 0.7rem; font-size:0.72rem; font-weight:700; cursor:pointer; appearance:none; background-repeat:no-repeat; background-position:right 0.5rem center; padding-right:1.5rem; font-family:'Sora',sans-serif; }
  .section-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.65rem; }
  .field-row { display:flex; justify-content:space-between; gap:1rem; padding:0.35rem 0; font-size:0.82rem; border-bottom:1px solid rgba(255,255,255,0.03); }
  .field-row:last-child { border-bottom:none; }
  .item-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:8px; padding:0.6rem 0.75rem; margin-top:0.4rem; }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:none; box-sizing:border-box; }
  .f-textarea:focus { border-color:rgba(99,102,241,0.5); }
`;

function serviceColor(slug: string): [string, string] {
  const palette: [string, string][] = [
    ['rgba(99,102,241,0.12)', '#818cf8'],
    ['rgba(139,92,246,0.12)', '#a78bfa'],
    ['rgba(236,72,153,0.12)', '#f472b6'],
    ['rgba(20,184,166,0.12)', '#2dd4bf'],
    ['rgba(245,158,11,0.12)', '#fbbf24'],
    ['rgba(6,182,212,0.12)', '#22d3ee'],
    ['rgba(239,68,68,0.12)', '#f87171'],
    ['rgba(34,197,94,0.12)', '#4ade80'],
    ['rgba(168,85,247,0.12)', '#c084fc'],
  ];
  const idx = SERVICE_SLUGS.indexOf(slug);
  return palette[idx >= 0 ? idx % palette.length : 0];
}

function SortArrow({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: SortDir }) {
  if (sortField !== field) return <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: 4, opacity: 0.25 }}><path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  return sortDir === 'asc'
    ? <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}><path d="M5 1L9 6H1L5 1Z" fill="currentColor" /></svg>
    : <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}><path d="M5 6L1 1H9L5 6Z" fill="currentColor" /></svg>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterAdminStatus, setFilterAdminStatus] = useState('');
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderDetail | null>(null);
  const [detailSections, setDetailSections] = useState<FormattedSection[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [bulkArchiveConfirm, setBulkArchiveConfirm] = useState(false);

  useEffect(() => { fetchOrders(); }, [includeDrafts, includeArchived, filterService, filterAdminStatus]);
  useEffect(() => { setCurrentPage(1); }, [search, filterService, filterAdminStatus, includeDrafts, includeArchived, sortField, sortDir]);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchOrders() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterService) params.set('serviceSlug', filterService);
      if (filterAdminStatus) params.set('adminStatus', filterAdminStatus);
      if (includeDrafts) params.set('includeDrafts', 'true');
      if (includeArchived) params.set('includeArchived', 'true');
      const r = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setOrders(d.orders);
    } catch { setOrders([]); }
    finally { setLoading(false); }
  }

  async function fetchDetail(id: string) {
    setDetailLoading(true);
    setExpandedFields(new Set());
    try {
      const r = await fetch(`/api/admin/orders/${id}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      setDetailOrder(d.order);
      setDetailSections(d.sections);
      setNotesDraft(d.order.adminNotes ?? '');
    } catch {
      showToast('Failed to load order detail', 'error');
      setDetailId(null);
    } finally { setDetailLoading(false); }
  }

  function openDetail(id: string) { setDetailId(id); fetchDetail(id); }
  function closeDetail() { setDetailId(null); setDetailOrder(null); setDetailSections([]); }

  async function handleStatusChange(id: string, adminStatus: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, adminStatus } : o));
    if (detailOrder?.id === id) setDetailOrder({ ...detailOrder, adminStatus });
    try {
      const r = await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminStatus }),
      });
      if (!r.ok) throw new Error();
      showToast('Status updated');
    } catch {
      showToast('Failed to update status', 'error');
      fetchOrders();
    }
  }

  async function handleSaveNotes() {
    if (!detailOrder) return;
    setNotesSaving(true);
    try {
      const r = await fetch(`/api/admin/orders/${detailOrder.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notesDraft || null }),
      });
      if (!r.ok) throw new Error();
      showToast('Notes saved');
    } catch { showToast('Failed to save notes', 'error'); }
    finally { setNotesSaving(false); }
  }

  async function handleArchive() {
    if (!archiveId) return;
    try {
      const r = await fetch(`/api/admin/orders/${archiveId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error();
      showToast('Order archived');
      if (detailId === archiveId) closeDetail();
    } catch { showToast('Failed to archive order', 'error'); }
    finally { setArchiveId(null); fetchOrders(); }
  }

  async function handleBulkArchive() {
    const ids = Array.from(selectedIds);
    let succeeded = 0, failed = 0;
    for (const id of ids) {
      try {
        const r = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
        if (r.ok) succeeded++; else failed++;
      } catch { failed++; }
    }
    setSelectedIds(new Set()); setBulkArchiveConfirm(false); fetchOrders();
    const parts = [];
    if (succeeded > 0) parts.push(`${succeeded} archived`);
    if (failed > 0) parts.push(`${failed} failed`);
    showToast(parts.join(', '), failed > 0 ? 'error' : 'success');
  }

  const activeFilterCount = (filterService ? 1 : 0) + (filterAdminStatus ? 1 : 0) + (includeDrafts ? 1 : 0) + (includeArchived ? 1 : 0);

  const filtered = useMemo(() => {
    return orders
      .filter(o => !search ||
        o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
        o.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        o.contactEmail?.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let va: string = '', vb: string = '';
        if (sortField === 'orderNumber') { va = a.orderNumber ?? ''; vb = b.orderNumber ?? ''; }
        else if (sortField === 'serviceSlug') { va = SERVICE_LABELS[a.serviceSlug] ?? a.serviceSlug; vb = SERVICE_LABELS[b.serviceSlug] ?? b.serviceSlug; }
        else if (sortField === 'contactName') { va = a.contactName ?? ''; vb = b.contactName ?? ''; }
        else { va = a.createdAt; vb = b.createdAt; }
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
  }, [orders, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goToPage(p: number) { setCurrentPage(Math.max(1, Math.min(p, totalPages))); }
  function pageRange(): (number | '…')[] {
    const pages: (number | '…')[] = [];
    let last = 0;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
        if (last && i - last > 1) pages.push('…');
        pages.push(i); last = i;
      }
    }
    return pages;
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  function toggleSel(id: string) {
    const s = new Set(selectedIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    setSelectedIds(s);
  }
  function toggleSelAll() {
    setSelectedIds(selectedIds.size === paginated.length && paginated.length > 0 ? new Set() : new Set(paginated.map(o => o.id)));
  }
  function toggleExpanded(key: string) {
    const s = new Set(expandedFields);
    if (s.has(key)) s.delete(key); else s.add(key);
    setExpandedFields(s);
  }

  const stats = useMemo(() => {
    const submitted = orders.filter(o => o.status === 'submitted');
    return {
      total: submitted.length,
      new: submitted.filter(o => o.adminStatus === 'new').length,
      inProgress: submitted.filter(o => o.adminStatus === 'in_progress').length,
      delivered: submitted.filter(o => o.adminStatus === 'delivered').length,
      drafts: orders.filter(o => o.status === 'draft').length,
    };
  }, [orders]);

  return (
    <>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div className="adm" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Orders</h1>
            <p style={{ fontSize: '0.84rem', color: '#55556e' }}>Every questionnaire submission across all services.</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Total Orders', val: stats.total, bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
            { label: 'New', val: stats.new, bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
            { label: 'In Progress', val: stats.inProgress, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
            { label: 'Delivered', val: stats.delivered, bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
            ...(stats.drafts > 0 ? [{ label: 'Abandoned Drafts', val: stats.drafts, bg: 'rgba(148,148,176,0.1)', color: '#9494b0' }] : []),
          ].map(s => (
            <div key={s.label} className="stat-pill" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <span className="adm-mono" style={{ fontSize: '1.15rem', fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.75 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Search order #, name, or email…" value={search} onChange={e => setSearch(e.target.value)} className="u-input" />
            {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: 0, fontSize: '1.1rem' }}>×</button>}
          </div>
          <button className={`btn btn-filter${filtersOpen || activeFilterCount > 0 ? ' active' : ''}`} onClick={() => setFiltersOpen(!filtersOpen)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" /></svg>
            Filters {activeFilterCount > 0 && <span style={{ background: '#6366f1', color: '#fff', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem' }}>{activeFilterCount}</span>}
          </button>
          <div style={{ display: 'flex', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, overflow: 'hidden' }}>
            <button className={`btn-view${viewMode === 'table' ? ' active' : ''}`} onClick={() => setViewMode('table')} title="Table">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>
            </button>
            <button className={`btn-view${viewMode === 'cards' ? ' active' : ''}`} onClick={() => setViewMode('cards')} title="Cards" style={{ borderLeft: '1px solid rgba(255,255,255,0.09)' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="filter-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9494b0' }}>Filters</span>
              {activeFilterCount > 0 && <button onClick={() => { setFilterService(''); setFilterAdminStatus(''); setIncludeDrafts(false); setIncludeArchived(false); }} style={{ fontSize: '0.75rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>Clear all</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '0.65rem', alignItems: 'center' }}>
              <select value={filterService} onChange={e => setFilterService(e.target.value)} className="u-select">
                <option value="">All services</option>
                {SERVICE_SLUGS.map(slug => <option key={slug} value={slug}>{SERVICE_LABELS[slug]}</option>)}
              </select>
              <select value={filterAdminStatus} onChange={e => setFilterAdminStatus(e.target.value)} className="u-select">
                <option value="">Any status</option>
                {ADMIN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: includeDrafts ? '#818cf8' : '#9494b0', fontFamily: 'Sora,sans-serif' }}>
                <input type="checkbox" checked={includeDrafts} onChange={e => setIncludeDrafts(e.target.checked)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                Include abandoned drafts
                {stats.drafts > 0 && <span style={{ fontSize: '0.7rem', background: 'rgba(148,148,176,0.12)', color: '#9494b0', borderRadius: 100, padding: '0.1rem 0.4rem' }}>{stats.drafts}</span>}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: includeArchived ? '#f87171' : '#9494b0', fontFamily: 'Sora,sans-serif' }}>
                <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} style={{ accentColor: '#f87171', cursor: 'pointer' }} />
                Show archived
              </label>
            </div>
          </div>
        )}

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar" style={{ marginBottom: '0.75rem', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
            <span>{selectedIds.size} selected</span>
            <button className="btn btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem' }} onClick={() => setBulkArchiveConfirm(true)}>Archive selected</button>
            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem' }} onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        )}

        {/* Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#55556e', marginBottom: '0.75rem' }}>
          <span>
            Showing{' '}
            <strong style={{ color: '#9494b0' }}>{filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)}</strong>{' '}
            of <strong style={{ color: '#9494b0' }}>{filtered.length}</strong> orders
          </span>
          {totalPages > 1 && <span>Page {currentPage} of {totalPages}</span>}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#55556e', fontSize: '0.85rem' }}>Loading orders…</div>
        ) : (
          <>
            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <div className="scroll" style={{ overflowX: 'auto' }}>
                  <table className="r-table">
                    <thead>
                      <tr>
                        <th className="no-sort" style={{ paddingLeft: '1.25rem', width: 40 }}>
                          <input type="checkbox" checked={selectedIds.size === paginated.length && paginated.length > 0} onChange={toggleSelAll} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                        </th>
                        <th onClick={() => handleSort('orderNumber')}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Order #<SortArrow field="orderNumber" sortField={sortField} sortDir={sortDir} /></span></th>
                        <th onClick={() => handleSort('serviceSlug')}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Service<SortArrow field="serviceSlug" sortField={sortField} sortDir={sortDir} /></span></th>
                        <th className="no-sort">Package</th>
                        <th onClick={() => handleSort('contactName')}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Contact<SortArrow field="contactName" sortField={sortField} sortDir={sortDir} /></span></th>
                        <th onClick={() => handleSort('createdAt')}><span style={{ display: 'inline-flex', alignItems: 'center' }}>Date<SortArrow field="createdAt" sortField={sortField} sortDir={sortDir} /></span></th>
                        <th className="no-sort">Status</th>
                        <th className="no-sort" style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginated.length === 0 ? (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No orders found</td></tr>
                      ) : paginated.map(o => {
                        const svcColor = serviceColor(o.serviceSlug);
                        const statusStyle = adminStatusStyle(o.adminStatus);
                        return (
                          <tr key={o.id} className={selectedIds.has(o.id) ? 'sel' : ''} style={{ opacity: o.archived ? 0.55 : 1 }}>
                            <td style={{ paddingLeft: '1.25rem' }}><input type="checkbox" checked={selectedIds.has(o.id)} onChange={() => toggleSel(o.id)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} /></td>
                            <td>
                              <button onClick={() => openDetail(o.id)} className="adm-mono" style={{ background: 'none', border: 'none', color: '#a5b4fc', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}>
                                {o.orderNumber ?? '—'}
                              </button>
                              {o.status === 'draft' && <div style={{ marginTop: '0.2rem' }}><span className="draft-badge">draft in progress</span></div>}
                            </td>
                            <td><span style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: svcColor[0], color: svcColor[1] }}>{SERVICE_LABELS[o.serviceSlug] ?? o.serviceSlug}</span></td>
                            <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{o.packageTier ?? '—'}</td>
                            <td>
                              <div style={{ fontSize: '0.84rem', color: '#f0f0f5', fontWeight: 500 }}>{o.contactName ?? '—'}</div>
                              <div style={{ fontSize: '0.74rem', color: '#55556e' }}>{o.contactEmail ?? ''}</div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{formatDate(o.createdAt)}</td>
                            <td>
                              <select
                                className="status-select"
                                value={o.adminStatus}
                                onChange={e => handleStatusChange(o.id, e.target.value)}
                                style={{ background: statusStyle.hexBg, color: statusStyle.hexColor }}
                              >
                                {ADMIN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                              </select>
                            </td>
                            <td style={{ paddingRight: '1.25rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                                <button className="btn btn-ghost btn-icon" onClick={() => openDetail(o.id)}>
                                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                </button>
                                {!o.archived && (
                                  <button className="btn btn-danger btn-icon" onClick={() => setArchiveId(o.id)}>
                                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CARDS VIEW */}
            {viewMode === 'cards' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '0.85rem' }}>
                {paginated.map(o => {
                  const svcColor = serviceColor(o.serviceSlug);
                  const statusStyle = adminStatusStyle(o.adminStatus);
                  return (
                    <div key={o.id} className="r-card" style={{ opacity: o.archived ? 0.6 : 1, cursor: 'pointer' }} onClick={() => openDetail(o.id)}>
                      <div style={{ padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <span className="adm-mono" style={{ fontSize: '0.78rem', color: '#a5b4fc', fontWeight: 600 }}>{o.orderNumber ?? '—'}</span>
                          <select
                            className="status-select"
                            value={o.adminStatus}
                            onClick={e => e.stopPropagation()}
                            onChange={e => handleStatusChange(o.id, e.target.value)}
                            style={{ background: statusStyle.hexBg, color: statusStyle.hexColor }}
                          >
                            {ADMIN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f0f0f5', marginBottom: '0.3rem' }}>{o.contactName ?? 'No name given'}</div>
                        <div style={{ fontSize: '0.76rem', color: '#55556e', marginBottom: '0.6rem' }}>{o.contactEmail}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                          <span style={{ display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, background: svcColor[0], color: svcColor[1] }}>{SERVICE_LABELS[o.serviceSlug]}</span>
                          {o.packageTier && <span style={{ display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, background: 'rgba(148,148,176,0.1)', color: '#9494b0' }}>{o.packageTier}</span>}
                          {o.status === 'draft' && <span className="draft-badge">draft</span>}
                        </div>
                      </div>
                      <div style={{ padding: '0.55rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.72rem', color: '#55556e' }}>
                        {formatDate(o.createdAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.35rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
            <button className="pg-btn" onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
            <button className="pg-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
            {pageRange().map((p, i) =>
              p === '…' ? <span key={`e${i}`} style={{ color: '#55556e', fontSize: '0.78rem', padding: '0 0.25rem' }}>…</span>
                : <button key={p} className={`pg-btn${currentPage === p ? ' pg-active' : ''}`} onClick={() => goToPage(p as number)}>{p}</button>
            )}
            <button className="pg-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
            <button className="pg-btn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
          </div>
        )}

        {/* ── Order Detail Modal ── */}
        {detailId && (
          <div className="modal-overlay" onClick={closeDetail}>
            <div className="modal-box modal-lg" onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '88vh', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.4rem 1.75rem 1rem', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }} className="adm-mono">
                      {detailOrder?.orderNumber ?? 'Loading…'}
                    </h2>
                    {detailOrder && (
                      <p style={{ fontSize: '0.8rem', color: '#55556e' }}>
                        <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{detailOrder.serviceName}</span>
                        {detailOrder.packageTierLabel && <span style={{ marginLeft: '0.5rem' }}>· {detailOrder.packageTierLabel}</span>}
                        {detailOrder.status === 'draft' && <span className="draft-badge" style={{ marginLeft: '0.5rem' }}>draft in progress</span>}
                      </p>
                    )}
                  </div>
                  <button onClick={closeDetail} className="btn btn-ghost btn-icon">×</button>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.1rem 1.75rem' }} className="scroll">
                {detailLoading || !detailOrder ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#55556e', fontSize: '0.82rem' }}>Loading order…</div>
                ) : (
                  <>
                    {/* Contact + status */}
                    <div className="section-card">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                          <div className="f-label">Email</div>
                          <div style={{ fontSize: '0.84rem' }}>{detailOrder.contactEmail ?? '—'}</div>
                        </div>
                        <div>
                          <div className="f-label">Phone</div>
                          <div style={{ fontSize: '0.84rem' }}>{detailOrder.contactPhone ?? '—'}</div>
                        </div>
                        <div>
                          <div className="f-label">Submitted</div>
                          <div style={{ fontSize: '0.84rem' }}>{formatDate(detailOrder.createdAt)}</div>
                        </div>
                        <div>
                          <div className="f-label">Fulfillment Status</div>
                          <select
                            className="status-select"
                            value={detailOrder.adminStatus}
                            onChange={e => handleStatusChange(detailOrder.id, e.target.value)}
                            style={{ background: adminStatusStyle(detailOrder.adminStatus).hexBg, color: adminStatusStyle(detailOrder.adminStatus).hexColor }}
                          >
                            {ADMIN_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="f-label">Internal Notes</label>
                        <textarea
                          className="f-textarea"
                          rows={2}
                          placeholder="e.g. waiting on logo file via WhatsApp"
                          value={notesDraft}
                          onChange={e => setNotesDraft(e.target.value)}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.74rem' }}
                            onClick={handleSaveNotes}
                            disabled={notesSaving || notesDraft === (detailOrder.adminNotes ?? '')}
                          >
                            {notesSaving ? 'Saving…' : 'Save Notes'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Answer sections */}
                    {detailSections.map(section => (
                      <div key={section.id} className="section-card">
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.5rem' }}>
                          {section.icon} {section.title}
                        </h3>
                        {section.fields.map((field, i) => {
                          const key = `${section.id}.${i}`;
                          const isListWithItems = Array.isArray(field.raw) && field.raw.length > 0 && field.itemFields;
                          return (
                            <div key={key}>
                              <div className="field-row">
                                <span style={{ color: '#55556e', flexShrink: 0 }}>{field.label}</span>
                                <span style={{ color: field.isEmpty ? '#3a3a56' : '#f0f0f5', fontWeight: 500, textAlign: 'right' }}>
                                  {isListWithItems ? (
                                    <button onClick={() => toggleExpanded(key)} style={{ background: 'none', border: 'none', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, padding: 0 }}>
                                      {field.value} {expandedFields.has(key) ? '▲' : '▼'}
                                    </button>
                                  ) : field.value}
                                </span>
                              </div>
                              {isListWithItems && expandedFields.has(key) && (
                                <div style={{ marginBottom: '0.5rem' }}>
                                  {(field.raw as Record<string, any>[]).map((item, itemIdx) => (
                                    <div key={itemIdx} className="item-card">
                                      {field.itemFields!.map(itemField => {
                                        const val = item[itemField.name];
                                        if (val === undefined || val === '' || (Array.isArray(val) && val.length === 0)) return null;
                                        return (
                                          <div key={itemField.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '0.15rem 0' }}>
                                            <span style={{ color: '#55556e' }}>{itemField.label}</span>
                                            <span style={{ color: '#d0d0e0' }}>
                                              {itemField.type === 'select'
                                                ? itemField.options?.find(o => o.value === val)?.label ?? String(val)
                                                : String(val)}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '1rem 1.75rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button className="btn btn-ghost" onClick={closeDetail}>Close</button>
                {detailOrder && !detailOrder.archived && (
                  <button className="btn btn-danger" onClick={() => setArchiveId(detailOrder.id)}>Archive Order</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Archive confirm ── */}
        {archiveId !== null && (
          <div className="modal-overlay" onClick={() => setArchiveId(null)}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Archive this order?</h3>
                <p style={{ fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.5 }}>
                  It'll be hidden from the default list but not deleted — you can still find it with "Show archived" in filters.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setArchiveId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleArchive}>Archive</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Bulk archive confirm ── */}
        {bulkArchiveConfirm && (
          <div className="modal-overlay" onClick={() => setBulkArchiveConfirm(false)}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Archive {selectedIds.size} orders?</h3>
                <p style={{ fontSize: '0.82rem', color: '#9494b0' }}>They'll be hidden from the default list but not deleted.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setBulkArchiveConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleBulkArchive}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}