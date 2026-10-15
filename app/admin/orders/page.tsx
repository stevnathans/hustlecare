/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/admin/orders/page.tsx
//
// Service orders (business plans, websites, ...). Orders sit in queues by
// what needs doing; opening one shows the next step, the customer, money,
// files (theirs and ours), their answers, and the full timeline.
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormattedSection } from '@/lib/orders/format-answers';

type Stage = 'DRAFT' | 'AWAITING_DEPOSIT' | 'IN_PROGRESS' | 'IN_REVIEW' | 'AWAITING_BALANCE' | 'COMPLETED' | 'CANCELLED';

interface Row {
  id: string;
  orderNumber: string | null;
  serviceSlug: string;
  packageName: string | null;
  packageTier: string | null;
  stage: Stage;
  archived: boolean;
  contactName: string | null;
  businessName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  totalAmount: number | null;
  balanceAmount: number | null;
  dueDate: string | null;
  revisionsUsed: number;
  revisionsAllowed: number | null;
  contactConsentAt: string | null;
  optedOutAt: string | null;
  reminderCount: number;
  fileCount: number;
  createdAt: string;
}

interface FileRow { id: string; kind: 'CUSTOMER_FILE' | 'PREVIEW' | 'FINAL'; specId: number | null; label: string; fileName: string; uploadedBy: string }
interface EventRow { id: string; kind: string; actor: string; channel: string | null; summary: string; createdAt: string }
interface Detail {
  order: Row & {
    serviceName: string; packageTierLabel: string | null; adminNotes: string | null; depositPercent: number | null; depositAmount: number | null;
    currency: string; completedAt: string | null; cancelReason: string | null; submittedAt: string | null;
  };
  sections: FormattedSection[];
  payments: { id: string; kind: string; amount: number; provider: string; status: string; receiptNumber: string | null; failureReason: string | null; createdAt: string }[];
  files: FileRow[];
  events: EventRow[];
  checklist: { id: number; label: string; isRequired: boolean; satisfied: boolean }[];
  trackUrl: string | null;
}

const PAGE_SIZE = 12;

