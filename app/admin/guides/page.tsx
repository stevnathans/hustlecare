'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Plus, Edit2, Eye, EyeOff, BookOpen,
  Filter, X, ArrowUpDown, ArrowUp, ArrowDown,
  Building, ChevronDown, ExternalLink,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

type GuideStatus = 'published' | 'draft' | 'none';

type BusinessWithGuide = {
  id:          number;
  name:        string;
  slug:        string;
  published:   boolean;
  category:    { name: string } | null;
  createdAt:   string;
  guide: {
    id:          number;
    isPublished: boolean;
    stepCount:   number;
    faqCount:    number;
    updatedAt:   string;
  } | null;
};

type SortField = 'name' | 'category' | 'guideStatus' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

// ── Styles (mirrors admin dark theme) ────────────────────────────────────────

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .b-table { width:100%; border-collapse:collapse; }
  .b-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .b-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .b-table tbody tr { transition:background 0.15s; }
  .b-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .b-table th.sort { cursor:pointer; }
  .b-table th.sort:hover { color:#a5b4fc; }

  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .btn-filter { background:rgba(255,255,255,0.05); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-filter.active { background:rgba(99,102,241,0.12); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }

  .cat-pill { display:inline-flex; align-items:center; padding:0.22rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:600; background:rgba(139,92,246,0.12); color:#a78bfa; }
  .code-pill { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.06); border-radius:6px; padding:0.2rem 0.5rem; font-family:'DM Mono',monospace; font-size:0.74rem; color:#9494b0; }

  .guide-pill { display:inline-flex; align-items:center; gap:0.3rem; padding:0.22rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:600; }
  .guide-pill-published { background:rgba(16,185,129,0.12); color:#34d399; }
  .guide-pill-draft     { background:rgba(99,102,241,0.12); color:#a5b4fc; }
  .guide-pill-none      { background:rgba(255,255,255,0.06); color:#55556e; }

  .filter-panel { background:#1a1a24; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; margin-bottom:1rem; }

  .skel { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

  /* Business picker modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; width:100%; max-width:480px; box-shadow:0 24px 80px rgba(0,0,0,0.6); display:flex; flex-direction:column; max-height:80vh; overflow:hidden; }
  .biz-option { display:flex; align-items:center; gap:0.75rem; padding:0.75rem 1rem; cursor:pointer; transition:background 0.12s; border-radius:9px; }
  .biz-option:hover { background:rgba(99,102,241,0.08); }
  .biz-option.selected { background:rgba(99,102,241,0.14); }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function guideStatus(b: BusinessWithGuide): GuideStatus {
  if (!b.guide) return 'none';
  return b.guide.isPublished ? 'published' : 'draft';
}

function GuidePill({ status }: { status: GuideStatus }) {
  if (status === 'published') return <span className="guide-pill guide-pill-published"><Eye size={10} />Published</span>;
  if (status === 'draft')     return <span className="guide-pill guide-pill-draft"><EyeOff size={10} />Draft</span>;
  return <span className="guide-pill guide-pill-none">No guide</span>;
}

function SortIcon({ active, order }: { field: string; active: boolean; order: SortOrder }) {
  if (!active) return <ArrowUpDown size={11} style={{ opacity: 0.35 }} />;
  return active && order === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function GuidesAdminPage() {
  const router = useRouter();

  const [businesses, setBusinesses]   = useState<BusinessWithGuide[]>([]);
  const [loading,    setLoading]      = useState(true);
  const [search,     setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | GuideStatus>('all');
  const [showFilters,  setShowFilters]  = useState(false);
  const [sortField,  setSortField]    = useState<SortField>('name');
  const [sortOrder,  setSortOrder]    = useState<SortOrder>('asc');

  // Business picker modal (for "New Guide" button)
  const [pickerOpen,       setPickerOpen]       = useState(false);
  const [pickerSearch,     setPickerSearch]     = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/guides');
      if (res.ok) setBusinesses(await res.json());
    } catch {
      toast.error('Failed to load guides');
    } finally {
      setLoading(false);
    }
  }

  // ── Derived lists ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let f = businesses;

    if (search) {
      const q = search.toLowerCase();
      f = f.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.category?.name.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      f = f.filter(b => guideStatus(b) === statusFilter);
    }

    return [...f].sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';

      if (sortField === 'name') {
        av = a.name.toLowerCase(); bv = b.name.toLowerCase();
      } else if (sortField === 'category') {
        av = a.category?.name.toLowerCase() || ''; bv = b.category?.name.toLowerCase() || '';
      } else if (sortField === 'guideStatus') {
        const order = { published: 0, draft: 1, none: 2 };
        av = order[guideStatus(a)]; bv = order[guideStatus(b)];
      } else if (sortField === 'updatedAt') {
        av = a.guide ? new Date(a.guide.updatedAt).getTime() : 0;
        bv = b.guide ? new Date(b.guide.updatedAt).getTime() : 0;
      }

      return av < bv
        ? sortOrder === 'asc' ? -1 : 1
        : av > bv ? sortOrder === 'asc' ? 1 : -1 : 0;
    });
  }, [businesses, search, statusFilter, sortField, sortOrder]);

  // Businesses that don't yet have a guide, for the picker
  const businessesWithoutGuide = useMemo(() =>
    businesses.filter(b => !b.guide),
    [businesses]
  );

  const pickerFiltered = useMemo(() => {
    if (!pickerSearch.trim()) return businessesWithoutGuide;
    const q = pickerSearch.toLowerCase();
    return businessesWithoutGuide.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.category?.name.toLowerCase().includes(q)
    );
  }, [businessesWithoutGuide, pickerSearch]);

  // ── Interactions ───────────────────────────────────────────────────────────

  function handleSort(field: SortField) {
    if (sortField === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  }

  function goToEditor(businessId: number) {
    router.push(`/admin/businesses/${businessId}/how-to-start`);
  }

  function handlePickBusiness(biz: BusinessWithGuide) {
    setPickerOpen(false);
    setPickerSearch('');
    goToEditor(biz.id);
  }

  const counts = useMemo(() => ({
    published: businesses.filter(b => guideStatus(b) === 'published').length,
    draft:     businesses.filter(b => guideStatus(b) === 'draft').length,
    none:      businesses.filter(b => guideStatus(b) === 'none').length,
  }), [businesses]);

  const activeFilters = (statusFilter !== 'all' ? 1 : 0) + (search !== '' ? 1 : 0);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1a1a24', color: '#f0f0f5', border: '1px solid rgba(255,255,255,0.09)' } }} />

      <div className="adm" style={{ minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>How-To Guides</h1>
            <p style={{ fontSize: '0.84rem', color: '#55556e' }}>
              {counts.published} published · {counts.draft} draft · {counts.none} without a guide
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => { setPickerOpen(true); setPickerSearch(''); }}
            disabled={businessesWithoutGuide.length === 0}
          >
            <Plus size={14} /> New Guide
          </button>
        </div>

        {/* ── Summary chips ── */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {([ ['all', 'All Businesses', businesses.length],
              ['published', 'Published', counts.published],
              ['draft', 'Draft', counts.draft],
              ['none', 'No Guide', counts.none],
          ] as const).map(([val, label, count]) => (
            <button
              key={val}
              onClick={() => setStatusFilter(val)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: 100,
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                fontFamily: 'Sora,sans-serif',
                background: statusFilter === val ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
                color: statusFilter === val ? '#a5b4fc' : '#9494b0',
                transition: 'all 0.15s',
              }}
            >
              {label} <span style={{ opacity: 0.6, marginLeft: '0.3rem' }}>{count}</span>
            </button>
          ))}
        </div>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search businesses or categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="u-input"
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>
          <button
            className={`btn btn-filter${showFilters || activeFilters > 0 ? ' active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
          >
            <Filter size={14} /> Filters
            {activeFilters > 0 && (
              <span style={{ background: '#6366f1', color: '#fff', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', marginLeft: '0.2rem' }}>
                {activeFilters}
              </span>
            )}
          </button>
        </div>

        {/* ── Filter panel ── */}
        {showFilters && (
          <div className="filter-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#9494b0' }}>Filters</span>
              <button
                onClick={() => { setStatusFilter('all'); setSearch(''); }}
                style={{ fontSize: '0.75rem', color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}
              >
                Clear all
              </button>
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="u-select" style={{ minWidth: 180 }}>
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="none">No guide yet</option>
            </select>
          </div>
        )}

        {/* ── Table ── */}
        <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div className="scroll" style={{ overflowX: 'auto' }}>
            <table className="b-table">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>#</th>
                  <th className="sort" onClick={() => handleSort('name')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: sortField === 'name' ? '#a5b4fc' : undefined }}>
                      Business <SortIcon field="name" active={sortField === 'name'} order={sortOrder} />
                    </span>
                  </th>
                  <th className="sort" onClick={() => handleSort('category')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: sortField === 'category' ? '#a5b4fc' : undefined }}>
                      Category <SortIcon field="category" active={sortField === 'category'} order={sortOrder} />
                    </span>
                  </th>
                  <th className="sort" onClick={() => handleSort('guideStatus')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: sortField === 'guideStatus' ? '#a5b4fc' : undefined }}>
                      Guide Status <SortIcon field="guideStatus" active={sortField === 'guideStatus'} order={sortOrder} />
                    </span>
                  </th>
                  <th>Contents</th>
                  <th className="sort" onClick={() => handleSort('updatedAt')}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: sortField === 'updatedAt' ? '#a5b4fc' : undefined }}>
                      Last Updated <SortIcon field="updatedAt" active={sortField === 'updatedAt'} order={sortOrder} />
                    </span>
                  </th>
                  <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1,2,3,4,5].map(i => (
                    <tr key={i}>
                      {[48, 220, 120, 120, 100, 110, 120].map((w, j) => (
                        <td key={j}><div className="skel" style={{ height: 18, width: w * 0.7 }} /></td>
                      ))}
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: '#3a3a56' }}>
                      <BookOpen size={36} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ color: '#55556e', fontWeight: 600 }}>
                        {search || statusFilter !== 'all' ? 'No matches found' : 'No businesses yet'}
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((biz, i) => {
                  const status = guideStatus(biz);
                  return (
                    <tr key={biz.id}>
                      <td>
                        <span className="adm-mono" style={{ fontSize: '0.75rem', color: '#3a3a56' }}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f0f0f5', marginBottom: '0.2rem' }}>
                          {biz.name}
                        </div>
                        <span className="code-pill">{biz.slug}</span>
                      </td>
                      <td>
                        {biz.category
                          ? <span className="cat-pill">{biz.category.name}</span>
                          : <span style={{ color: '#3a3a56' }}>—</span>
                        }
                      </td>
                      <td>
                        <GuidePill status={status} />
                      </td>
                      <td>
                        {biz.guide ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="adm-mono" style={{ fontSize: '0.74rem', color: '#9494b0' }}>
                              {biz.guide.stepCount} step{biz.guide.stepCount !== 1 ? 's' : ''}
                            </span>
                            <span style={{ color: '#3a3a56' }}>·</span>
                            <span className="adm-mono" style={{ fontSize: '0.74rem', color: '#9494b0' }}>
                              {biz.guide.faqCount} FAQ{biz.guide.faqCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: '#3a3a56', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', color: '#55556e' }}>
                          {biz.guide
                            ? new Date(biz.guide.updatedAt).toLocaleDateString()
                            : <span style={{ color: '#3a3a56' }}>Never</span>
                          }
                        </span>
                      </td>
                      <td style={{ paddingRight: '1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          {/* Edit / Create */}
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => goToEditor(biz.id)}
                            title={status === 'none' ? 'Create guide' : 'Edit guide'}
                          >
                            {status === 'none'
                              ? <Plus size={14} />
                              : <Edit2 size={14} />
                            }
                          </button>
                          {/* Preview (only if guide exists and is published) */}
                          {status === 'published' && (
                            <a
                              href={`/businesses/${biz.slug}/how-to-start`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-icon"
                              title="Preview live guide"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', color: '#55556e' }}>
            Showing <span style={{ color: '#9494b0', fontWeight: 600 }}>{filtered.length}</span> of <span style={{ color: '#9494b0', fontWeight: 600 }}>{businesses.length}</span> businesses
          </div>
        </div>

      </div>

      {/* ── Business Picker Modal ── */}
      {pickerOpen && (
        <div className="modal-overlay" onClick={() => setPickerOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'Sora,sans-serif', marginBottom: '0.15rem' }}>
                    Create New Guide
                  </h2>
                  <p style={{ fontSize: '0.78rem', color: '#55556e', fontFamily: 'Sora,sans-serif' }}>
                    Pick a business to write a guide for
                  </p>
                </div>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={() => setPickerOpen(false)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search businesses…"
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="u-input"
                />
                {pickerSearch && (
                  <button onClick={() => setPickerSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: 0 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Business list */}
            <div className="scroll" style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
              {pickerFiltered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#55556e' }}>
                  <Building size={28} style={{ margin: '0 auto 0.6rem', display: 'block', opacity: 0.4 }} />
                  <div style={{ fontSize: '0.84rem', fontFamily: 'Sora,sans-serif' }}>
                    {pickerSearch
                      ? `No businesses match "${pickerSearch}"`
                      : 'All businesses already have guides!'
                    }
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {pickerFiltered.map(biz => (
                    <button
                      key={biz.id}
                      className="biz-option"
                      onClick={() => handlePickBusiness(biz)}
                      style={{ width: '100%', border: 'none', background: 'none', fontFamily: 'Sora,sans-serif', textAlign: 'left' }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Building size={16} color="#818cf8" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {biz.name}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: '#55556e', marginTop: '0.1rem' }}>
                          {biz.category?.name ?? 'Uncategorized'} · <span style={{ fontFamily: 'DM Mono,monospace' }}>{biz.slug}</span>
                        </div>
                      </div>
                      <ChevronDown size={14} color="#55556e" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.73rem', color: '#3a3a56', fontFamily: 'Sora,sans-serif', flexShrink: 0 }}>
              Only businesses without an existing guide are shown.
            </div>
          </div>
        </div>
      )}
    </>
  );
}