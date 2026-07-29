/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/admin/legal-fee-schedules/page.tsx
'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';

type Template = { id: number; name: string; category: string; isCountyFeeSchedule: boolean };
type County = { id: number; name: string; slug: string };
type BusinessCategory = { id: number; name: string };
type SizeBand = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

type FeeRow = {
  id: number;
  countyId: number;
  county: { id: number; name: string };
  businessCategoryId: number | null;
  businessCategory: { id: number; name: string } | null;
  sizeBand: SizeBand | null;
  price: number;
  validityValue: number | null;
  validityUnit: string | null;
  processingTimeMinDays: number | null;
  processingTimeMaxDays: number | null;
  notes: string | null;
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; cursor:pointer; appearance:none; width:100%; box-sizing:border-box; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }
  .f-label { display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#9494b0; margin-bottom:0.4rem; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.84rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-primary:disabled { opacity:0.5; transform:none; cursor:not-allowed; }
  .btn-secondary { background:rgba(16,185,129,0.14); color:#34d399; border:1px solid rgba(16,185,129,0.25); }
  .btn-secondary:hover:not(:disabled) { background:rgba(16,185,129,0.22); }
  .btn-secondary:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-icon { padding:0.4rem; border-radius:8px; }
  .stat-pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 1rem; border-radius:10px; }
  .panel { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1.25rem 1.5rem; margin-bottom:1.1rem; }
  .panel-title { font-size:0.92rem; font-weight:700; color:#f0f0f5; margin-bottom:0.25rem; }
  .panel-sub { font-size:0.78rem; color:#55556e; margin-bottom:1rem; line-height:1.5; }
  .warn-note { margin-top:0.6rem; font-size:0.78rem; color:#fbbf24; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:8px; padding:0.6rem 0.8rem; line-height:1.5; }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .badge { display:inline-flex; padding:0.18rem 0.55rem; border-radius:100px; font-size:0.7rem; font-weight:700; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:400px; box-shadow:0 24px 80px rgba(0,0,0,0.6); }
`;

function formatValidity(row: FeeRow): string {
  if (!row.validityValue || !row.validityUnit) return '—';
  return `${row.validityValue} ${row.validityUnit}`;
}

function formatProcessing(row: FeeRow): string {
  if (row.processingTimeMinDays == null && row.processingTimeMaxDays == null) return '—';
  if (row.processingTimeMinDays != null && row.processingTimeMaxDays != null) {
    return row.processingTimeMinDays === row.processingTimeMaxDays
      ? `${row.processingTimeMinDays}d`
      : `${row.processingTimeMinDays}–${row.processingTimeMaxDays}d`;
  }
  return `${row.processingTimeMinDays ?? row.processingTimeMaxDays}d`;
}

export default function LegalFeeSchedulesAdminPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteRowId, setDeleteRowId] = useState<number | null>(null);

  // Bulk default form
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Single-row / override form
  const [rowCountyId, setRowCountyId] = useState('');
  const [rowCategoryId, setRowCategoryId] = useState('');
  const [rowSizeBand, setRowSizeBand] = useState<SizeBand | ''>('');
  const [rowPrice, setRowPrice] = useState('');
  const [rowValidityValue, setRowValidityValue] = useState('');
  const [rowValidityUnit, setRowValidityUnit] = useState('years');
  const [rowProcMin, setRowProcMin] = useState('');
  const [rowProcMax, setRowProcMax] = useState('');
  const [rowSaving, setRowSaving] = useState(false);

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch('/api/requirements')
      .then((r) => r.json())
      .then((d) => setTemplates(Array.isArray(d) ? d.filter((t: Template) => t.isCountyFeeSchedule) : []))
      .catch(() => setTemplates([]));
    fetch('/api/counties')
      .then((r) => r.json())
      .then((d) => setCounties(Array.isArray(d) ? d : []))
      .catch(() => setCounties([]));
    fetch('/api/business-categories')
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  const fetchRows = useCallback(async (templateId: number) => {
    setLoadingRows(true);
    try {
      const r = await fetch(`/api/admin/legal-fee-schedules?templateId=${templateId}`);
      if (r.ok) setRows(await r.json());
      else setRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoadingRows(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTemplateId) fetchRows(selectedTemplateId);
    else setRows([]);
  }, [selectedTemplateId, fetchRows]);

  async function handleBulkSet() {
    if (!selectedTemplateId || !bulkPrice) return;
    setBulkSaving(true);
    try {
      const r = await fetch('/api/admin/legal-fee-schedules/bulk-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplateId, price: Number(bulkPrice) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      showToast(d.message || 'Flat rate applied to all counties.');
      setBulkPrice('');
      fetchRows(selectedTemplateId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to set bulk rate', 'error');
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleAddOverride() {
    if (!selectedTemplateId || !rowCountyId || !rowPrice) {
      showToast('County and price are required.', 'error');
      return;
    }
    setRowSaving(true);
    try {
      const r = await fetch('/api/admin/legal-fee-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          countyId: Number(rowCountyId),
          businessCategoryId: rowCategoryId ? Number(rowCategoryId) : null,
          sizeBand: rowSizeBand || null,
          price: Number(rowPrice),
          validityValue: rowValidityValue ? Number(rowValidityValue) : null,
          validityUnit: rowValidityValue ? rowValidityUnit : null,
          processingTimeMinDays: rowProcMin ? Number(rowProcMin) : null,
          processingTimeMaxDays: rowProcMax ? Number(rowProcMax) : null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      showToast('Saved.');
      setRowCountyId(''); setRowCategoryId(''); setRowSizeBand(''); setRowPrice('');
      setRowValidityValue(''); setRowProcMin(''); setRowProcMax('');
      fetchRows(selectedTemplateId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to save', 'error');
    } finally {
      setRowSaving(false);
    }
  }

  async function handleDeleteRow() {
    if (deleteRowId === null) return;
    try {
      const r = await fetch(`/api/admin/legal-fee-schedules/${deleteRowId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to delete');
      showToast('Deleted.');
      if (selectedTemplateId) fetchRows(selectedTemplateId);
    } catch {
      showToast('Failed to delete', 'error');
    } finally {
      setDeleteRowId(null);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const stats = useMemo(() => {
    const countiesCovered = new Set(rows.map((r) => r.countyId)).size;
    const withOverrides = rows.filter((r) => r.businessCategoryId !== null || r.sizeBand !== null).length;
    const prices = rows.map((r) => r.price);
    const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    return { countiesCovered, withOverrides, avgPrice, total: rows.length };
  }, [rows]);

  return (
    <div className="adm" style={{ minHeight: '100vh' }}>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>County Fee Schedule</h1>
        <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 640, lineHeight: 1.5 }}>
          Enter prices for county-issued requirements (Business Permit, Health Certificate, etc.). If a
          requirement doesn't show up below, first flag it "County fee schedule" in the Requirement Library.
        </p>
      </div>

      {/* Step 1: pick a requirement */}
      <div className="panel">
        <div className="f-label">Requirement</div>
        <select
          className="u-select"
          value={selectedTemplateId ?? ''}
          onChange={(e) => setSelectedTemplateId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— Select a requirement —</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        {templates.length === 0 && (
          <div className="warn-note">
            No requirements are flagged "County fee schedule" yet. Go to Requirement Library → edit a
            Legal requirement (e.g. Business Permit) → check that box first.
          </div>
        )}
      </div>

      {selectedTemplate && (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Priced Rows', val: stats.total, bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
              { label: 'Counties Covered', val: `${stats.countiesCovered}/47`, bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
              { label: 'With Overrides', val: stats.withOverrides, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
              { label: 'Avg Price', val: stats.total ? `KSh ${stats.avgPrice.toLocaleString()}` : '—', bg: 'rgba(148,148,176,0.1)', color: '#9494b0' },
            ].map((s) => (
              <div key={s.label} className="stat-pill" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                <span className="adm-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.75 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Step 2: quick flat rate for everyone */}
          <div className="panel">
            <div className="panel-title">Set one price for all 47 counties</div>
            <div className="panel-sub">
              Fastest way to get started — this sets the same price everywhere. You can override
              specific counties below afterward.
            </div>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <input
                type="number"
                placeholder="e.g. 8000"
                className="u-input"
                style={{ flex: 1 }}
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
              />
              <button onClick={handleBulkSet} disabled={bulkSaving || !bulkPrice} className="btn btn-secondary">
                {bulkSaving ? 'Applying…' : 'Apply to all counties'}
              </button>
            </div>
          </div>

          {/* Step 3: add a specific override */}
          <div className="panel">
            <div className="panel-title">Add or update a specific county's price</div>
            <div className="panel-sub">
              Use this when one county's real fee is different from the flat rate above — or to add
              pricing that varies by business type/size.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <div className="f-label">County *</div>
                <select className="u-select" value={rowCountyId} onChange={(e) => setRowCountyId(e.target.value)}>
                  <option value="">Select…</option>
                  {counties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="f-label">Business Type</div>
                <select className="u-select" value={rowCategoryId} onChange={(e) => setRowCategoryId(e.target.value)}>
                  <option value="">Any type</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="f-label">Size</div>
                <select className="u-select" value={rowSizeBand} onChange={(e) => setRowSizeBand(e.target.value as SizeBand | '')}>
                  <option value="">Any size</option>
                  <option value="MICRO">Micro</option>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>
              <div>
                <div className="f-label">Price (KSh) *</div>
                <input type="number" className="u-input" value={rowPrice} onChange={(e) => setRowPrice(e.target.value)} />
              </div>
              <div>
                <div className="f-label">Validity</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input
                    type="number"
                    placeholder="1"
                    className="u-input"
                    style={{ width: 64, flexShrink: 0 }}
                    value={rowValidityValue}
                    onChange={(e) => setRowValidityValue(e.target.value)}
                  />
                  <select className="u-select" value={rowValidityUnit} onChange={(e) => setRowValidityUnit(e.target.value)}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="f-label">Processing (days)</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input type="number" placeholder="Min" className="u-input" value={rowProcMin} onChange={(e) => setRowProcMin(e.target.value)} />
                  <input type="number" placeholder="Max" className="u-input" value={rowProcMax} onChange={(e) => setRowProcMax(e.target.value)} />
                </div>
              </div>
            </div>
            <button onClick={handleAddOverride} disabled={rowSaving} className="btn btn-primary">
              {rowSaving ? 'Saving…' : 'Save this price'}
            </button>
          </div>

          {/* Step 4: existing rows */}
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>Current prices for {selectedTemplate.name} ({rows.length})</span>
            </div>
            {loadingRows ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#55556e', fontSize: '0.85rem' }}>Loading…</div>
            ) : rows.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#3a3a56', fontSize: '0.85rem' }}>
                No prices entered yet. Use the flat-rate button above to get started.
              </div>
            ) : (
              <div className="scroll" style={{ overflowX: 'auto' }}>
                <table className="r-table">
                  <thead>
                    <tr>
                      <th style={{ paddingLeft: '1.25rem' }}>County</th>
                      <th>Business Type</th>
                      <th>Size</th>
                      <th>Validity</th>
                      <th>Processing</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ paddingLeft: '1.25rem', fontWeight: 600, color: '#f0f0f5' }}>{row.county.name}</td>
                        <td>
                          {row.businessCategory ? (
                            <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{row.businessCategory.name}</span>
                          ) : (
                            <span style={{ color: '#55556e', fontSize: '0.8rem' }}>Any</span>
                          )}
                        </td>
                        <td>
                          {row.sizeBand ? (
                            <span className="badge" style={{ background: 'rgba(148,148,176,0.1)', color: '#9494b0' }}>{row.sizeBand}</span>
                          ) : (
                            <span style={{ color: '#55556e', fontSize: '0.8rem' }}>Any</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{formatValidity(row)}</td>
                        <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{formatProcessing(row)}</td>
                        <td className="adm-mono" style={{ textAlign: 'right', fontWeight: 700, color: '#34d399' }}>
                          KSh {row.price.toLocaleString()}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <button className="btn btn-danger btn-icon" onClick={() => setDeleteRowId(row.id)}>
                            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteRowId !== null && (
        <div className="modal-overlay" onClick={() => setDeleteRowId(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.4rem' }}>Delete this pricing row?</h3>
              <p style={{ fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.5 }}>This can't be undone.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleteRowId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteRow}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}