const STAGES: Record<Stage, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'Unfinished', bg: 'rgba(148,148,176,0.12)', color: '#9494b0' },
  AWAITING_DEPOSIT: { label: 'Awaiting deposit', bg: 'rgba(148,148,176,0.14)', color: '#b4b4cc' },
  IN_PROGRESS: { label: 'In progress', bg: 'rgba(99,102,241,0.16)', color: '#a5b4fc' },
  IN_REVIEW: { label: 'In review', bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  AWAITING_BALANCE: { label: 'Awaiting balance', bg: 'rgba(56,189,248,0.12)', color: '#7dd3fc' },
  COMPLETED: { label: 'Completed', bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
};

const QUEUES: { key: string; label: string; match: (r: Row) => boolean }[] = [
  { key: 'work', label: 'To work on', match: (r) => r.stage === 'IN_PROGRESS' },
  { key: 'review', label: 'With customer', match: (r) => r.stage === 'IN_REVIEW' },
  { key: 'balance', label: 'Awaiting balance', match: (r) => r.stage === 'AWAITING_BALANCE' },
  { key: 'deposit', label: 'Awaiting deposit', match: (r) => r.stage === 'AWAITING_DEPOSIT' },
  { key: 'done', label: 'Completed', match: (r) => r.stage === 'COMPLETED' },
  { key: 'drafts', label: 'Unfinished', match: (r) => r.stage === 'DRAFT' },
  { key: 'all', label: 'All', match: (r) => r.stage !== 'DRAFT' },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { transition:background 0.15s; cursor:pointer; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.03); }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-plain { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.5rem 0.75rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; width:100%; box-sizing:border-box; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; white-space:nowrap; text-decoration:none; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; }
  .btn-primary:disabled, .btn-danger:disabled, .btn-ghost:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-sm { padding:0.32rem 0.7rem; font-size:0.76rem; }
  .tab { padding:0.5rem 0.95rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.8rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#9494b0; white-space:nowrap; display:inline-flex; align-items:center; gap:0.45rem; }
  .tab.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.35); }
  .tab .n { font-family:'DM Mono',monospace; font-size:0.72rem; padding:0.05rem 0.4rem; border-radius:100px; background:rgba(255,255,255,0.08); }
  .tab .n.hot { background:#6366f1; color:#fff; }
  .stat-pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 1rem; border-radius:10px; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; width:100%; max-width:760px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .pg-btn { display:inline-flex; align-items:center; justify-content:center; min-width:32px; height:32px; padding:0 0.5rem; border-radius:7px; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); color:#9494b0; }
  .pg-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .section-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.75rem; }
  .next-card { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.75rem; }
  .f-label { display:block; font-size:0.72rem; font-weight:600; color:#7a7a96; margin-bottom:0.25rem; }
  .f-val { font-size:0.84rem; color:#e6e6f0; word-break:break-word; }
  .h3 { font-size:0.78rem; font-weight:700; color:#9494b0; margin:0 0 0.6rem; }
  .link { color:#a5b4fc; text-decoration:none; }
  .tl-row { display:flex; gap:0.65rem; padding:0.4rem 0; font-size:0.8rem; border-bottom:1px solid rgba(255,255,255,0.03); }
  .tl-row:last-child { border-bottom:none; }
  .tag { display:inline-flex; padding:0.1rem 0.45rem; border-radius:100px; font-size:0.66rem; font-weight:700; background:rgba(255,255,255,0.07); color:#9494b0; margin-left:6px; }
  .frow { display:flex; justify-content:space-between; gap:1rem; padding:0.3rem 0; font-size:0.8rem; border-bottom:1px solid rgba(255,255,255,0.03); }
`;

async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Something went wrong.');
  return data as T;
}
const post = (body: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const patch = (body: unknown): RequestInit => ({ method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

const ksh = (n: number | null | undefined) => (n == null ? '—' : `KSh ${Math.round(n).toLocaleString('en-US')}`);
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const fmtDT = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}
function waNumber(phone: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (/^0[17]\d{8}$/.test(d)) d = '254' + d.slice(1);
  return /^\d{9,15}$/.test(d) ? d : null;
}

function StageChip({ stage }: { stage: Stage }) {
  const s = STAGES[stage];
  return <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>;
}

// ── Detail ───────────────────────────────────────────────────────────────────
function DetailModal({ id, onClose, onChanged, notify }: { id: string; onClose: () => void; onChanged: () => void; notify: (m: string, t?: 'success' | 'error') => void }) {
  const [d, setD] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [receipt, setReceipt] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());

  const reload = useCallback(async () => {
    try {
      const data = await api<Detail>(`/api/admin/orders/${id}`);
      setD(data);
      setNotesLoaded((loaded) => { if (!loaded) setNotes(data.order.adminNotes ?? ''); return true; });
    } catch (e) { setLoadError(e instanceof Error ? e.message : 'Could not load this order.'); }
  }, [id]);
  useEffect(() => { reload(); }, [reload]);

  async function run(key: string, fn: () => Promise<unknown>, okMsg?: string) {
    setBusy(key);
    try { await fn(); if (okMsg) notify(okMsg); await reload(); onChanged(); }
    catch (e) { notify(e instanceof Error ? e.message : 'Something went wrong.', 'error'); }
    finally { setBusy(''); }
  }

  async function openFile(fileId: string) {
    const win = window.open('', '_blank');
    try {
      const { url } = await api<{ url: string }>(`/api/admin/orders/${id}/files/${fileId}`);
      if (win) win.location.href = url; else notify('Allow pop-ups and try again.', 'error');
    } catch (e) { win?.close(); notify(e instanceof Error ? e.message : 'Could not open that file.', 'error'); }
  }

  function uploadWork(kind: 'PREVIEW' | 'FINAL', file: File | undefined) {
    if (!file) return;
    run(`up-${kind}`, async () => {
      const body = new FormData();
      body.append('file', file);
      body.append('kind', kind);
      await api(`/api/admin/orders/${id}/files`, { method: 'POST', body });
    }, kind === 'PREVIEW' ? 'Preview uploaded' : 'Final file uploaded');
  }

  if (loadError) return <div className="modal-overlay" onClick={onClose}><div className="modal-box" style={{ padding: '1.5rem' }}><p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>{loadError}</p><button className="btn btn-ghost" onClick={onClose}>Close</button></div></div>;
  if (!d) return <div className="modal-overlay" onClick={onClose}><div className="modal-box" style={{ padding: '3rem', textAlign: 'center', color: '#55556e', fontSize: '0.85rem' }}>Loading…</div></div>;

  const o = d.order;
  const stage = o.stage;
  const customerFiles = d.files.filter((f) => f.kind === 'CUSTOMER_FILE');
  const previews = d.files.filter((f) => f.kind === 'PREVIEW');
  const finals = d.files.filter((f) => f.kind === 'FINAL');
  const wa = waNumber(o.contactPhone);
  const terminal = stage === 'COMPLETED' || stage === 'CANCELLED';
  const canRemind = stage === 'AWAITING_DEPOSIT' && !!o.contactConsentAt && !o.optedOutAt && !!o.totalAmount;
  const lastRevision = d.events.find((e) => e.kind === 'REVISION_REQUESTED');
  const overdue = o.dueDate && new Date(o.dueDate) < new Date() && (stage === 'IN_PROGRESS' || stage === 'IN_REVIEW');
  const requiredMissing = d.checklist.filter((c) => c.isRequired && !c.satisfied).length;
  const dueLabel = stage === 'AWAITING_DEPOSIT' ? (o.depositPercent && o.depositPercent < 100 ? 'deposit' : 'payment') : 'balance';

  const nextText = {
    DRAFT: 'The customer has not finished the questionnaire. If they left contact details you can follow up.',
    AWAITING_DEPOSIT: o.totalAmount ? `Waiting for the ${dueLabel} (${ksh(o.depositAmount)}). ${o.optedOutAt ? 'They opted out of reminders.' : `Reminders sent: ${o.reminderCount} of 3.`}` : 'No online price on this order. Agree the price with the customer yourself.',
    IN_PROGRESS: lastRevision ? 'The customer asked for changes. Make them, then send the preview again.' : 'Deposit paid. Do the work, upload a preview or the final files, then move it forward.',
    IN_REVIEW: 'The preview is with the customer. They can approve it or ask for changes.',
    AWAITING_BALANCE: `Work is complete. Waiting for the balance (${ksh(o.balanceAmount)}); the final files unlock when it is paid.`,
    COMPLETED: 'Done. The customer can download the final files.',
    CANCELLED: o.cancelReason ? `Cancelled: ${o.cancelReason}` : 'Cancelled.',
  }[stage];

  const stageBtn = (key: string, to: string, label: string, okMsg: string, primary = true) => (
    <button className={`btn ${primary ? 'btn-primary' : 'btn-ghost'} btn-sm`} disabled={!!busy} onClick={() => run(key, () => api(`/api/admin/orders/${id}/stage`, post({ stage: to })), okMsg)}>
      {busy === key ? 'Saving…' : label}
    </button>
  );

  const fileUpload = (kind: 'PREVIEW' | 'FINAL', label: string) => (
    <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
      {busy === `up-${kind}` ? 'Uploading…' : label}
      <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={(e) => { uploadWork(kind, e.target.files?.[0]); e.target.value = ''; }} />
    </label>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>
        <div style={{ padding: '1.2rem 1.5rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            <h2 className="adm-mono" style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.2rem' }}>{o.orderNumber ?? 'Unfinished order'}</h2>
            <p style={{ fontSize: '0.8rem', color: '#7a7a96', margin: 0 }}><span style={{ color: '#a5b4fc', fontWeight: 600 }}>{o.serviceName}</span>{o.packageTierLabel ? ` · ${o.packageTierLabel}` : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}><StageChip stage={stage} /><button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">×</button></div>
        </div>

        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.1rem 1.5rem' }}>
          <div className="next-card">
            <h3 className="h3" style={{ color: '#a5b4fc' }}>Next step</h3>
            <p style={{ fontSize: '0.86rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{nextText}</p>
            {overdue && <p style={{ fontSize: '0.78rem', color: '#f87171', margin: '0 0 0.6rem' }}>Past the expected delivery date ({fmtDate(o.dueDate)}).</p>}
            {lastRevision && stage === 'IN_PROGRESS' && <p style={{ fontSize: '0.8rem', color: '#fbbf24', margin: '0 0 0.7rem', lineHeight: 1.5 }}>{lastRevision.summary}</p>}

            {(stage === 'AWAITING_DEPOSIT' || stage === 'AWAITING_BALANCE') && o.totalAmount && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {canRemind && <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => run('remind', () => api(`/api/admin/orders/${id}/remind`, { method: 'POST' }), 'Reminder sent')}>{busy === 'remind' ? 'Sending…' : 'Send reminder now'}</button>}
                <input className="u-plain" style={{ width: 170 }} placeholder="M-Pesa receipt code" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
                <button className="btn btn-ghost btn-sm" disabled={!!busy || !receipt.trim()} onClick={() => run('paid', () => api(`/api/admin/orders/${id}/mark-paid`, post({ receiptNumber: receipt })), 'Marked as paid').then(() => setReceipt(''))}>{busy === 'paid' ? 'Saving…' : 'Mark as paid'}</button>
              </div>
            )}

            {(stage === 'IN_PROGRESS' || stage === 'IN_REVIEW') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {fileUpload('PREVIEW', 'Upload preview')}
                {fileUpload('FINAL', 'Upload final file')}
                {stage === 'IN_PROGRESS' && stageBtn('review', 'IN_REVIEW', 'Send preview to customer', 'Preview sent')}
                {stageBtn('complete', 'AWAITING_BALANCE', 'Work complete', 'Marked complete', stage === 'IN_REVIEW')}
                {stage === 'IN_REVIEW' && stageBtn('back', 'IN_PROGRESS', 'Take back into work', 'Back in progress', false)}
              </div>
            )}
          </div>

          <div className="section-card">
            <h3 className="h3">Customer</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><span className="f-label">Name</span><div className="f-val">{o.contactName ?? '—'}</div></div>
              <div><span className="f-label">Business</span><div className="f-val">{o.businessName ?? '—'}</div></div>
              <div><span className="f-label">Phone</span><div className="f-val adm-mono">{o.contactPhone ?? '—'}</div></div>
              <div><span className="f-label">Email</span><div className="f-val">{o.contactEmail ?? '—'}</div></div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
              {wa && <a className="btn btn-ghost btn-sm" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hi ${(o.contactName ?? '').split(' ')[0]}, this is Hustlecare about your ${o.serviceName} order ${o.orderNumber ?? ''}.`)}`} target="_blank" rel="noopener">WhatsApp</a>}
              {o.contactPhone && <a className="btn btn-ghost btn-sm" href={`tel:${o.contactPhone}`}>Call</a>}
              {o.contactEmail && <a className="btn btn-ghost btn-sm" href={`mailto:${o.contactEmail}`}>Email</a>}
              {d.trackUrl && <a className="btn btn-ghost btn-sm" href={d.trackUrl} target="_blank" rel="noopener">Their order page</a>}
            </div>
            {!o.contactConsentAt && stage !== 'DRAFT' && <p style={{ fontSize: '0.76rem', color: '#7a7a96', margin: '0.6rem 0 0' }}>Older order: no consent on record, so no automatic messages are sent.</p>}
          </div>

          <div className="section-card">
            <h3 className="h3">Money</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div><span className="f-label">Total</span><div className="f-val">{ksh(o.totalAmount)}</div></div>
              <div><span className="f-label">Deposit{o.depositPercent ? ` (${o.depositPercent}%)` : ''}</span><div className="f-val">{ksh(o.depositAmount)}</div></div>
              <div><span className="f-label">Balance</span><div className="f-val">{ksh(o.balanceAmount)}</div></div>
            </div>
            {d.payments.map((p) => (
              <div key={p.id} style={{ fontSize: '0.8rem', padding: '0.25rem 0', color: '#c4c4d8', marginTop: '0.4rem' }}>
                {p.kind.toLowerCase()} · {ksh(p.amount)} · {p.provider} · <strong style={{ color: p.status === 'SUCCESSFUL' ? '#34d399' : p.status === 'FAILED' ? '#f87171' : '#fbbf24' }}>{p.status.toLowerCase()}</strong>
                {p.receiptNumber && <span className="adm-mono"> · {p.receiptNumber}</span>}
                {p.failureReason && <span style={{ color: '#7a7a96' }}> · {p.failureReason}</span>}
                <span style={{ color: '#55556e' }}> · {fmtDT(p.createdAt)}</span>
              </div>
            ))}
            <p style={{ fontSize: '0.76rem', color: '#7a7a96', margin: '0.6rem 0 0' }}>Due {fmtDate(o.dueDate)} · revisions used {o.revisionsUsed} of {o.revisionsAllowed ?? 0}</p>
          </div>

          <div className="section-card">
            <h3 className="h3">Files{d.checklist.length ? ` — ${requiredMissing === 0 ? 'all required files received' : `${requiredMissing} required missing`}` : ''}</h3>
            {d.checklist.map((c) => <div key={c.id} style={{ fontSize: '0.8rem', padding: '0.12rem 0', color: c.satisfied ? '#34d399' : c.isRequired ? '#fbbf24' : '#7a7a96' }}>{c.satisfied ? '✓' : '○'} {c.label}{!c.isRequired && ' (optional)'}</div>)}
            {[{ title: 'From the customer', list: customerFiles, del: false }, { title: 'Previews we uploaded', list: previews, del: true }, { title: 'Final files (locked until paid)', list: finals, del: true }].map((g) => g.list.length > 0 && (
              <div key={g.title} style={{ marginTop: '0.8rem' }}>
                <span className="f-label">{g.title}</span>
                {g.list.map((f) => (
                  <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0', fontSize: '0.8rem' }}>
                    <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label} <span style={{ color: '#7a7a96' }}>· {f.fileName}</span></span>
                    <span style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openFile(f.id)}>View</button>
                      {g.del && !terminal && <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => run(`del-${f.id}`, () => api(`/api/admin/orders/${id}/files/${f.id}`, { method: 'DELETE' }), 'Removed')}>×</button>}
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {d.files.length === 0 && <p style={{ fontSize: '0.8rem', color: '#55556e', margin: '0.5rem 0 0' }}>No files yet.</p>}
          </div>

          {d.sections.length > 0 && (
            <div className="section-card">
              <h3 className="h3">Their answers</h3>
              {d.sections.map((s) => {
                const isOpen = open.has(s.id);
                return (
                  <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '0.3rem 0' }}>
                    <button onClick={() => setOpen((cur) => { const n = new Set(cur); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; })} style={{ background: 'none', border: 'none', color: '#e6e6f0', fontFamily: 'Sora,sans-serif', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', padding: '0.3rem 0', width: '100%', textAlign: 'left' }}>
                      {s.icon} {s.title} <span style={{ color: '#55556e', float: 'right' }}>{isOpen ? '▲' : '▼'}</span>
                    </button>
                    {isOpen && s.fields.map((f, i) => (
                      <div key={i}>
                        <div className="frow"><span style={{ color: '#55556e', flexShrink: 0 }}>{f.label}</span><span style={{ color: f.isEmpty ? '#3a3a56' : '#f0f0f5', textAlign: 'right', whiteSpace: 'pre-wrap' }}>{f.value}</span></div>
                        {Array.isArray(f.raw) && f.raw.length > 0 && f.itemFields && (f.raw as Record<string, any>[]).map((item, ix) => (
                          <div key={ix} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '0.45rem 0.65rem', margin: '0.3rem 0' }}>
                            {f.itemFields!.map((itf) => { const v = item[itf.name]; if (v === undefined || v === '' || (Array.isArray(v) && v.length === 0)) return null; return <div key={itf.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.78rem', padding: '0.1rem 0' }}><span style={{ color: '#55556e' }}>{itf.label}</span><span style={{ color: '#d0d0e0' }}>{itf.type === 'select' ? itf.options?.find((op: any) => op.value === v)?.label ?? String(v) : String(v)}</span></div>; })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <div className="section-card">
            <h3 className="h3">Your notes (private)</h3>
            <textarea className="u-plain" rows={3} style={{ resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div style={{ marginTop: '0.5rem' }}><button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => run('notes', () => api(`/api/admin/orders/${id}`, patch({ adminNotes: notes })), 'Notes saved')}>{busy === 'notes' ? 'Saving…' : 'Save notes'}</button></div>
          </div>

          <div className="section-card">
            <h3 className="h3">Timeline</h3>
            {d.events.length === 0 && <p style={{ fontSize: '0.8rem', color: '#55556e', margin: 0 }}>No activity recorded yet (older orders have none).</p>}
            {d.events.map((ev) => (
              <div key={ev.id} className="tl-row">
                <span className="adm-mono" style={{ color: '#55556e', flexShrink: 0, width: 96 }}>{fmtDT(ev.createdAt)}</span>
                <span style={{ flex: 1, color: ev.kind === 'MESSAGE_FAILED' || ev.kind === 'PAYMENT_FAILED' ? '#f87171' : '#d0d0e0' }}>{ev.summary}{ev.channel && <span className="tag">{ev.channel.toLowerCase()}</span>}<span className="tag">{ev.actor}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', gap: '0.65rem', flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => run('archive', () => api(`/api/admin/orders/${id}`, patch({ archived: !o.archived })), o.archived ? 'Restored' : 'Archived')}>{o.archived ? 'Restore' : 'Archive'}</button>
            {!terminal && stage !== 'DRAFT' && (showCancel ? (
              <span style={{ display: 'inline-flex', gap: '0.4rem' }}>
                <input className="u-plain" style={{ width: 200 }} placeholder="Reason (optional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => run('cancel', () => api(`/api/admin/orders/${id}/stage`, post({ stage: 'CANCELLED', reason: cancelReason })), 'Cancelled').then(() => setShowCancel(false))}>Confirm cancel</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowCancel(false)}>Back</button>
              </span>
            ) : <button className="btn btn-danger btn-sm" onClick={() => setShowCancel(true)}>Cancel order</button>)}
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState('work');
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [legacyCount, setLegacyCount] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await api<{ orders: Row[]; legacyCount?: number }>(`/api/admin/orders?includeDrafts=true${showArchived ? '&includeArchived=true' : ''}`);
      setRows(d.orders);
      setLegacyCount(d.legacyCount ?? 0);
    } catch { if (!silent) { setRows([]); notify('Could not load orders', 'error'); } }
    finally { if (!silent) setLoading(false); }
  }, [showArchived, notify]);

  useEffect(() => { load(); const t = setInterval(() => load(true), 60_000); return () => clearInterval(t); }, [load]);
  useEffect(() => setPage(1), [queue, search, showArchived]);

  const counts = useMemo(() => Object.fromEntries(QUEUES.map((q) => [q.key, rows.filter(q.match).length])) as Record<string, number>, [rows]);
  const toCollect = useMemo(() => rows.filter((r) => ['IN_PROGRESS', 'IN_REVIEW', 'AWAITING_BALANCE'].includes(r.stage)).reduce((s, r) => s + (r.balanceAmount ?? 0), 0), [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = QUEUES.find((x) => x.key === queue) ?? QUEUES[0];
    return rows.filter(active.match).filter((r) => !q || (r.orderNumber ?? '').toLowerCase().includes(q) || (r.contactName ?? '').toLowerCase().includes(q) || (r.businessName ?? '').toLowerCase().includes(q) || (r.contactEmail ?? '').toLowerCase().includes(q) || (r.contactPhone ?? '').toLowerCase().includes(q));
  }, [rows, queue, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{S}</style>
      {toast && <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>{toast.msg}</div>}

      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Service orders</h1>
          <p style={{ fontSize: '0.84rem', color: '#55556e' }}>Business plans, websites and the other services customers order from you.</p>
          <a className="btn btn-ghost btn-sm" href="/admin/services" style={{ marginTop: '0.75rem' }}>Prices and packages</a>
        </div>

        {legacyCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', padding: '0.8rem 1rem', marginBottom: '1.25rem', borderRadius: 11, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <span style={{ fontSize: '0.84rem', color: '#fbbf24', lineHeight: 1.5 }}>
              {legacyCount} older order{legacyCount === 1 ? '' : 's'} {legacyCount === 1 ? 'was' : 'were'} submitted before this update and show as "Unfinished".
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                try {
                  const r = await api<{ updated: number }>('/api/admin/orders/repair', { method: 'POST' });
                  notify(`Updated ${r.updated} order${r.updated === 1 ? '' : 's'}`);
                  load();
                } catch (e) {
                  notify(e instanceof Error ? e.message : 'The update failed.', 'error');
                }
              }}
            >
              Update them
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[{ label: 'To work on', val: counts.work, bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' }, { label: 'With customer', val: counts.review, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' }, { label: 'Awaiting deposit', val: counts.deposit, bg: 'rgba(148,148,176,0.1)', color: '#b4b4cc' }, { label: 'Still to collect', val: ksh(toCollect), bg: 'rgba(16,185,129,0.12)', color: '#34d399' }].map((s) => (
            <div key={s.label} className="stat-pill" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <span className="adm-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.8 }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="scroll" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {QUEUES.map((q) => <button key={q.key} className={`tab${queue === q.key ? ' active' : ''}`} onClick={() => setQueue(q.key)}>{q.label}<span className={`n${q.key === 'work' && counts[q.key] > 0 ? ' hot' : ''}`}>{counts[q.key]}</span></button>)}
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Search order #, name, business, email, phone…" value={search} onChange={(e) => setSearch(e.target.value)} className="u-input" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#9494b0', cursor: 'pointer' }}><input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} style={{ accentColor: '#6366f1' }} /> Show archived</label>
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#55556e', fontSize: '0.85rem' }}>Loading orders…</div> : (
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="scroll" style={{ overflowX: 'auto' }}>
              <table className="r-table">
                <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th>Amount</th><th>Started</th></tr></thead>
                <tbody>
                  {paginated.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#55556e', cursor: 'default' }}>Nothing here.</td></tr> : paginated.map((r) => {
                    const late = r.dueDate && new Date(r.dueDate) < new Date() && (r.stage === 'IN_PROGRESS' || r.stage === 'IN_REVIEW');
                    return (
                      <tr key={r.id} onClick={() => setOpenId(r.id)} style={{ opacity: r.archived ? 0.55 : 1 }}>
                        <td><div className="adm-mono" style={{ color: '#a5b4fc', fontWeight: 600, fontSize: '0.8rem' }}>{r.orderNumber ?? '—'}</div><div style={{ fontSize: '0.74rem', color: '#55556e', marginTop: 2 }}>{r.packageName ?? r.serviceSlug}</div></td>
                        <td><div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{r.contactName ?? '—'}</div><div style={{ fontSize: '0.74rem', color: '#55556e' }}>{r.businessName ?? r.contactEmail ?? ''}</div></td>
                        <td><StageChip stage={r.stage} />{late && <div style={{ fontSize: '0.72rem', color: '#f87171', marginTop: 4 }}>overdue</div>}{r.stage === 'AWAITING_DEPOSIT' && r.reminderCount > 0 && <div style={{ fontSize: '0.72rem', color: '#7a7a96', marginTop: 4 }}>{r.reminderCount} reminder{r.reminderCount === 1 ? '' : 's'} sent</div>}{r.stage === 'IN_PROGRESS' && r.revisionsUsed > 0 && <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: 4 }}>changes requested</div>}</td>
                        <td className="adm-mono" style={{ fontSize: '0.8rem', color: '#c4c4d8' }}>{ksh(r.totalAmount)}</td>
                        <td style={{ fontSize: '0.8rem', color: '#9494b0', whiteSpace: 'nowrap' }}>{timeAgo(r.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#55556e', margin: '0.75rem 0' }}><span>{filtered.length} order{filtered.length === 1 ? '' : 's'}</span>{totalPages > 1 && <span>Page {page} of {totalPages}</span>}</div>
        {totalPages > 1 && <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem' }}><button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button><span className="pg-btn" style={{ cursor: 'default', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>{page}</span><button className="pg-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button></div>}

        {openId && <DetailModal id={openId} onClose={() => setOpenId(null)} onChanged={() => load(true)} notify={notify} />}
      </div>
    </>
  );
}