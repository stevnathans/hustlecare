/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import RequirementCSVImport from '@/components/RequirementCSVImport';

// ── Types ─────────────────────────────────────────────────────────────────────

type Template = {
  id: number;
  name: string;
  description?: string;
  image?: string;
  category: string;
  necessity: 'Required' | 'Optional';
  isDeprecated: boolean;
  productCount: number;
  businessCount: number;
  createdAt: string;
  updatedAt: string;
};

type Business = { id: number; name: string; published: boolean; };

type LinkedBusiness = {
  linkId: number;
  businessId: number;
  businessName: string;
  businessSlug: string;
  published: boolean;
  descriptionOverride?: string;
  isActive: boolean;
  linkedAt: string;
};

type SortField = 'name' | 'category' | 'necessity' | 'productCount' | 'businessCount';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'cards';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['Equipment', 'Software', 'Documents', 'Legal', 'Branding', 'Operating Expenses'];

const CAT_COLORS: Record<string, [string, string]> = {
  Equipment:            ['rgba(99,102,241,0.12)',  '#818cf8'],
  Software:             ['rgba(139,92,246,0.12)',  '#a78bfa'],
  Documents:            ['rgba(245,158,11,0.12)',  '#fbbf24'],
  Legal:                ['rgba(239,68,68,0.12)',   '#f87171'],
  Branding:             ['rgba(236,72,153,0.12)',  '#f472b6'],
  'Operating Expenses': ['rgba(20,184,166,0.12)',  '#2dd4bf'],
};

const defaultForm = { name: '', description: '', image: '', category: '', necessity: 'Required' as 'Required' | 'Optional' };

