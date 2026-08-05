/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/admin/legal-fee-schedules/page.tsx
'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';

type Template = { id: number; name: string; category: string; isCountyFeeSchedule: boolean };
type County = { id: number; name: string; slug: string };
type TradeClass = { id: number; name: string };
type SizeBand = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

type FeeRow = {
  id: number;
  countyId: number;
  county: { id: number; name: string };
  tradeClassId: number | null;
  tradeClass: { id: number; name: string } | null;
  sizeBand: SizeBand | null;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  validityValue: number | null;
  validityUnit: string | null;
  processingTimeMinDays: number | null;
  processingTimeMaxDays: number | null;
  applyUrl: string | null;
  notes: string | null;
};

type RowDraft = {
  countyId: string;
  tradeClassId: string;
  sizeBand: SizeBand | '';
  usePriceRange: boolean;
  price: string;
  priceMin: string;
  priceMax: string;
  validityValue: string;
  validityUnit: string;
  processingTimeMinDays: string;
  processingTimeMaxDays: string;
  applyUrl: string;
  notes: string;
};

const EMPTY_NEW_ROW: RowDraft = {
  countyId: '', tradeClassId: '', sizeBand: '',
  usePriceRange: false, price: '', priceMin: '', priceMax: '',
  validityValue: '', validityUnit: 'years',
  processingTimeMinDays: '', processingTimeMaxDays: '',
  applyUrl: '', notes: '',
};

function rowToDraft(row: FeeRow): RowDraft {
  return {
    countyId: String(row.countyId),
    tradeClassId: row.tradeClassId != null ? String(row.tradeClassId) : '',
    sizeBand: row.sizeBand ?? '',
    usePriceRange: row.price == null,
    price: row.price != null ? String(row.price) : '',
    priceMin: row.priceMin != null ? String(row.priceMin) : '',
    priceMax: row.priceMax != null ? String(row.priceMax) : '',
    validityValue: row.validityValue != null ? String(row.validityValue) : '',
    validityUnit: row.validityUnit ?? 'years',
    processingTimeMinDays: row.processingTimeMinDays != null ? String(row.processingTimeMinDays) : '',
    processingTimeMaxDays: row.processingTimeMaxDays != null ? String(row.processingTimeMaxDays) : '',
    applyUrl: row.applyUrl ?? '',
    notes: row.notes ?? '',
  };
}

function draftToPricingBody(d: RowDraft) {
  return d.usePriceRange
    ? { usePriceRange: true, priceMin: d.priceMin, priceMax: d.priceMax }
    : { usePriceRange: false, price: d.price };
}

