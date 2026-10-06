/* eslint-disable react/no-unescaped-entities */
// app/admin/apply-requests/page.tsx
//
// Apply For Me — admin. Requests are grouped into queues by what needs
// doing, and each one opens a detail view with the next step, the contact,
// payment, documents and the full timeline of automatic messages.
'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────
type Stage = 'LEAD' | 'PAID' | 'READY' | 'SUBMITTED' | 'COMPLETED' | 'CANCELLED';

interface Row {
  id: string;
  requirementName: string;
  countyName: string | null;
  businessId: number | null;
  businessName: string | null;
  contactName: string;
  contactPhone: string;
  contactPhoneE164: string | null;
  contactEmail: string | null;
  stage: Stage;
  serviceFee: number | null;
  governmentFeeMin: number | null;
  governmentFeeMax: number | null;
  currency: string;
  createdAt: string;
  paidAt: string | null;
  archived: boolean;
  contactConsentAt: string | null;
  optedOutAt: string | null;
  reminderCount: number;
  _count: { documents: number };
}

interface DocRow {
  id: string;
  specId: number | null;
  label: string;
  fileName: string;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
  rejectReason: string | null;
  uploadedBy: string;
  isDeliverable: boolean;
  createdAt: string;
}

interface EventRow {
  id: string;
  kind: string;
  actor: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL' | null;
  summary: string;
  deliveryStatus: string | null;
  createdAt: string;
}

interface Detail {
  request: Row & {
    notes: string | null;
    adminNotes: string | null;
    sourcePath: string | null;
    authorityReference: string | null;
    submittedAt: string | null;
    completedAt: string | null;
    cancelReason: string | null;
    lastReminderAt: string | null;
    nextReminderAt: string | null;
    templateId: number | null;
  };
  business: { id: number; name: string; slug: string } | null;
  payments: { id: string; amount: number; currency: string; provider: string; status: string; receiptNumber: string | null; payerPhone: string | null; failureReason: string | null; createdAt: string; paidAt: string | null }[];
  documents: DocRow[];
  events: EventRow[];
  checklist: { id: number; label: string; isRequired: boolean; satisfied: boolean }[];
  duplicates: { id: string; requirementName: string; stage: Stage; createdAt: string }[];
  trackUrl: string | null;
}

const PAGE_SIZE = 12;