// ── Styles ────────────────────────────────────────────────────────────────────

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
  .btn-success { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.22); }
  .btn-success:hover { background:rgba(16,185,129,0.22); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-accent { background:rgba(139,92,246,0.12); color:#a78bfa; border:1px solid rgba(139,92,246,0.22); }
  .btn-accent:hover { background:rgba(139,92,246,0.22); }
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
  .modal-lg { max-width:640px; }
  .modal-sm { max-width:400px; }

  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .f-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; box-sizing:border-box; cursor:pointer; }
  .f-select:focus { border-color:rgba(99,102,241,0.5); }
  .f-select option { background:#1a1a24; }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:none; box-sizing:border-box; }
  .f-textarea::placeholder { color:#3a3a56; }
  .f-textarea:focus { border-color:rgba(99,102,241,0.5); }
  .f-hint { font-size:0.72rem; color:#55556e; margin-top:0.3rem; }
  .f-hint.highlight { color:#a78bfa; }

  .nec-opt { flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.65rem; border-radius:9px; border:2px solid rgba(255,255,255,0.07); cursor:pointer; transition:all 0.15s; font-size:0.84rem; font-weight:600; }

  .biz-check-row { display:flex; align-items:center; gap:0.75rem; padding:0.65rem 0.85rem; border-radius:8px; border:1px solid rgba(255,255,255,0.07); transition:all 0.15s; cursor:pointer; }
  .biz-check-row:hover { background:rgba(255,255,255,0.04); border-color:rgba(99,102,241,0.25); }
  .biz-check-row.selected { background:rgba(99,102,241,0.08); border-color:rgba(99,102,241,0.3); }
  .biz-check-row.already-linked { opacity:0.5; cursor:not-allowed; background:rgba(255,255,255,0.02); }

  .linked-biz-row { display:flex; align-items:center; justify-content:space-between; padding:0.6rem 0.85rem; border-radius:8px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); }

  .dep-badge { display:inline-flex; align-items:center; gap:0.3rem; padding:0.2rem 0.6rem; border-radius:100px; font-size:0.68rem; font-weight:700; background:rgba(239,68,68,0.1); color:#f87171; border:1px solid rgba(239,68,68,0.2); }

  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function catColor(cat: string): [string, string] {
  return CAT_COLORS[cat] ?? ['rgba(148,148,176,0.1)', '#9494b0'];
}

function necStyle(nec: string) {
  return nec === 'Required'
    ? { bg: 'rgba(16,185,129,0.1)', color: '#34d399' }
    : { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' };
}

function SortArrow({ field, sortField, sortDir }: { field: string; sortField: string; sortDir: SortDir }) {
  if (sortField !== field) return <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: 4, opacity: 0.25 }}><path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
  return sortDir === 'asc'
    ? <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}><path d="M5 1L9 6H1L5 1Z" fill="currentColor" /></svg>
    : <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}><path d="M5 6L1 1H9L5 6Z" fill="currentColor" /></svg>;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function RequirementsPage() {
  // Data
  const [templates, setTemplates] = useState<Template[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // UI state
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterNec, setFilterNec] = useState('');
  const [showDeprecated, setShowDeprecated] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Create/Edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [formLoading, setFormLoading] = useState(false);

  // Add to Business modal (from requirement side)
  const [addBizModalOpen, setAddBizModalOpen] = useState(false);
  const [addBizTemplate, setAddBizTemplate] = useState<Template | null>(null);
  const [linkedBusinesses, setLinkedBusinesses] = useState<LinkedBusiness[]>([]);
  const [selectedBizIds, setSelectedBizIds] = useState<Set<number>>(new Set());
  const [addBizLoading, setAddBizLoading] = useState(false);
  const [linkedLoading, setLinkedLoading] = useState(false);

  // Delete confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);

  useEffect(() => { fetchTemplates(); fetchBusinesses(); }, []);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchTemplates() {
    try {
      const r = await fetch('/api/requirements');
      if (!r.ok) throw new Error();
      setTemplates(await r.json());
    } catch { setTemplates([]); }
  }

  async function fetchBusinesses() {
    try {
      const r = await fetch('/api/admin/businesses');
      if (r.ok) setBusinesses(await r.json());
    } catch { }
  }

  async function fetchLinkedBusinesses(templateId: number) {
    setLinkedLoading(true);
    try {
      const r = await fetch(`/api/requirements/${templateId}/businesses`);
      if (r.ok) setLinkedBusinesses(await r.json());
    } catch { }
    finally { setLinkedLoading(false); }
  }

  // ── Filtering + Sorting ───────────────────────────────────────────────────

  const activeFilterCount = [filterCat, filterNec].filter(Boolean).length + (showDeprecated ? 1 : 0);

  const filtered = useMemo(() => {
    return templates
      .filter(t => showDeprecated ? true : !t.isDeprecated)
      .filter(t => !filterCat || t.category === filterCat)
      .filter(t => !filterNec || t.necessity === filterNec)
      .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let va: string | number = '', vb: string | number = '';
        if (sortField === 'name') { va = a.name; vb = b.name; }
        else if (sortField === 'category') { va = a.category; vb = b.category; }
        else if (sortField === 'necessity') { va = a.necessity; vb = b.necessity; }
        else if (sortField === 'productCount') { va = a.productCount; vb = b.productCount; }
        else { va = a.businessCount; vb = b.businessCount; }
        if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
        return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
      });
  }, [templates, search, filterCat, filterNec, showDeprecated, sortField, sortDir]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }

  // ── Create / Edit ─────────────────────────────────────────────────────────

  function openNew() { setFormData(defaultForm); setEditingId(null); setFormOpen(true); }
  function openEdit(t: Template) { setFormData({ name: t.name, description: t.description ?? '', image: t.image ?? '', category: t.category, necessity: t.necessity }); setEditingId(t.id); setFormOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    try {
      const method = editingId ? 'PATCH' : 'POST';
      const url = editingId ? `/api/requirements/${editingId}` : '/api/requirements';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Failed'); }
      setFormOpen(false);
      fetchTemplates();
      showToast(editingId ? 'Requirement updated — all linked businesses will see the change automatically.' : 'Requirement added to library.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed to save', 'error'); }
    finally { setFormLoading(false); }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const r = await fetch(`/api/requirements/${deleteId}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      showToast(d.deprecated ? `Requirement deprecated — existing business links preserved.` : 'Requirement permanently deleted.');
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
    finally { setDeleteId(null); fetchTemplates(); }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    let deprecated = 0, deleted = 0, failed = 0;
    for (const id of ids) {
      try {
        const r = await fetch(`/api/requirements/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        const d = await r.json();
        if (!r.ok) { failed++; continue; }
        d.deprecated ? deprecated++ : deleted++;
      } catch { failed++; }
    }
    setSelectedIds(new Set()); setBulkConfirm(false); fetchTemplates();
    const parts = [];
    if (deleted > 0) parts.push(`${deleted} deleted`);
    if (deprecated > 0) parts.push(`${deprecated} deprecated`);
    if (failed > 0) parts.push(`${failed} failed`);
    showToast(parts.join(', '), failed > 0 ? 'error' : 'success');
  }

  // ── Add to Business modal ─────────────────────────────────────────────────

  function openAddBiz(t: Template) {
    setAddBizTemplate(t);
    setSelectedBizIds(new Set());
    setLinkedBusinesses([]);
    setAddBizModalOpen(true);
    fetchLinkedBusinesses(t.id);
  }

  function closeAddBiz() { setAddBizModalOpen(false); setAddBizTemplate(null); setSelectedBizIds(new Set()); }

  function toggleBizSelect(bizId: number) {
    const alreadyLinked = linkedBusinesses.some(l => l.businessId === bizId);
    if (alreadyLinked) return;
    const s = new Set(selectedBizIds);
    s.has(bizId) ? s.delete(bizId) : s.add(bizId);
    setSelectedBizIds(s);
  }

  async function handleAddToBusiness() {
    if (!addBizTemplate || selectedBizIds.size === 0) return;
    setAddBizLoading(true);
    try {
      const r = await fetch(`/api/requirements/${addBizTemplate.id}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessIds: Array.from(selectedBizIds) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');

      const { summary } = d;
      const parts = [];
      if (summary.linked > 0) parts.push(`Linked to ${summary.linked} business${summary.linked !== 1 ? 'es' : ''}`);
      if (summary.duplicates > 0) parts.push(`${summary.duplicates} already linked`);

      showToast(parts.join(' · '), summary.linked > 0 ? 'success' : 'error');
      closeAddBiz();
      fetchTemplates();
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed', 'error'); }
    finally { setAddBizLoading(false); }
  }

  async function handleUnlinkBusiness(templateId: number, businessId: number, businessName: string) {
    try {
      const r = await fetch(`/api/requirements/${templateId}/businesses`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error); }
      showToast(`Unlinked from ${businessName}`);
      fetchLinkedBusinesses(templateId);
      fetchTemplates();
    } catch (e) { showToast(e instanceof Error ? e.message : 'Failed to unlink', 'error'); }
  }

  // ── Selection ─────────────────────────────────────────────────────────────

  function toggleSel(id: number) { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); }
  function toggleSelAll() { setSelectedIds(selectedIds.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id))); }

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total: templates.filter(t => !t.isDeprecated).length,
    deprecated: templates.filter(t => t.isDeprecated).length,
    required: templates.filter(t => !t.isDeprecated && t.necessity === 'Required').length,
    optional: templates.filter(t => !t.isDeprecated && t.necessity === 'Optional').length,
    totalLinks: templates.reduce((sum, t) => sum + t.businessCount, 0),
    cats: new Set(templates.filter(t => !t.isDeprecated).map(t => t.category)).size,
  }), [templates]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{S}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div className="adm" style={{ minHeight: '100vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Requirement Library</h1>
            <p style={{ fontSize: '0.84rem', color: '#55556e' }}>Create requirements once. Add them to any business.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
            <RequirementCSVImport onImportComplete={fetchTemplates} />
            <button className="btn btn-primary" onClick={openNew}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
              New Requirement
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'In Library', val: stats.total, bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
            { label: 'Business Links', val: stats.totalLinks, bg: 'rgba(139,92,246,0.12)', color: '#a78bfa' },
            { label: 'Required', val: stats.required, bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
            { label: 'Optional', val: stats.optional, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
            ...(stats.deprecated > 0 ? [{ label: 'Deprecated', val: stats.deprecated, bg: 'rgba(239,68,68,0.1)', color: '#f87171' }] : []),
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
            <input type="text" placeholder="Search requirements…" value={search} onChange={e => setSearch(e.target.value)} className="u-input" />
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
              {activeFilterCount > 0 && <button onClick={() => { setFilterCat(''); setFilterNec(''); setShowDeprecated(false); }} style={{ fontSize: '0.75rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>Clear all</button>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '0.65rem', alignItems: 'center' }}>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="u-select">
                <option value="">All categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterNec} onChange={e => setFilterNec(e.target.value)} className="u-select">
                <option value="">Any necessity</option>
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: '#9494b0', fontFamily: 'Sora,sans-serif' }}>
                <input type="checkbox" checked={showDeprecated} onChange={e => setShowDeprecated(e.target.checked)} style={{ accentColor: '#f87171', cursor: 'pointer' }} />
                Show deprecated
              </label>
            </div>
          </div>
        )}

        {/* Bulk bar */}
        {selectedIds.size > 0 && (
          <div className="bulk-bar" style={{ marginBottom: '0.75rem', borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)' }}>
            <span>{selectedIds.size} selected</span>
            <button className="btn btn-danger" style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem' }} onClick={() => setBulkConfirm(true)}>Delete selected</button>
            <button className="btn btn-ghost" style={{ padding: '0.3rem 0.75rem', fontSize: '0.76rem' }} onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        )}

        {/* Count */}
        <div style={{ fontSize: '0.75rem', color: '#55556e', marginBottom: '0.75rem' }}>
          Showing <strong style={{ color: '#9494b0' }}>{filtered.length}</strong> of <strong style={{ color: '#9494b0' }}>{templates.filter(t => !t.isDeprecated).length}</strong> requirements
        </div>

        {/* TABLE VIEW */}
        {viewMode === 'table' && (
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="scroll" style={{ overflowX: 'auto' }}>
              <table className="r-table">
                <thead>
                  <tr>
                    <th className="no-sort" style={{ paddingLeft: '1.25rem', width: 40 }}>
                      <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelAll} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                    </th>
                    {[['name', 'Name'], ['category', 'Category'], ['necessity', 'Necessity'], ['productCount', 'Products'], ['businessCount', 'Businesses']].map(([f, l]) => (
                      <th key={f} onClick={() => handleSort(f as SortField)} style={{ userSelect: 'none' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{l}<SortArrow field={f} sortField={sortField} sortDir={sortDir} /></span>
                      </th>
                    ))}
                    <th className="no-sort" style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No requirements found</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className={selectedIds.has(t.id) ? 'sel' : ''} style={{ opacity: t.isDeprecated ? 0.6 : 1 }}>
                      <td style={{ paddingLeft: '1.25rem' }}><input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSel(t.id)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          {t.image && <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}><Image src={t.image} alt={t.name} fill style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)' }} sizes="36px" /></div>}
                          <div>
                            <span style={{ fontWeight: 600, fontSize: '0.87rem', color: '#f0f0f5' }}>{t.name}</span>
                            {t.isDeprecated && <span className="dep-badge" style={{ marginLeft: '0.5rem' }}>deprecated</span>}
                            {t.description && <div style={{ fontSize: '0.74rem', color: '#55556e', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>{t.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td><span style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: catColor(t.category)[0], color: catColor(t.category)[1] }}>{t.category}</span></td>
                      <td><span style={{ display: 'inline-flex', padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 700, background: necStyle(t.necessity).bg, color: necStyle(t.necessity).color }}>{t.necessity}</span></td>
                      <td><span className="adm-mono" style={{ fontSize: '0.85rem', color: '#9494b0' }}>{t.productCount}</span></td>
                      <td>
                        <span className="adm-mono" style={{ fontSize: '0.85rem', color: t.businessCount > 0 ? '#a78bfa' : '#55556e' }}>{t.businessCount}</span>
                      </td>
                      <td style={{ paddingRight: '1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                          {!t.isDeprecated && (
                            <button className="btn btn-accent btn-icon" onClick={() => openAddBiz(t)} title="Add to Business" style={{ padding: '0.4rem 0.65rem', fontSize: '0.72rem', fontWeight: 700, borderRadius: 7, gap: '0.3rem' }}>
                              <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
                              Add to Biz
                            </button>
                          )}
                          <button className="btn btn-ghost btn-icon" onClick={() => openEdit(t)} title="Edit">
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(t.id)} title="Delete">
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CARDS VIEW */}
        {viewMode === 'cards' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '0.85rem' }}>
            {filtered.map(t => (
              <div key={t.id} className="r-card" style={{ opacity: t.isDeprecated ? 0.65 : 1 }}>
                <div style={{ padding: '0.9rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => toggleSel(t.id)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {!t.isDeprecated && <button className="btn btn-accent btn-icon" style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem' }} onClick={() => openAddBiz(t)} title="Add to Business">+Biz</button>}
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(t)}><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(t.id)}><svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg></button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f0f0f5', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {t.name}
                    {t.isDeprecated && <span className="dep-badge">deprecated</span>}
                  </div>
                  {t.description && <div style={{ fontSize: '0.74rem', color: '#55556e', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, marginBottom: '0.6rem' }}>{t.description}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    <span style={{ display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, background: catColor(t.category)[0], color: catColor(t.category)[1] }}>{t.category}</span>
                    <span style={{ display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700, background: necStyle(t.necessity).bg, color: necStyle(t.necessity).color }}>{t.necessity}</span>
                  </div>
                </div>
                <div style={{ padding: '0.55rem 1rem', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#55556e' }}>
                  <span className="adm-mono">{t.productCount} products</span>
                  <span style={{ color: t.businessCount > 0 ? '#a78bfa' : '#55556e' }} className="adm-mono">{t.businessCount} businesses</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Create / Edit Modal ── */}
        {formOpen && (
          <div className="modal-overlay" onClick={() => setFormOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{editingId ? 'Edit' : 'New'} Requirement</h2>
                <button onClick={() => setFormOpen(false)} className="btn btn-ghost btn-icon">×</button>
              </div>

              {editingId && (
                <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.78rem', color: '#a5b4fc', lineHeight: 1.6 }}>
                  Changes here apply to <strong>all businesses</strong> that have linked this requirement.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div>
                  <label className="f-label">Name *</label>
                  <input type="text" placeholder="e.g. Business Permit, Laptop, POS System" className="f-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus />
                </div>
                <div>
                  <label className="f-label">Description</label>
                  <textarea placeholder="Use [businessName] to personalise — e.g. 'You need a business permit to operate your [businessName].'" className="f-textarea" rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                  <div className="f-hint highlight">Tip: [businessName] is replaced with the business name wherever this requirement appears.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="f-label">Category *</label>
                    <select className="f-select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      <option value="">Select…</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="f-label">Image URL</label>
                    <input type="text" placeholder="https://…" className="f-input" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="f-label">Necessity *</label>
                  <div style={{ display: 'flex', gap: '0.65rem' }}>
                    {(['Required', 'Optional'] as const).map(v => (
                      <label key={v} className="nec-opt" style={{ borderColor: formData.necessity === v ? (v === 'Required' ? 'rgba(16,185,129,0.5)' : 'rgba(245,158,11,0.5)') : 'rgba(255,255,255,0.07)', background: formData.necessity === v ? (v === 'Required' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)') : 'transparent', color: formData.necessity === v ? (v === 'Required' ? '#34d399' : '#fbbf24') : '#9494b0' }}>
                        <input type="radio" name="nec" value={v} checked={formData.necessity === v} onChange={() => setFormData({ ...formData, necessity: v })} style={{ display: 'none' }} />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={formLoading || !formData.name || !formData.category || !formData.necessity}>
                    {formLoading ? 'Saving…' : editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Add to Business Modal ── */}
        {addBizModalOpen && addBizTemplate && (
          <div className="modal-overlay" onClick={closeAddBiz}>
            <div className="modal-box modal-lg" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>Add to Business</h2>
                  <p style={{ fontSize: '0.8rem', color: '#55556e' }}>
                    <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{addBizTemplate.name}</span> — select businesses to link
                  </p>
                </div>
                <button onClick={closeAddBiz} className="btn btn-ghost btn-icon">×</button>
              </div>

              {/* Already linked */}
              {linkedLoading ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#55556e', fontSize: '0.82rem' }}>Loading linked businesses…</div>
              ) : linkedBusinesses.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    Already linked ({linkedBusinesses.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 160, overflowY: 'auto' }} className="scroll">
                    {linkedBusinesses.map(lb => (
                      <div key={lb.linkId} className="linked-biz-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: lb.published ? '#34d399' : '#55556e', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.84rem', color: '#f0f0f5', fontWeight: 600 }}>{lb.businessName}</span>
                          {!lb.published && <span style={{ fontSize: '0.7rem', color: '#55556e' }}>draft</span>}
                        </div>
                        <button
                          className="btn btn-danger btn-icon"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                          onClick={() => handleUnlinkBusiness(addBizTemplate.id, lb.businessId, lb.businessName)}
                          title="Unlink"
                        >
                          Unlink
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available businesses to add */}
              {(() => {
                const linkedIds = new Set(linkedBusinesses.map(l => l.businessId));
                const available = businesses.filter(b => !linkedIds.has(b.id));
                return available.length > 0 ? (
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                      Add to business {selectedBizIds.size > 0 && <span style={{ color: '#a78bfa' }}>({selectedBizIds.size} selected)</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: 240, overflowY: 'auto' }} className="scroll">
                      {available.map(b => (
                        <div key={b.id} className={`biz-check-row${selectedBizIds.has(b.id) ? ' selected' : ''}`} onClick={() => toggleBizSelect(b.id)}>
                          <input type="checkbox" checked={selectedBizIds.has(b.id)} onChange={() => toggleBizSelect(b.id)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.published ? '#34d399' : '#55556e', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.84rem', color: '#f0f0f5', fontWeight: 500 }}>{b.name}</span>
                          {!b.published && <span style={{ fontSize: '0.7rem', color: '#55556e', marginLeft: 'auto' }}>draft</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '1.5rem', color: '#55556e', fontSize: '0.82rem' }}>
                    This requirement is already linked to all businesses.
                  </div>
                );
              })()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '1.25rem' }}>
                <button className="btn btn-ghost" onClick={closeAddBiz}>Close</button>
                {selectedBizIds.size > 0 && (
                  <button className="btn btn-primary" onClick={handleAddToBusiness} disabled={addBizLoading}>
                    {addBizLoading ? 'Linking…' : `Link to ${selectedBizIds.size} business${selectedBizIds.size !== 1 ? 'es' : ''}`}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Delete confirm ── */}
        {deleteId !== null && (
          <div className="modal-overlay" onClick={() => setDeleteId(null)}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Delete requirement?</h3>
                <p style={{ fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.5 }}>
                  If this requirement is linked to businesses, it will be deprecated instead of deleted. Existing links are preserved.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete / Deprecate</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Bulk delete confirm ── */}
        {bulkConfirm && (
          <div className="modal-overlay" onClick={() => setBulkConfirm(false)}>
            <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Delete {selectedIds.size} requirements?</h3>
                <p style={{ fontSize: '0.82rem', color: '#9494b0' }}>Linked requirements will be deprecated. Unlinked ones will be permanently deleted.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setBulkConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleBulkDelete}>Confirm</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}