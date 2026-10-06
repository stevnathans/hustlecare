/* eslint-disable react/no-unescaped-entities */
// app/admin/apply-services/page.tsx
//
// Prices and documents for "Apply For Me": for each requirement, set the
// service fee, how long it usually takes, what's included, and the list of
// documents the customer must upload. A requirement only offers "pay and
// apply" once it is set up here and switched on.
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DocItem {
  id?: number;
  label: string;
  description: string;
  isRequired: boolean;
}

interface Offering {
  serviceFee: number;
  typicalDaysMin: number | null;
  typicalDaysMax: number | null;
  whatsIncluded: string[];
  isActive: boolean;
  documents: { id: number; label: string; description: string | null; isRequired: boolean }[];
}

interface Template {
  id: number;
  name: string;
  category: string;
  isCountyFeeSchedule: boolean;
  offering: Offering | null;
}

// One-click additions for the documents most applications need.
const COMMON_DOCS = [
  'National ID (front and back)',
  'KRA PIN certificate',
  'Passport-size photo',
  'Business registration certificate',
  'Lease agreement or proof of premises',
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .r-table td { padding:0.8rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { cursor:pointer; transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.03); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-plain { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.5rem 0.75rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; width:100%; box-sizing:border-box; }
  .u-plain:focus { border-color:rgba(99,102,241,0.5); }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; white-space:nowrap; text-decoration:none; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; }
  .btn-primary:disabled, .btn-ghost:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-sm { padding:0.3rem 0.65rem; font-size:0.76rem; }
  .tab { padding:0.5rem 0.95rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.8rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#9494b0; white-space:nowrap; }
  .tab.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.35); }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; width:100%; max-width:680px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .section-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.75rem; }
  .f-label { display:block; font-size:0.74rem; font-weight:600; color:#8a8aa6; margin-bottom:0.3rem; }
  .hint { font-size:0.74rem; color:#6a6a86; margin:0.3rem 0 0; line-height:1.45; }
  .chip { display:inline-flex; padding:0.2rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:700; white-space:nowrap; }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Something went wrong.');
  return data as T;
}

const money = (n: number) => `KES ${Math.round(n).toLocaleString('en-KE')}`;

function StatusChip({ offering }: { offering: Offering | null }) {
  if (!offering) return <span className="chip" style={{ background: 'rgba(148,148,176,0.12)', color: '#9494b0' }}>Not offered</span>;
  return offering.isActive ? (
    <span className="chip" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>Live</span>
  ) : (
    <span className="chip" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>Paused</span>
  );
}

function EditModal({
  template,
  onClose,
  onSaved,
  notify,
}: {
  template: Template;
  onClose: () => void;
  onSaved: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}) {
  const o = template.offering;
  const [fee, setFee] = useState(o ? String(o.serviceFee) : '');
  const [daysMin, setDaysMin] = useState(o?.typicalDaysMin ? String(o.typicalDaysMin) : '');
  const [daysMax, setDaysMax] = useState(o?.typicalDaysMax ? String(o.typicalDaysMax) : '');
  const [included, setIncluded] = useState((o?.whatsIncluded ?? []).join('\n'));
  const [isActive, setIsActive] = useState(o ? o.isActive : true);
  const [docs, setDocs] = useState<DocItem[]>(
    (o?.documents ?? []).map((d) => ({ id: d.id, label: d.label, description: d.description ?? '', isRequired: d.isRequired })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const updateDoc = (i: number, patch: Partial<DocItem>) =>
    setDocs((list) => list.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const moveDoc = (i: number, dir: -1 | 1) =>
    setDocs((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const copy = [...list];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  async function save() {
    setError('');
    setSaving(true);
    try {
      await api(`/api/admin/apply-offerings/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceFee: Number(fee),
          typicalDaysMin: daysMin === '' ? null : Number(daysMin),
          typicalDaysMax: daysMax === '' ? null : Number(daysMax),
          whatsIncluded: included.split('\n'),
          isActive,
          documents: docs.map((d) => ({ id: d.id, label: d.label, description: d.description, isRequired: d.isRequired })),
        }),
      });
      notify('Saved');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.2rem' }}>{template.name}</h2>
          <p style={{ fontSize: '0.8rem', color: '#7a7a96', margin: 0 }}>
            {template.category}
            {template.isCountyFeeSchedule && ' · government fee comes from the county fee schedule'}
          </p>
        </div>

        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.1rem 1.5rem' }}>
          {error && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '0.75rem' }} role="alert">
              {error}
            </div>
          )}

          <div className="section-card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="f-label" htmlFor="fee">Your service fee (KES)</label>
                <input id="fee" className="u-plain adm-mono" inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ''))} placeholder="e.g. 3500" />
              </div>
              <div>
                <label className="f-label" htmlFor="dmin">Usually takes (days)</label>
                <input id="dmin" className="u-plain adm-mono" inputMode="numeric" value={daysMin} onChange={(e) => setDaysMin(e.target.value.replace(/\D/g, ''))} placeholder="from" />
              </div>
              <div>
                <label className="f-label" htmlFor="dmax">&nbsp;</label>
                <input id="dmax" className="u-plain adm-mono" inputMode="numeric" value={daysMax} onChange={(e) => setDaysMax(e.target.value.replace(/\D/g, ''))} placeholder="to" />
              </div>
            </div>
            <p className="hint">Only your fee goes here. The government fee is shown to customers separately, as an estimate from the county fee schedule. Leave the days empty to hide the timeframe.</p>
          </div>

          <div className="section-card">
            <label className="f-label" htmlFor="incl">What's included (one point per line, shown to the customer)</label>
            <textarea id="incl" className="u-plain" rows={3} style={{ resize: 'vertical' }} value={included} onChange={(e) => setIncluded(e.target.value)} placeholder={'We prepare and file your application\nStatus updates until it is approved'} />
          </div>

          <div className="section-card">
            <label className="f-label">Documents the customer must upload</label>
            {docs.length === 0 && <p className="hint" style={{ marginBottom: '0.6rem' }}>No documents yet. Without any, paid requests go straight to "Ready to apply".</p>}

            {docs.map((d, i) => (
              <div key={d.id ?? `new-${i}`} style={{ padding: '0.6rem 0.7rem', background: 'rgba(255,255,255,0.03)', borderRadius: 9, marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <input className="u-plain" value={d.label} onChange={(e) => updateDoc(i, { label: e.target.value })} placeholder="Document name" aria-label="Document name" />
                  <button className="btn btn-ghost btn-sm" onClick={() => moveDoc(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => moveDoc(i, 1)} disabled={i === docs.length - 1} aria-label="Move down">↓</button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDocs((l) => l.filter((_, idx) => idx !== i))} aria-label="Remove">×</button>
                </div>
                <input className="u-plain" style={{ marginTop: '0.4rem' }} value={d.description} onChange={(e) => updateDoc(i, { description: e.target.value })} placeholder="Help text for the customer (optional), e.g. A clear photo of both sides" aria-label="Help text" />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#9494b0', marginTop: '0.45rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={d.isRequired} onChange={(e) => updateDoc(i, { isRequired: e.target.checked })} style={{ accentColor: '#6366f1' }} />
                  Required before we can start
                </label>
              </div>
            ))}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDocs((l) => [...l, { label: '', description: '', isRequired: true }])}>+ Add a document</button>
              {COMMON_DOCS.filter((c) => !docs.some((d) => d.label === c)).map((c) => (
                <button key={c} className="btn btn-ghost btn-sm" onClick={() => setDocs((l) => [...l, { label: c, description: '', isRequired: true }])}>+ {c}</button>
              ))}
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.84rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: '#6366f1', marginTop: 3 }} />
            <span>
              Offer this to customers
              <span className="hint" style={{ display: 'block' }}>Turn off to pause it. People already in progress are not affected, and new price changes only apply to new requests.</span>
            </span>
          </label>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.9rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !fee}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

export default function ApplyServicesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'legal' | 'offered' | 'all'>('legal');
  const [editing, setEditing] = useState<Template | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await api<{ templates: Template[] }>('/api/admin/apply-offerings');
      setTemplates(d.templates);
    } catch {
      notify('Could not load requirements', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (view === 'legal' && t.category.toLowerCase() !== 'legal') return false;
      if (view === 'offered' && !t.offering) return false;
      return !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    });
  }, [templates, search, view]);

  const liveCount = templates.filter((t) => t.offering?.isActive).length;

  return (
    <>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Apply For Me: prices and documents</h1>
          <p style={{ fontSize: '0.84rem', color: '#55556e' }}>
            Choose what you charge and which documents customers must send, for each requirement. {liveCount} live now.
          </p>
          <a className="btn btn-ghost btn-sm" href="/admin/apply-requests" style={{ marginTop: '0.75rem' }}>← Back to requests</a>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
          <button className={`tab${view === 'legal' ? ' active' : ''}`} onClick={() => setView('legal')}>Legal requirements</button>
          <button className={`tab${view === 'offered' ? ' active' : ''}`} onClick={() => setView('offered')}>Set up already</button>
          <button className={`tab${view === 'all' ? ' active' : ''}`} onClick={() => setView('all')}>Everything</button>
        </div>

        <div style={{ position: 'relative', marginBottom: '0.9rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
          <input type="text" placeholder="Search requirements…" value={search} onChange={(e) => setSearch(e.target.value)} className="u-input" />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#55556e', fontSize: '0.85rem' }}>Loading…</div>
        ) : (
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="scroll" style={{ overflowX: 'auto' }}>
              <table className="r-table">
                <thead>
                  <tr><th>Requirement</th><th>Status</th><th>Your fee</th><th>Documents</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#55556e', cursor: 'default' }}>Nothing matches.</td></tr>
                  ) : (
                    rows.map((t) => (
                      <tr key={t.id} onClick={() => setEditing(t)}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{t.name}</div>
                          <div style={{ fontSize: '0.74rem', color: '#55556e', marginTop: 2 }}>{t.category}</div>
                        </td>
                        <td><StatusChip offering={t.offering} /></td>
                        <td className="adm-mono" style={{ fontSize: '0.82rem' }}>{t.offering ? money(t.offering.serviceFee) : '—'}</td>
                        <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{t.offering ? `${t.offering.documents.length} item${t.offering.documents.length === 1 ? '' : 's'}` : '—'}</td>
                        <td style={{ textAlign: 'right' }}><span className="btn btn-ghost btn-sm">{t.offering ? 'Edit' : 'Set up'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editing && <EditModal template={editing} onClose={() => setEditing(null)} onSaved={load} notify={notify} />}
      </div>
    </>
  );
}