const STAGES: Record<Stage, { label: string; bg: string; color: string }> = {
  LEAD: { label: 'Unpaid lead', bg: 'rgba(148,148,176,0.12)', color: '#b4b4cc' },
  PAID: { label: 'Waiting on customer', bg: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  READY: { label: 'Ready to apply', bg: 'rgba(99,102,241,0.16)', color: '#a5b4fc' },
  SUBMITTED: { label: 'Submitted', bg: 'rgba(56,189,248,0.12)', color: '#7dd3fc' },
  COMPLETED: { label: 'Completed', bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(239,68,68,0.1)', color: '#f87171' },
};

const QUEUES: { key: string; label: string; match: (r: Row) => boolean }[] = [
  { key: 'action', label: 'Needs action', match: (r) => r.stage === 'READY' },
  { key: 'waiting', label: 'Waiting on customer', match: (r) => r.stage === 'PAID' },
  { key: 'leads', label: 'Unpaid leads', match: (r) => r.stage === 'LEAD' && !r.archived },
  { key: 'submitted', label: 'Submitted', match: (r) => r.stage === 'SUBMITTED' },
  { key: 'done', label: 'Completed', match: (r) => r.stage === 'COMPLETED' },
  { key: 'all', label: 'All', match: () => true },
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
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-plain { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.5rem 0.75rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; width:100%; box-sizing:border-box; }
  .u-plain:focus { border-color:rgba(99,102,241,0.5); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; }
  .u-select option { background:#1a1a24; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; text-decoration:none; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; }
  .btn-primary:hover { transform:translateY(-1px); }
  .btn-primary:disabled, .btn-danger:disabled, .btn-ghost:disabled { opacity:0.5; cursor:not-allowed; transform:none; }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-sm { padding:0.32rem 0.7rem; font-size:0.76rem; }
  .tab { padding:0.5rem 0.95rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.8rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.03); color:#9494b0; white-space:nowrap; display:inline-flex; align-items:center; gap:0.45rem; }
  .tab:hover { color:#f0f0f5; }
  .tab.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.35); }
  .tab .n { font-family:'DM Mono',monospace; font-size:0.72rem; padding:0.05rem 0.4rem; border-radius:100px; background:rgba(255,255,255,0.08); }
  .tab.active .n { background:rgba(99,102,241,0.3); }
  .tab .n.hot { background:#6366f1; color:#fff; }
  .stat-pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 1rem; border-radius:10px; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; width:100%; max-width:720px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .modal-sm { max-width:400px; padding:1.75rem; }
  .pg-btn { display:inline-flex; align-items:center; justify-content:center; min-width:32px; height:32px; padding:0 0.5rem; border-radius:7px; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.04); color:#9494b0; }
  .pg-btn:hover:not(:disabled) { background:rgba(255,255,255,0.09); color:#f0f0f5; }
  .pg-btn.pg-active { background:rgba(99,102,241,0.2); border-color:rgba(99,102,241,0.4); color:#a5b4fc; }
  .pg-btn:disabled { opacity:0.35; cursor:not-allowed; }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .section-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.75rem; }
  .next-card { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.25); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.75rem; }
  .f-label { display:block; font-size:0.72rem; font-weight:600; color:#7a7a96; margin-bottom:0.25rem; }
  .f-val { font-size:0.84rem; color:#e6e6f0; word-break:break-word; }
  .h3 { font-size:0.78rem; font-weight:700; color:#9494b0; margin:0 0 0.6rem; }
  .link { color:#a5b4fc; text-decoration:none; }
  .link:hover { text-decoration:underline; }
  .tl-row { display:flex; gap:0.65rem; padding:0.4rem 0; font-size:0.8rem; border-bottom:1px solid rgba(255,255,255,0.03); }
  .tl-row:last-child { border-bottom:none; }
  .tag { display:inline-flex; padding:0.1rem 0.45rem; border-radius:100px; font-size:0.66rem; font-weight:700; background:rgba(255,255,255,0.07); color:#9494b0; }
`;

// ── Helpers ──────────────────────────────────────────────────────────────
async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Something went wrong.');
  return data as T;
}

const jsonPost = (body: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const money = (n: number | null, currency = 'KES') => (n == null ? '—' : `${currency} ${Math.round(n).toLocaleString('en-KE')}`);

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StageChip({ stage }: { stage: Stage }) {
  const s = STAGES[stage];
  return (
    <span style={{ display: 'inline-flex', padding: '0.2rem 0.65rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
}

function waLink(r: Row, stage: Stage): string | null {
  if (!r.contactPhoneE164) return null;
  const first = r.contactName.trim().split(/\s+/)[0];
  const what = r.requirementName;
  const text =
    stage === 'LEAD'
      ? `Hi ${first}, this is Hustlecare. You started an application for your ${what} — can I help you finish it?`
      : stage === 'PAID'
        ? `Hi ${first}, this is Hustlecare about your ${what} application. We are still waiting for some documents — can I help?`
        : `Hi ${first}, this is Hustlecare about your ${what} application.`;
  return `https://wa.me/${r.contactPhoneE164.replace('+', '')}?text=${encodeURIComponent(text)}`;
}

// ── Detail view ──────────────────────────────────────────────────────────
function DetailModal({
  id,
  onClose,
  onChanged,
  notify,
}: {
  id: string;
  onClose: () => void;
  onChanged: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [receipt, setReceipt] = useState('');
  const [reference, setReference] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [notes, setNotes] = useState('');
  const [, setNotesLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await api<Detail>(`/api/admin/apply-requests/${id}`);
      setD(data);
      setNotesLoaded((loaded) => {
        if (!loaded) setNotes(data.request.adminNotes ?? '');
        return true;
      });
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load this request.');
    }
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function run(key: string, fn: () => Promise<unknown>, okMsg?: string) {
    setBusy(key);
    try {
      await fn();
      if (okMsg) notify(okMsg);
      await reload();
      onChanged();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Something went wrong.', 'error');
    } finally {
      setBusy('');
    }
  }

  async function openDoc(docId: string) {
    const win = window.open('', '_blank');
    try {
      const { url } = await api<{ url: string }>(`/api/admin/apply-requests/${id}/documents/${docId}`);
      if (win) win.location.href = url;
      else notify('Your browser blocked the pop-up. Allow pop-ups and try again.', 'error');
    } catch (e) {
      win?.close();
      notify(e instanceof Error ? e.message : 'Could not open that document.', 'error');
    }
  }

  async function uploadDeliverable(file: File | undefined) {
    if (!file) return;
    await run(
      'deliverable',
      async () => {
        const body = new FormData();
        body.append('file', file);
        await api(`/api/admin/apply-requests/${id}/deliverable`, { method: 'POST', body });
      },
      'Uploaded for the customer',
    );
  }

  if (loadError) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
          <p style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>{loadError}</p>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" style={{ padding: '3rem', textAlign: 'center', color: '#55556e', fontSize: '0.85rem' }}>Loading…</div>
      </div>
    );
  }

  const r = d.request;
  const stage = r.stage;
  const requiredItems = d.checklist.filter((c) => c.isRequired);
  const requiredDone = requiredItems.filter((c) => c.satisfied).length;
  const customerDocs = d.documents.filter((x) => !x.isDeliverable);
  const deliverables = d.documents.filter((x) => x.isDeliverable);
  const wa = waLink(r, stage);
  const isLegacy = !r.contactConsentAt;
  const canRemind = stage === 'LEAD' && !isLegacy && !r.optedOutAt && !!r.serviceFee;
  const terminal = stage === 'COMPLETED' || stage === 'CANCELLED';
  const canDelete = d.payments.length === 0;

  const nextStep = (() => {
    switch (stage) {
      case 'LEAD':
        return isLegacy
          ? 'Old request from before the automation. Contact the customer yourself.'
          : r.optedOutAt
            ? 'Waiting for payment. The customer opted out of reminders.'
            : `Waiting for payment. Reminders sent: ${r.reminderCount} of 3.`;
      case 'PAID':
        return requiredItems.length
          ? `Waiting for documents: ${requiredDone} of ${requiredItems.length} required items received.`
          : 'Paid. No documents were required.';
      case 'READY':
        return 'Everything is in. Do the application, then record the reference number below.';
      case 'SUBMITTED':
        return 'Submitted. Upload the finished permit or certificate when you have it, then mark it completed.';
      case 'COMPLETED':
        return 'Done. The customer has been told their documents are ready.';
      default:
        return r.cancelReason ? `Cancelled: ${r.cancelReason}` : 'Cancelled.';
    }
  })();

  const gov =
    r.governmentFeeMin != null && r.governmentFeeMax != null
      ? r.governmentFeeMin === r.governmentFeeMax
        ? `about ${money(r.governmentFeeMin, r.currency)}`
        : `${money(r.governmentFeeMin, r.currency)} – ${money(r.governmentFeeMax, r.currency)}`
      : '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem' }}>{r.requirementName}</h2>
              <p style={{ fontSize: '0.8rem', color: '#7a7a96', margin: 0 }}>
                {r.countyName && <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{r.countyName}</span>}
                {(d.business || r.businessName) && (
                  <span>
                    {r.countyName ? ' · ' : ''}for{' '}
                    {d.business ? (
                      <a className="link" href={`/businesses/${d.business.slug}`} target="_blank" rel="noopener">
                        {d.business.name}
                      </a>
                    ) : (
                      r.businessName
                    )}
                  </span>
                )}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <StageChip stage={stage} />
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">×</button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.1rem 1.5rem' }}>
          {/* Next step */}
          <div className="next-card">
            <h3 className="h3" style={{ color: '#a5b4fc' }}>Next step</h3>
            <p style={{ fontSize: '0.86rem', margin: '0 0 0.75rem', lineHeight: 1.5 }}>{nextStep}</p>

            {stage === 'LEAD' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                {canRemind && (
                  <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => run('remind', () => api(`/api/admin/apply-requests/${id}/remind`, { method: 'POST' }), 'Reminder sent')}>
                    {busy === 'remind' ? 'Sending…' : 'Send reminder now'}
                  </button>
                )}
                <input className="u-plain" style={{ width: 170 }} placeholder="M-Pesa receipt code" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
                <button className="btn btn-ghost btn-sm" disabled={!!busy || !receipt.trim()} onClick={() => run('paid', () => api(`/api/admin/apply-requests/${id}/mark-paid`, jsonPost({ receiptNumber: receipt })), 'Marked as paid').then(() => setReceipt(''))}>
                  {busy === 'paid' ? 'Saving…' : 'Mark as paid'}
                </button>
              </div>
            )}

            {(stage === 'PAID' || stage === 'READY') && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <input className="u-plain" style={{ width: 210 }} placeholder="Reference number (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
                <button className="btn btn-primary btn-sm" disabled={!!busy} onClick={() => run('submit', () => api(`/api/admin/apply-requests/${id}/stage`, jsonPost({ stage: 'SUBMITTED', authorityReference: reference })), 'Marked as submitted — customer notified').then(() => setReference(''))}>
                  {busy === 'submit' ? 'Saving…' : 'Mark as submitted'}
                </button>
              </div>
            )}

            {stage === 'SUBMITTED' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                  {busy === 'deliverable' ? 'Uploading…' : 'Upload permit / certificate'}
                  <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={(e) => { uploadDeliverable(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
                <button className="btn btn-primary btn-sm" disabled={!!busy || deliverables.length === 0} title={deliverables.length === 0 ? 'Upload the finished document first' : undefined} onClick={() => run('complete', () => api(`/api/admin/apply-requests/${id}/stage`, jsonPost({ stage: 'COMPLETED' })), 'Completed — customer notified')}>
                  {busy === 'complete' ? 'Saving…' : 'Mark as completed'}
                </button>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="section-card">
            <h3 className="h3">Customer</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><span className="f-label">Name</span><div className="f-val">{r.contactName}</div></div>
              <div><span className="f-label">Phone</span><div className="f-val adm-mono">{r.contactPhone}</div></div>
              <div><span className="f-label">Email</span><div className="f-val">{r.contactEmail ?? '—'}</div></div>
              <div>
                <span className="f-label">Contact</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {wa && <a className="btn btn-ghost btn-sm" href={wa} target="_blank" rel="noopener">WhatsApp</a>}
                  <a className="btn btn-ghost btn-sm" href={`tel:${r.contactPhoneE164 ?? r.contactPhone}`}>Call</a>
                  {r.contactEmail && <a className="btn btn-ghost btn-sm" href={`mailto:${r.contactEmail}`}>Email</a>}
                </div>
              </div>
            </div>
            {r.notes && (
              <div style={{ marginTop: '0.75rem' }}>
                <span className="f-label">Notes from customer</span>
                <div className="f-val" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r.notes}</div>
              </div>
            )}
            {d.duplicates.length > 0 && (
              <p style={{ fontSize: '0.78rem', color: '#fbbf24', margin: '0.75rem 0 0' }}>
                {d.duplicates.length} other request{d.duplicates.length > 1 ? 's' : ''} from this phone number:{' '}
                {d.duplicates.map((x) => `${x.requirementName} (${STAGES[x.stage].label.toLowerCase()}, ${fmtDate(x.createdAt)})`).join('; ')}
              </p>
            )}
          </div>

          {/* Request & money */}
          <div className="section-card">
            <h3 className="h3">Request and payment</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><span className="f-label">Started</span><div className="f-val">{fmtDateTime(r.createdAt)}</div></div>
              <div><span className="f-label">From page</span><div className="f-val">{r.sourcePath ? <a className="link" href={r.sourcePath} target="_blank" rel="noopener">{r.sourcePath}</a> : '—'}</div></div>
              <div><span className="f-label">Service fee</span><div className="f-val">{money(r.serviceFee, r.currency)}</div></div>
              <div><span className="f-label">Government fee (estimate shown to customer)</span><div className="f-val">{gov}</div></div>
              <div><span className="f-label">Paid</span><div className="f-val">{r.paidAt ? fmtDateTime(r.paidAt) : '—'}</div></div>
              <div><span className="f-label">Authority reference</span><div className="f-val adm-mono">{r.authorityReference ?? '—'}</div></div>
            </div>
            {d.payments.length > 0 && (
              <div style={{ marginTop: '0.75rem' }}>
                <span className="f-label">Payment attempts</span>
                {d.payments.map((p) => (
                  <div key={p.id} style={{ fontSize: '0.8rem', padding: '0.25rem 0', color: '#c4c4d8' }}>
                    {money(p.amount, p.currency)} · {p.provider} · <strong style={{ color: p.status === 'SUCCESSFUL' ? '#34d399' : p.status === 'FAILED' ? '#f87171' : '#fbbf24' }}>{p.status.toLowerCase()}</strong>
                    {p.receiptNumber && <span className="adm-mono"> · {p.receiptNumber}</span>}
                    {p.failureReason && <span style={{ color: '#7a7a96' }}> · {p.failureReason}</span>}
                    <span style={{ color: '#55556e' }}> · {fmtDateTime(p.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
            {d.trackUrl && (
              <p style={{ fontSize: '0.78rem', margin: '0.75rem 0 0' }}>
                <a className="link" href={d.trackUrl} target="_blank" rel="noopener">Open the customer's tracking page</a>
                {' · '}
                <button className="link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }} onClick={() => { navigator.clipboard.writeText(d.trackUrl as string); notify('Link copied'); }}>copy link</button>
              </p>
            )}
          </div>

          {/* Documents */}
          {stage !== 'LEAD' && (
            <div className="section-card">
              <h3 className="h3">Documents{requiredItems.length > 0 ? ` — ${requiredDone} of ${requiredItems.length} required received` : ''}</h3>
              {d.checklist.map((c) => (
                <div key={c.id} style={{ fontSize: '0.8rem', padding: '0.15rem 0', color: c.satisfied ? '#34d399' : c.isRequired ? '#fbbf24' : '#7a7a96' }}>
                  {c.satisfied ? '✓' : '○'} {c.label}{!c.isRequired && ' (optional)'}
                </div>
              ))}
              {customerDocs.length === 0 && <p style={{ fontSize: '0.8rem', color: '#55556e', margin: '0.5rem 0 0' }}>Nothing uploaded yet.</p>}
              {customerDocs.map((x) => (
                <div key={x.id} style={{ marginTop: '0.6rem', padding: '0.55rem 0.7rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{x.label}</div>
                      <div style={{ fontSize: '0.74rem', color: '#7a7a96', overflow: 'hidden', textOverflow: 'ellipsis' }}>{x.fileName} · {x.status === 'PENDING_REVIEW' ? 'not reviewed' : x.status.toLowerCase()}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDoc(x.id)}>View</button>
                      {x.status !== 'ACCEPTED' && <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => run(`ok-${x.id}`, () => api(`/api/admin/apply-requests/${id}/documents/${x.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'ACCEPTED' }) }), 'Accepted')}>Accept</button>}
                      {x.status !== 'REJECTED' && !terminal && <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => { setRejectFor(x.id); setRejectReason(''); }}>Reject</button>}
                    </div>
                  </div>
                  {x.status === 'REJECTED' && x.rejectReason && <p style={{ fontSize: '0.76rem', color: '#f87171', margin: '0.35rem 0 0' }}>Rejected: {x.rejectReason}</p>}
                  {rejectFor === x.id && (
                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <input className="u-plain" placeholder="What is wrong? The customer sees this." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                      <button className="btn btn-danger btn-sm" disabled={!!busy || !rejectReason.trim()} onClick={() => run(`rej-${x.id}`, () => api(`/api/admin/apply-requests/${id}/documents/${x.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'REJECTED', rejectReason }) }), 'Rejected — customer asked to re-upload').then(() => setRejectFor(null))}>Send</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setRejectFor(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
              {deliverables.length > 0 && (
                <div style={{ marginTop: '0.9rem' }}>
                  <span className="f-label">Uploaded for the customer</span>
                  {deliverables.map((x) => (
                    <div key={x.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.25rem 0' }}>
                      <span>{x.label} · <span style={{ color: '#7a7a96' }}>{x.fileName}</span></span>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDoc(x.id)}>View</button>
                    </div>
                  ))}
                </div>
              )}
              {(stage === 'PAID' || stage === 'READY') && (
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', marginTop: '0.75rem' }}>
                  {busy === 'deliverable' ? 'Uploading…' : 'Upload a file for the customer'}
                  <input type="file" accept="application/pdf,image/*" style={{ display: 'none' }} onChange={(e) => { uploadDeliverable(e.target.files?.[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="section-card">
            <h3 className="h3">Your notes (private)</h3>
            <textarea className="u-plain" rows={3} style={{ resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => run('notes', () => api(`/api/admin/apply-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminNotes: notes }) }), 'Notes saved')}>
                {busy === 'notes' ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="section-card">
            <h3 className="h3">Timeline</h3>
            {d.events.map((ev) => (
              <div key={ev.id} className="tl-row">
                <span className="adm-mono" style={{ color: '#55556e', flexShrink: 0, width: 96 }}>{fmtDateTime(ev.createdAt)}</span>
                <span style={{ flex: 1, color: ev.kind === 'MESSAGE_FAILED' || ev.kind === 'PAYMENT_FAILED' ? '#f87171' : '#d0d0e0' }}>
                  {ev.summary}
                  {ev.channel && <span className="tag" style={{ marginLeft: 6 }}>{ev.channel.toLowerCase()}</span>}
                  <span className="tag" style={{ marginLeft: 6 }}>{ev.actor}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', gap: '0.65rem', flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-sm" disabled={!!busy} onClick={() => run('archive', () => api(`/api/admin/apply-requests/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !r.archived }) }), r.archived ? 'Restored' : 'Archived')}>
              {r.archived ? 'Restore' : 'Archive'}
            </button>
            {!terminal && (
              showCancel ? (
                <span style={{ display: 'inline-flex', gap: '0.4rem' }}>
                  <input className="u-plain" style={{ width: 200 }} placeholder="Reason (optional)" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                  <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={() => run('cancel', () => api(`/api/admin/apply-requests/${id}/stage`, jsonPost({ stage: 'CANCELLED', cancelReason })), 'Cancelled').then(() => setShowCancel(false))}>Confirm cancel</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowCancel(false)}>Back</button>
                </span>
              ) : (
                <button className="btn btn-danger btn-sm" onClick={() => setShowCancel(true)}>Cancel request</button>
              )
            )}
            {canDelete && (
              confirmDelete ? (
                <button className="btn btn-danger btn-sm" disabled={!!busy} onClick={async () => { setBusy('delete'); try { await api(`/api/admin/apply-requests/${id}`, { method: 'DELETE' }); notify('Request deleted'); onChanged(); onClose(); } catch (e) { notify(e instanceof Error ? e.message : 'Could not delete.', 'error'); setBusy(''); } }}>
                  Yes, delete permanently
                </button>
              ) : (
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(true)}>Delete</button>
              )
            )}
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────
export default function ApplyRequestsPage() {
  const [requests, setRequests] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState('action');
  const [search, setSearch] = useState('');
  const [newestFirst, setNewestFirst] = useState(true);
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await api<{ requests: Row[] }>('/api/admin/apply-requests');
      setRequests(d.requests);
    } catch {
      if (!silent) {
        setRequests([]);
        notify('Could not load requests', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 60_000); // new payments show up without a refresh
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => setPage(1), [queue, search, newestFirst]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const q of QUEUES) out[q.key] = requests.filter(q.match).length;
    return out;
  }, [requests]);

  const revenue = useMemo(
    () => requests.filter((r) => r.paidAt && r.stage !== 'CANCELLED').reduce((sum, r) => sum + (r.serviceFee ?? 0), 0),
    [requests],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = QUEUES.find((x) => x.key === queue) ?? QUEUES[0];
    return requests
      .filter(active.match)
      .filter(
        (r) =>
          !q ||
          r.requirementName.toLowerCase().includes(q) ||
          r.contactName.toLowerCase().includes(q) ||
          r.contactPhone.toLowerCase().includes(q) ||
          (r.contactEmail ?? '').toLowerCase().includes(q) ||
          (r.businessName ?? '').toLowerCase().includes(q) ||
          (r.countyName ?? '').toLowerCase().includes(q),
      )
      .sort((a, b) => (newestFirst ? b.createdAt.localeCompare(a.createdAt) : a.createdAt.localeCompare(b.createdAt)));
  }, [requests, queue, search, newestFirst]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const emptyText: Record<string, string> = {
    action: 'Nothing waiting on you. Paid requests with all documents in will appear here.',
    waiting: 'No one is waiting to upload documents.',
    leads: 'No unpaid leads.',
    submitted: 'Nothing submitted and waiting.',
    done: 'No completed requests yet.',
    all: 'No requests yet.',
  };

  return (
    <>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Apply For Me</h1>
          <p style={{ fontSize: '0.84rem', color: '#55556e' }}>Customers who want us to apply for a permit, licence or certificate for them.</p>
          <a className="btn btn-ghost btn-sm" href="/admin/apply-services" style={{ marginTop: '0.75rem' }}>Prices and documents</a>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Needs action', val: counts.action, bg: 'rgba(99,102,241,0.12)', color: '#a5b4fc' },
            { label: 'Waiting on customer', val: counts.waiting, bg: 'rgba(245,158,11,0.1)', color: '#fbbf24' },
            { label: 'Unpaid leads', val: counts.leads, bg: 'rgba(148,148,176,0.1)', color: '#b4b4cc' },
            { label: 'Revenue (service fees)', val: money(revenue), bg: 'rgba(16,185,129,0.12)', color: '#34d399' },
          ].map((s) => (
            <div key={s.label} className="stat-pill" style={{ background: s.bg, border: `1px solid ${s.color}22` }}>
              <span className="adm-mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.val}</span>
              <span style={{ fontSize: '0.75rem', color: s.color, opacity: 0.8 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Queues */}
        <div className="scroll" style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.9rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {QUEUES.map((q) => (
            <button key={q.key} className={`tab${queue === q.key ? ' active' : ''}`} onClick={() => setQueue(q.key)}>
              {q.label}
              <span className={`n${q.key === 'action' && counts[q.key] > 0 ? ' hot' : ''}`}>{counts[q.key]}</span>
            </button>
          ))}
        </div>

        {/* Search & sort */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
            <input type="text" placeholder="Search requirement, name, phone, email, business, county…" value={search} onChange={(e) => setSearch(e.target.value)} className="u-input" />
          </div>
          <select className="u-select" value={newestFirst ? 'new' : 'old'} onChange={(e) => setNewestFirst(e.target.value === 'new')}>
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#55556e', fontSize: '0.85rem' }}>Loading requests…</div>
        ) : (
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="scroll" style={{ overflowX: 'auto' }}>
              <table className="r-table">
                <thead>
                  <tr>
                    <th>Requirement</th>
                    <th>Customer</th>
                    <th>County</th>
                    <th>Status</th>
                    <th>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#55556e', cursor: 'default' }}>{search ? 'No requests match your search.' : emptyText[queue]}</td></tr>
                  ) : (
                    paginated.map((r) => (
                      <tr key={r.id} onClick={() => setOpenId(r.id)}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{r.requirementName}</div>
                          {r.businessName && <div style={{ fontSize: '0.74rem', color: '#55556e', marginTop: 2 }}>for {r.businessName}</div>}
                        </td>
                        <td>
                          <div style={{ fontSize: '0.84rem', fontWeight: 500 }}>{r.contactName}</div>
                          <div className="adm-mono" style={{ fontSize: '0.74rem', color: '#55556e' }}>{r.contactPhone}</div>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{r.countyName ?? '—'}</td>
                        <td>
                          <StageChip stage={r.stage} />
                          {r.stage === 'PAID' && <div style={{ fontSize: '0.72rem', color: '#7a7a96', marginTop: 4 }}>{r._count.documents} file{r._count.documents === 1 ? '' : 's'} uploaded</div>}
                          {r.stage === 'LEAD' && !r.contactConsentAt && <div style={{ fontSize: '0.72rem', color: '#7a7a96', marginTop: 4 }}>old request</div>}
                          {r.stage === 'LEAD' && r.contactConsentAt && r.reminderCount > 0 && <div style={{ fontSize: '0.72rem', color: '#7a7a96', marginTop: 4 }}>{r.reminderCount} reminder{r.reminderCount === 1 ? '' : 's'} sent</div>}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#9494b0', whiteSpace: 'nowrap' }}>{timeAgo(r.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#55556e', margin: '0.75rem 0' }}>
          <span>{filtered.length} request{filtered.length === 1 ? '' : 's'}</span>
          {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className="pg-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            <span className="pg-btn pg-active" style={{ cursor: 'default' }}>{page}</span>
            <button className="pg-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            <button className="pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        )}

        {openId && <DetailModal id={openId} onClose={() => setOpenId(null)} onChanged={() => load(true)} notify={notify} />}
      </div>
    </>
  );
}