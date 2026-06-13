'use client';
// components/vendor/SuspensionNotice.tsx
import { useState } from 'react';
import {
  ShieldOff, Loader2, AlertCircle, CheckCircle2,
  MessageSquare, Clock, XCircle, X,
} from 'lucide-react';

export type VendorAppealData = {
  status: string; // VendorStatus, but we only care about 'SUSPENDED' here
  suspendReason: string | null;
  appealStatus: 'NONE' | 'PENDING' | 'REJECTED';
  appealMessage: string | null;
  issueResolved: boolean;
  appealedAt: string | null;
  appealResponse: string | null;
  appealRespondedAt: string | null;
};

type AppealUpdate = Pick<VendorAppealData, 'appealStatus' | 'appealMessage' | 'issueResolved' | 'appealedAt' | 'appealResponse' | 'appealRespondedAt'>;

/* ────────────────────────────────────────────────────────────────────── */
/* Inline banner — shown on Dashboard / Products pages                    */
/* ────────────────────────────────────────────────────────────────────── */

export function SuspensionBanner({ vendor, onAppeal }: { vendor: VendorAppealData; onAppeal: () => void }) {
  if (vendor.status !== 'SUSPENDED') return null;

  return (
    <div style={B.wrap}>
      <div style={B.iconWrap}><ShieldOff size={16} color="#f87171" /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={B.title}>Account Suspended</div>
        <div style={B.body}>
          Your storefront and all products are hidden from the marketplace.
          {vendor.suspendReason && <span style={{ color: '#fca5a5', fontStyle: 'italic' }}> Reason: {vendor.suspendReason}</span>}
        </div>

        {/* Appeal status / CTA */}
        <div style={B.appealRow}>
          {vendor.appealStatus === 'PENDING' && (
            <span style={B.pendingPill}>
              <Clock size={12} /> Appeal submitted {vendor.appealedAt ? `on ${formatDate(vendor.appealedAt)}` : ''} — under review
            </span>
          )}
          {vendor.appealStatus === 'REJECTED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
              <span style={B.rejectedPill}>
                <XCircle size={12} /> Appeal dismissed
              </span>
              {vendor.appealResponse && (
                <div style={B.responseBox}>
                  <strong style={{ color: '#fca5a5' }}>Admin response:</strong> {vendor.appealResponse}
                </div>
              )}
              <button style={B.appealBtn} onClick={onAppeal}>
                <MessageSquare size={13} /> Appeal again
              </button>
            </div>
          )}
          {vendor.appealStatus === 'NONE' && (
            <button style={B.appealBtn} onClick={onAppeal}>
              <MessageSquare size={13} /> Appeal this suspension
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────── */
/* Modal — full appeal form / status, also used as the "Add Product" block*/
/* ────────────────────────────────────────────────────────────────────── */

export function AppealModal({
  vendor,
  onClose,
  onSubmitted,
  context = 'general',
}: {
  vendor: VendorAppealData;
  onClose: () => void;
  onSubmitted: (update: AppealUpdate) => void;
  /** 'addProduct' shows extra framing copy explaining why they were blocked */
  context?: 'general' | 'addProduct';
}) {
  const [issueResolved, setIssueResolved] = useState(vendor.issueResolved);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = vendor.appealStatus !== 'PENDING';

  async function handleSubmit() {
    if (!message.trim()) { setError('Please describe what you have done to resolve this issue.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/vendors/appeal', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueResolved, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSubmitted(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit appeal');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={M.overlay} onClick={onClose}>
      <div style={M.modal} onClick={e => e.stopPropagation()}>
        <button style={M.closeBtn} onClick={onClose} aria-label="Close"><X size={16} /></button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={M.iconWrap}><ShieldOff size={22} color="#f87171" /></div>
          <h3 style={M.title}>Account Suspended</h3>
          <p style={M.desc}>
            {context === 'addProduct'
              ? "You can't add new products while your account is suspended."
              : 'Your storefront and all products are hidden from the marketplace.'}
          </p>
          {vendor.suspendReason && (
            <p style={M.reasonBox}>
              <strong>Reason:</strong> {vendor.suspendReason}
            </p>
          )}
        </div>

        {/* Pending state */}
        {vendor.appealStatus === 'PENDING' && (
          <div style={M.statusBox}>
            <Clock size={16} color="#fbbf24" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.84rem', marginBottom: '0.2rem' }}>Appeal under review</div>
              <p style={{ fontSize: '0.78rem', color: '#9494b0', lineHeight: 1.6, margin: 0 }}>
                You submitted an appeal{vendor.appealedAt ? ` on ${formatDate(vendor.appealedAt)}` : ''}. The Hustlecare team will review it and respond soon.
              </p>
              {vendor.appealMessage && (
                <div style={M.quotedMsg}>&ldquo;{vendor.appealMessage}&rdquo;</div>
              )}
            </div>
          </div>
        )}

        {/* Rejected: show admin response above the form */}
        {vendor.appealStatus === 'REJECTED' && vendor.appealResponse && (
          <div style={{ ...M.statusBox, marginBottom: '1rem' }}>
            <XCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#f87171', fontSize: '0.84rem', marginBottom: '0.2rem' }}>Previous appeal dismissed</div>
              <p style={{ fontSize: '0.78rem', color: '#9494b0', lineHeight: 1.6, margin: 0 }}>{vendor.appealResponse}</p>
            </div>
          </div>
        )}

        {/* Form — only when no appeal is currently pending */}
        {canSubmit && (
          <>
            <div style={M.field}>
              <label style={M.checkboxRow}>
                <input
                  type="checkbox"
                  checked={issueResolved}
                  onChange={e => setIssueResolved(e.target.checked)}
                  style={{ accentColor: '#f59e0b', cursor: 'pointer', width: 16, height: 16 }}
                />
                <span>I have resolved the issue described above</span>
              </label>
            </div>

            <div style={M.field}>
              <label style={M.label}>
                {vendor.appealStatus === 'REJECTED' ? 'Appeal again — what has changed?' : 'Explain what you\'ve done to resolve this'}
                <span style={{ color: '#f87171' }}> *</span>
              </label>
              <textarea
                style={M.textarea}
                rows={4}
                placeholder="Describe the steps you've taken to address this issue, and any other context the review team should know…"
                value={message}
                onChange={e => setMessage(e.target.value)}
              />
            </div>

            {error && (
              <div style={M.errorBanner}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }} className="vd-modal-actions">
              <button style={M.btnSecondary} onClick={onClose}>Close</button>
              <button style={M.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="vd-spin" /> : <CheckCircle2 size={14} />}
                {submitting ? 'Submitting…' : 'Submit Appeal'}
              </button>
            </div>
          </>
        )}

        {!canSubmit && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button style={M.btnSecondary} onClick={onClose}>Close</button>
          </div>
        )}

        <style>{`
          @keyframes vd-appeal-spin { to { transform: rotate(360deg); } }
          .vd-spin { animation: vd-appeal-spin 1s linear infinite; }
          @media (max-width: 480px) {
            .vd-modal-actions { flex-direction: column-reverse !important; }
            .vd-modal-actions button { width: 100%; justify-content: center; }
          }
        `}</style>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ────────────────────────────────────────────────────────────────────── */
/* Styles                                                                  */
/* ────────────────────────────────────────────────────────────────────── */

const B: Record<string, React.CSSProperties> = {
  wrap:        { display: 'flex', alignItems: 'flex-start', gap: '0.85rem', padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '1.25rem' },
  iconWrap:    { width: 34, height: 34, borderRadius: 8, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  title:       { fontSize: '0.88rem', fontWeight: 700, color: '#fca5a5', marginBottom: '0.2rem' },
  body:        { fontSize: '0.78rem', color: '#9494b0', lineHeight: 1.6 },
  appealRow:   { marginTop: '0.65rem' },
  appealBtn:   { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.9rem', borderRadius: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
  pendingPill: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: 100, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: '0.74rem', fontWeight: 600 },
  rejectedPill:{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.35rem 0.75rem', borderRadius: 100, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: '0.74rem', fontWeight: 600, alignSelf: 'flex-start' },
  responseBox: { fontSize: '0.76rem', color: '#9494b0', lineHeight: 1.6, padding: '0.55rem 0.75rem', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' },
};

const M: Record<string, React.CSSProperties> = {
  overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' } as React.CSSProperties,
  modal:       { position: 'relative', background: '#1a1a24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '1.75rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' } as React.CSSProperties,
  closeBtn:    { position: 'absolute', top: '0.85rem', right: '0.85rem', width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9494b0', cursor: 'pointer' },
  iconWrap:    { width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem' },
  title:       { fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.4rem' },
  desc:        { fontSize: '0.81rem', color: '#9494b0', lineHeight: 1.6, marginBottom: '0.5rem' },
  reasonBox:   { fontSize: '0.78rem', color: '#f87171', marginTop: '0.5rem', fontStyle: 'italic', background: 'rgba(239,68,68,0.06)', padding: '0.5rem 0.75rem', borderRadius: 7, lineHeight: 1.6 },
  statusBox:   { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', padding: '0.75rem 0.85rem', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.1rem' },
  quotedMsg:   { fontSize: '0.76rem', color: '#9494b0', lineHeight: 1.6, marginTop: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: 7, background: 'rgba(0,0,0,0.2)', fontStyle: 'italic' as const },
  field:       { marginBottom: '0.9rem' },
  checkboxRow: { display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#e2e2f0', cursor: 'pointer', padding: '0.65rem 0.8rem', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' },
  label:       { display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9494b0', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.07em' },
  textarea:    { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none', resize: 'vertical' as const, lineHeight: 1.6 },
  errorBanner: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.85rem', borderRadius: 8, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.78rem', marginBottom: '0.85rem' },
  btnPrimary:  { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 9, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer' },
  btnSecondary:{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' },
};