/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/admin/trade-classes/page.tsx
'use client';
import { useEffect, useState, useMemo } from 'react';

type BusinessCategory = { id: number; name: string };

type TradeClass = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  feeScheduleCount: number;
  businessOverrideCount: number;
  defaultForCategories: { id: number; name: string }[];
  createdAt: string;
  updatedAt: string;
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; box-sizing:border-box; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:none; box-sizing:border-box; }
  .f-textarea:focus { border-color:rgba(99,102,241,0.5); }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover:not(:disabled) { background:rgba(239,68,68,0.22); }
  .btn-danger:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .stat-pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 1rem; border-radius:10px; }
  .badge { display:inline-flex; padding:0.15rem 0.55rem; border-radius:100px; font-size:0.68rem; font-weight:700; }
  .cat-check-row { display:flex; align-items:center; gap:0.6rem; padding:0.5rem 0.7rem; border-radius:7px; cursor:pointer; font-size:0.82rem; transition:background 0.15s; }
  .cat-check-row:hover { background:rgba(255,255,255,0.04); }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:480px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .modal-sm { max-width:400px; }
  .scroll::-webkit-scrollbar { width:4px; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

export default function TradeClassesAdminPage() {
  const [tradeClasses, setTradeClasses] = useState<TradeClass[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryIds, setFormCategoryIds] = useState<Set<number>>(new Set());
  const [formSaving, setFormSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<number | null>(null);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchTradeClasses() {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/trade-classes');
      if (!r.ok) throw new Error();
      setTradeClasses(await r.json());
    } catch { setTradeClasses([]); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    fetchTradeClasses();
    fetch('/api/business-categories').then(r => r.json()).then(setCategories).catch(() => setCategories([]));
  }, []);

  function openNew() {
    setEditingId(null); setFormName(''); setFormDescription('');
    setFormCategoryIds(new Set()); setFormOpen(true);
  }

  function openEdit(tc: TradeClass) {
    setEditingId(tc.id); setFormName(tc.name); setFormDescription(tc.description ?? '');
    setFormCategoryIds(new Set(tc.defaultForCategories.map(c => c.id)));
    setFormOpen(true);
  }

  function toggleCategory(id: number) {
    const s = new Set(formCategoryIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    setFormCategoryIds(s);
  }

  async function handleSubmit() {
    if (!formName.trim()) { showToast('Name is required.', 'error'); return; }
    setFormSaving(true);
    try {
      const url = editingId ? `/api/admin/trade-classes/${editingId}` : '/api/admin/trade-classes';
      const method = editingId ? 'PATCH' : 'POST';
      const r = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
          categoryIds: Array.from(formCategoryIds),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      showToast(editingId ? 'Trade class updated.' : 'Trade class created.');
      setFormOpen(false); fetchTradeClasses();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally { setFormSaving(false); }
  }

  async function handleDelete() {
    if (deleteId === null) return;
    try {
      const r = await fetch(`/api/admin/trade-classes/${deleteId}`, { method: 'DELETE' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to delete');
      showToast('Trade class deleted.');
      fetchTradeClasses();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete', 'error');
    } finally { setDeleteId(null); }
  }

  const filtered = useMemo(() => {
    if (!search) return tradeClasses;
    const q = search.toLowerCase();
    return tradeClasses.filter(tc => tc.name.toLowerCase().includes(q) || tc.description?.toLowerCase().includes(q));
  }, [tradeClasses, search]);

  const stats = useMemo(() => ({
    total: tradeClasses.length,
    withCategoryDefault: tradeClasses.filter(tc => tc.defaultForCategories.length > 0).length,
    withFeeRows: tradeClasses.filter(tc => tc.feeScheduleCount > 0).length,
    unassignedCategories: categories.length - new Set(tradeClasses.flatMap(tc => tc.defaultForCategories.map(c => c.id))).size,
  }), [tradeClasses, categories]);

  return (
    <div className="adm" style={{ minHeight: '100vh' }}>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Trade Classes</h1>
          <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 620, lineHeight: 1.5 }}>
            How counties actually classify businesses for fee purposes — separate from the site's browsing categories.
            E.g. "Hyper Supermarket", "Large Trader Shop", "Barbershop / Salon". Assign each business category a
            sensible default here so fee lookups resolve automatically.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4" /></svg>
          New Trade Class
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Trade Classes', val: stats.total, bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
          { label: 'With Category Default', val: stats.withCategoryDefault, bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
          { label: 'With Fee Rows', val: stats.withFeeRows, bg: 'rgba(20,184,166,0.12)', color: '#2dd4bf' },
          { label: 'Unassigned Categories', val: stats.unassignedCategories, bg: stats.unassignedCategories > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(148,148,176,0.1)', color: stats.unassignedCategories > 0 ? '#fbbf24' : '#9494b0' },
        ].map(s => (
          <div key={s.label} className="stat-pill" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
            <span className="adm-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.val}</span>
            <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.75 }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', marginBottom: '0.85rem', maxWidth: 360 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
        <input type="text" placeholder="Search trade classes…" value={search} onChange={e => setSearch(e.target.value)} className="u-input" />
      </div>

      <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
        <div className="scroll" style={{ overflowX: 'auto' }}>
          <table className="r-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.25rem' }}>Name</th>
                <th>Default For</th>
                <th>Fee Rows</th>
                <th>Business Overrides</th>
                <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#55556e' }}>Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No trade classes yet</td></tr>
              ) : filtered.map(tc => (
                <tr key={tc.id}>
                  <td style={{ paddingLeft: '1.25rem' }}>
                    <div style={{ fontWeight: 600, color: '#f0f0f5', fontSize: '0.86rem' }}>{tc.name}</div>
                    {tc.description && <div style={{ fontSize: '0.74rem', color: '#55556e', marginTop: '0.15rem', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tc.description}</div>}
                  </td>
                  <td>
                    {tc.defaultForCategories.length === 0 ? (
                      <span style={{ color: '#55556e', fontSize: '0.8rem' }}>—</span>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: 260 }}>
                        {tc.defaultForCategories.map(c => (
                          <span key={c.id} className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{c.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="adm-mono" style={{ color: '#2dd4bf', fontWeight: 700 }}>{tc.feeScheduleCount}</td>
                  <td className="adm-mono" style={{ color: '#9494b0' }}>{tc.businessOverrideCount}</td>
                  <td style={{ paddingRight: '1.25rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(tc)}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button className="btn btn-danger btn-icon" onClick={() => setDeleteId(tc.id)}>
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / edit modal */}
      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{editingId ? 'Edit' : 'New'} Trade Class</h2>
              <button onClick={() => setFormOpen(false)} className="btn btn-ghost btn-icon">×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div>
                <label className="f-label">Name *</label>
                <input className="f-input" placeholder="e.g. Hyper Supermarket" value={formName} onChange={e => setFormName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="f-label">Description</label>
                <textarea className="f-textarea" rows={2} placeholder="What distinguishes this trade class, e.g. floor area or stock type" value={formDescription} onChange={e => setFormDescription(e.target.value)} />
              </div>
              <div>
                <label className="f-label">Default for business categories</label>
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, padding: '0.4rem' }} className="scroll">
                  {categories.length === 0 ? (
                    <div style={{ padding: '0.6rem', color: '#55556e', fontSize: '0.8rem' }}>No categories found.</div>
                  ) : categories.map(c => (
                    <label key={c.id} className="cat-check-row">
                      <input type="checkbox" checked={formCategoryIds.has(c.id)} onChange={() => toggleCategory(c.id)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                      <span style={{ color: formCategoryIds.has(c.id) ? '#f0f0f5' : '#9494b0' }}>{c.name}</span>
                    </label>
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#55556e', marginTop: '0.35rem', lineHeight: 1.5 }}>
                  Most businesses in a checked category will use this trade class for fee lookups, unless the
                  individual business has its own override set.
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.4rem' }}>
                <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={formSaving || !formName.trim()}>
                  {formSaving ? 'Saving…' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-box modal-sm" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Delete this trade class?</h3>
              <p style={{ fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.5 }}>
                Only possible if it's not used by any fee rows, business overrides, or category defaults.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}