function formatPrice(row: FeeRow): string {
  if (row.price != null) return `KSh ${row.price.toLocaleString()}`;
  if (row.priceMin != null && row.priceMax != null) {
    return `KSh ${row.priceMin.toLocaleString()} – ${row.priceMax.toLocaleString()}`;
  }
  return '—';
}

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

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .r-table tbody tr.editing { background:rgba(99,102,241,0.06); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-input-sm { padding:0.4rem 0.6rem; font-size:0.78rem; }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; cursor:pointer; appearance:none; width:100%; box-sizing:border-box; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }
  .u-select-sm { padding:0.4rem 1.6rem 0.4rem 0.6rem; font-size:0.78rem; background-position:right 0.5rem center; }
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
  .btn-accent { background:rgba(139,92,246,0.12); color:#a78bfa; border:1px solid rgba(139,92,246,0.22); }
  .btn-accent:hover { background:rgba(139,92,246,0.22); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-icon { padding:0.4rem; border-radius:8px; }
  .btn-sm { padding:0.4rem 0.75rem; font-size:0.76rem; }
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
  .edit-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:0.5rem; }
  .edit-row-actions { display:flex; gap:0.35rem; justify-content:flex-end; margin-top:0.6rem; }
  .price-toggle { display:flex; align-items:center; gap:0.4rem; font-size:0.76rem; color:#9494b0; cursor:pointer; user-select:none; margin-bottom:0.5rem; }
`;

function PriceFields({
  usePriceRange, price, priceMin, priceMax, small = false,
  onToggleRange, onPrice, onPriceMin, onPriceMax,
}: {
  usePriceRange: boolean; price: string; priceMin: string; priceMax: string; small?: boolean;
  onToggleRange: (v: boolean) => void; onPrice: (v: string) => void; onPriceMin: (v: string) => void; onPriceMax: (v: string) => void;
}) {
  const inputCls = small ? 'u-input u-input-sm' : 'u-input';
  return (
    <div>
      <label className="price-toggle">
        <input type="checkbox" checked={usePriceRange} onChange={(e) => onToggleRange(e.target.checked)} style={{ accentColor: '#6366f1' }} />
        Price varies (use a range instead of a fixed amount)
      </label>
      {usePriceRange ? (
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <input type="number" placeholder="Min" className={inputCls} value={priceMin} onChange={(e) => onPriceMin(e.target.value)} />
          <input type="number" placeholder="Max" className={inputCls} value={priceMax} onChange={(e) => onPriceMax(e.target.value)} />
        </div>
      ) : (
        <input type="number" placeholder="e.g. 8000" className={inputCls} value={price} onChange={(e) => onPrice(e.target.value)} />
      )}
    </div>
  );
}

export default function LegalFeeSchedulesAdminPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [counties, setCounties] = useState<County[]>([]);
  const [tradeClasses, setTradeClasses] = useState<TradeClass[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [rows, setRows] = useState<FeeRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteRowId, setDeleteRowId] = useState<number | null>(null);

  // Bulk default form
  const [bulkUsePriceRange, setBulkUsePriceRange] = useState(false);
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkPriceMin, setBulkPriceMin] = useState('');
  const [bulkPriceMax, setBulkPriceMax] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);

  // New-row form
  const [newRow, setNewRow] = useState<RowDraft>(EMPTY_NEW_ROW);
  const [rowSaving, setRowSaving] = useState(false);

  // Inline edit state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<RowDraft | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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
    fetch('/api/admin/trade-classes')
      .then((r) => r.json())
      .then((d) => setTradeClasses(Array.isArray(d) ? d : []))
      .catch(() => setTradeClasses([]));
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
    setEditingRowId(null);
    setEditDraft(null);
  }, [selectedTemplateId, fetchRows]);

  async function handleBulkSet() {
    if (!selectedTemplateId) return;
    if (bulkUsePriceRange ? (!bulkPriceMin || !bulkPriceMax) : !bulkPrice) return;
    setBulkSaving(true);
    try {
      const r = await fetch('/api/admin/legal-fee-schedules/bulk-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          usePriceRange: bulkUsePriceRange,
          price: bulkPrice,
          priceMin: bulkPriceMin,
          priceMax: bulkPriceMax,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      showToast(d.message || 'Rate applied to all counties.');
      setBulkPrice(''); setBulkPriceMin(''); setBulkPriceMax('');
      fetchRows(selectedTemplateId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to set bulk rate', 'error');
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleAddOverride() {
    if (!selectedTemplateId || !newRow.countyId) {
      showToast('County is required.', 'error');
      return;
    }
    if (newRow.usePriceRange ? (!newRow.priceMin || !newRow.priceMax) : !newRow.price) {
      showToast('Price is required.', 'error');
      return;
    }
    setRowSaving(true);
    try {
      const r = await fetch('/api/admin/legal-fee-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          countyId: Number(newRow.countyId),
          tradeClassId: newRow.tradeClassId ? Number(newRow.tradeClassId) : null,
          sizeBand: newRow.sizeBand || null,
          ...draftToPricingBody(newRow),
          validityValue: newRow.validityValue ? Number(newRow.validityValue) : null,
          validityUnit: newRow.validityValue ? newRow.validityUnit : null,
          processingTimeMinDays: newRow.processingTimeMinDays ? Number(newRow.processingTimeMinDays) : null,
          processingTimeMaxDays: newRow.processingTimeMaxDays ? Number(newRow.processingTimeMaxDays) : null,
          applyUrl: newRow.applyUrl.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      showToast('Saved.');
      setNewRow(EMPTY_NEW_ROW);
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

  function startEditing(row: FeeRow) {
    setEditingRowId(row.id);
    setEditDraft(rowToDraft(row));
  }

  function cancelEditing() {
    setEditingRowId(null);
    setEditDraft(null);
  }

  function updateDraft(patch: Partial<RowDraft>) {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  async function handleSaveEdit() {
    if (editingRowId === null || !editDraft) return;

    if (!editDraft.countyId) {
      showToast('County is required.', 'error');
      return;
    }
    if (editDraft.usePriceRange ? (!editDraft.priceMin || !editDraft.priceMax) : !editDraft.price) {
      showToast('Price is required.', 'error');
      return;
    }

    setEditSaving(true);
    try {
      const r = await fetch(`/api/admin/legal-fee-schedules/${editingRowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          countyId: Number(editDraft.countyId),
          tradeClassId: editDraft.tradeClassId ? Number(editDraft.tradeClassId) : null,
          sizeBand: editDraft.sizeBand || null,
          ...draftToPricingBody(editDraft),
          validityValue: editDraft.validityValue ? Number(editDraft.validityValue) : null,
          validityUnit: editDraft.validityValue ? editDraft.validityUnit : null,
          processingTimeMinDays: editDraft.processingTimeMinDays ? Number(editDraft.processingTimeMinDays) : null,
          processingTimeMaxDays: editDraft.processingTimeMaxDays ? Number(editDraft.processingTimeMaxDays) : null,
          applyUrl: editDraft.applyUrl.trim() || null,
          notes: editDraft.notes.trim() || null,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to save');
      showToast('Row updated.');
      cancelEditing();
      if (selectedTemplateId) fetchRows(selectedTemplateId);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update row', 'error');
    } finally {
      setEditSaving(false);
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const stats = useMemo(() => {
    const countiesCovered = new Set(rows.map((r) => r.countyId)).size;
    const withOverrides = rows.filter((r) => r.tradeClassId !== null || r.sizeBand !== null).length;
    const fixedRows = rows.filter((r) => r.price != null);
    const avgPrice = fixedRows.length ? Math.round(fixedRows.reduce((a, b) => a + (b.price ?? 0), 0) / fixedRows.length) : 0;
    return { countiesCovered, withOverrides, avgPrice, total: rows.length, fixedCount: fixedRows.length };
  }, [rows]);

  return (
    <div className="adm" style={{ minHeight: '100vh' }}>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>County Fee Schedule</h1>
          <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 640, lineHeight: 1.5 }}>
            Enter prices for county-issued requirements (Business Permit, Health Certificate, etc.). If a
            requirement doesn't show up below, first flag it "County fee schedule" in the Requirement Library.
            Many county fees aren't fixed — use the range option when the exact amount depends on business
            size, activity, or other factors.
          </p>
        </div>
        <Link href="/admin/trade-classes" className="btn btn-accent">
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M17 3v8M7 13v8" /></svg>
          Manage Trade Classes
        </Link>
      </div>

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
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Priced Rows', val: stats.total, bg: 'rgba(99,102,241,0.12)', color: '#818cf8' },
              { label: 'Counties Covered', val: `${stats.countiesCovered}/47`, bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
              { label: 'With Overrides', val: stats.withOverrides, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
              { label: 'Avg Fixed Price', val: stats.fixedCount ? `KSh ${stats.avgPrice.toLocaleString()}` : '—', bg: 'rgba(148,148,176,0.1)', color: '#9494b0' },
            ].map((s) => (
              <div key={s.label} className="stat-pill" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
                <span className="adm-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.val}</span>
                <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.75 }}>{s.label}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-title">Set one price for all 47 counties</div>
            <div className="panel-sub">
              Fastest way to get started — this sets the same price (or range) everywhere. You can override
              specific counties below afterward.
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <PriceFields
                  usePriceRange={bulkUsePriceRange}
                  price={bulkPrice} priceMin={bulkPriceMin} priceMax={bulkPriceMax}
                  onToggleRange={setBulkUsePriceRange}
                  onPrice={setBulkPrice} onPriceMin={setBulkPriceMin} onPriceMax={setBulkPriceMax}
                />
              </div>
              <button onClick={handleBulkSet} disabled={bulkSaving} className="btn btn-secondary">
                {bulkSaving ? 'Applying…' : 'Apply to all counties'}
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">Add a new county's price</div>
            <div className="panel-sub">
              Use this when one county's real fee differs from the flat rate above — or to add pricing that
              varies by trade class or size. Trade classes are how counties actually classify businesses for
              fees (e.g. "Hyper Supermarket") — not the site's browsing categories. Manage them via{' '}
              <Link href="/admin/trade-classes" style={{ color: '#a78bfa' }}>Trade Classes</Link>.
              Already have a row for this combination? Edit it directly in the table below instead.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
              <div>
                <div className="f-label">County *</div>
                <select className="u-select" value={newRow.countyId} onChange={(e) => setNewRow((f) => ({ ...f, countyId: e.target.value }))}>
                  <option value="">Select…</option>
                  {counties.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="f-label">Trade Class</div>
                <select className="u-select" value={newRow.tradeClassId} onChange={(e) => setNewRow((f) => ({ ...f, tradeClassId: e.target.value }))}>
                  <option value="">Any trade class</option>
                  {tradeClasses.map((tc) => (
                    <option key={tc.id} value={tc.id}>{tc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="f-label">Size</div>
                <select className="u-select" value={newRow.sizeBand} onChange={(e) => setNewRow((f) => ({ ...f, sizeBand: e.target.value as SizeBand | '' }))}>
                  <option value="">Any size</option>
                  <option value="MICRO">Micro</option>
                  <option value="SMALL">Small</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LARGE">Large</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div className="f-label">Price *</div>
                <PriceFields
                  usePriceRange={newRow.usePriceRange}
                  price={newRow.price} priceMin={newRow.priceMin} priceMax={newRow.priceMax}
                  onToggleRange={(v) => setNewRow((f) => ({ ...f, usePriceRange: v }))}
                  onPrice={(v) => setNewRow((f) => ({ ...f, price: v }))}
                  onPriceMin={(v) => setNewRow((f) => ({ ...f, priceMin: v }))}
                  onPriceMax={(v) => setNewRow((f) => ({ ...f, priceMax: v }))}
                />
              </div>
              <div>
                <div className="f-label">Validity</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input type="number" placeholder="1" className="u-input" style={{ width: 64, flexShrink: 0 }} value={newRow.validityValue} onChange={(e) => setNewRow((f) => ({ ...f, validityValue: e.target.value }))} />
                  <select className="u-select" value={newRow.validityUnit} onChange={(e) => setNewRow((f) => ({ ...f, validityUnit: e.target.value }))}>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </div>
              </div>
              <div>
                <div className="f-label">Processing (days)</div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input type="number" placeholder="Min" className="u-input" value={newRow.processingTimeMinDays} onChange={(e) => setNewRow((f) => ({ ...f, processingTimeMinDays: e.target.value }))} />
                  <input type="number" placeholder="Max" className="u-input" value={newRow.processingTimeMaxDays} onChange={(e) => setNewRow((f) => ({ ...f, processingTimeMaxDays: e.target.value }))} />
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div className="f-label">Apply URL (this county's official application link)</div>
                <input type="text" placeholder="https://…" className="u-input" value={newRow.applyUrl} onChange={(e) => setNewRow((f) => ({ ...f, applyUrl: e.target.value }))} />
              </div>
            </div>
            <button onClick={handleAddOverride} disabled={rowSaving} className="btn btn-primary">
              {rowSaving ? 'Saving…' : 'Save this price'}
            </button>
          </div>

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
                      <th>Trade Class</th>
                      <th>Size</th>
                      <th>Validity</th>
                      <th>Processing</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right', paddingRight: '1.25rem' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) =>
                      editingRowId === row.id && editDraft ? (
                        <tr key={row.id} className="editing">
                          <td colSpan={7} style={{ padding: '1rem 1.25rem' }}>
                            <div className="edit-grid" style={{ marginBottom: '0.65rem' }}>
                              <div>
                                <div className="f-label">County *</div>
                                <select className="u-select u-select-sm" value={editDraft.countyId} onChange={(e) => updateDraft({ countyId: e.target.value })}>
                                  {counties.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <div className="f-label">Trade Class</div>
                                <select className="u-select u-select-sm" value={editDraft.tradeClassId} onChange={(e) => updateDraft({ tradeClassId: e.target.value })}>
                                  <option value="">Any trade class</option>
                                  {tradeClasses.map((tc) => (
                                    <option key={tc.id} value={tc.id}>{tc.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <div className="f-label">Size</div>
                                <select className="u-select u-select-sm" value={editDraft.sizeBand} onChange={(e) => updateDraft({ sizeBand: e.target.value as SizeBand | '' })}>
                                  <option value="">Any size</option>
                                  <option value="MICRO">Micro</option>
                                  <option value="SMALL">Small</option>
                                  <option value="MEDIUM">Medium</option>
                                  <option value="LARGE">Large</option>
                                </select>
                              </div>
                              <div>
                                <div className="f-label">Validity</div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <input type="number" className="u-input u-input-sm" style={{ width: 56, flexShrink: 0 }} value={editDraft.validityValue} onChange={(e) => updateDraft({ validityValue: e.target.value })} />
                                  <select className="u-select u-select-sm" value={editDraft.validityUnit} onChange={(e) => updateDraft({ validityUnit: e.target.value })}>
                                    <option value="days">Days</option>
                                    <option value="months">Months</option>
                                    <option value="years">Years</option>
                                  </select>
                                </div>
                              </div>
                              <div>
                                <div className="f-label">Processing (days)</div>
                                <div style={{ display: 'flex', gap: '0.35rem' }}>
                                  <input type="number" placeholder="Min" className="u-input u-input-sm" value={editDraft.processingTimeMinDays} onChange={(e) => updateDraft({ processingTimeMinDays: e.target.value })} />
                                  <input type="number" placeholder="Max" className="u-input u-input-sm" value={editDraft.processingTimeMaxDays} onChange={(e) => updateDraft({ processingTimeMaxDays: e.target.value })} />
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '0.65rem', maxWidth: 320 }}>
                              <div className="f-label">Price *</div>
                              <PriceFields
                                usePriceRange={editDraft.usePriceRange}
                                price={editDraft.price} priceMin={editDraft.priceMin} priceMax={editDraft.priceMax}
                                small
                                onToggleRange={(v) => updateDraft({ usePriceRange: v })}
                                onPrice={(v) => updateDraft({ price: v })}
                                onPriceMin={(v) => updateDraft({ priceMin: v })}
                                onPriceMax={(v) => updateDraft({ priceMax: v })}
                              />
                            </div>
                            <div style={{ marginBottom: '0.65rem' }}>
                              <div className="f-label">Apply URL</div>
                              <input type="text" placeholder="https://…" className="u-input u-input-sm" value={editDraft.applyUrl} onChange={(e) => updateDraft({ applyUrl: e.target.value })} />
                            </div>
                            <div>
                              <div className="f-label">Notes</div>
                              <input type="text" placeholder="Optional internal note" className="u-input u-input-sm" value={editDraft.notes} onChange={(e) => updateDraft({ notes: e.target.value })} />
                            </div>
                            <div className="edit-row-actions">
                              <button className="btn btn-ghost btn-sm" onClick={cancelEditing} disabled={editSaving}>Cancel</button>
                              <button className="btn btn-primary btn-sm" onClick={handleSaveEdit} disabled={editSaving}>
                                {editSaving ? 'Saving…' : 'Save Changes'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr key={row.id}>
                          <td style={{ paddingLeft: '1.25rem', fontWeight: 600, color: '#f0f0f5' }}>{row.county.name}</td>
                          <td>
                            {row.tradeClass ? (
                              <span className="badge" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{row.tradeClass.name}</span>
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
                            {formatPrice(row)}
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                              <button className="btn btn-ghost btn-icon" onClick={() => startEditing(row)} title="Edit">
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                              </button>
                              <button className="btn btn-danger btn-icon" onClick={() => setDeleteRowId(row.id)} title="Delete">
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 001 1h12a1 1 0 001-1V8M10 12h4" /></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

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