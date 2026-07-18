'use client';
// app/admin/vendors/page.tsx
import { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import {
  CheckCircle2, XCircle, Clock, Eye, Search,
  Store, Globe, ChevronDown, ChevronUp, Loader2,
  ShieldOff, Trash2, ShieldCheck, Package, MessageSquare, CheckSquare,
  Pencil, MapPin, Phone, Twitter, Instagram, Facebook, Linkedin,
  AlertTriangle, Check,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

type VendorDetail = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  coverImage: string | null;
  location: string | null;
  phone: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  userId: string | null;
  status: string;
  _count: { products: number };
  activeProducts?: number;
  suspendReason?: string | null;
  appealStatus?: 'NONE' | 'PENDING' | 'REJECTED';
  appealMessage?: string | null;
  issueResolved?: boolean;
  appealedAt?: string | null;
  appealResponse?: string | null;
  claimStatus?: 'NONE' | 'PENDING' | 'REJECTED';
  claimRequestedById?: string | null;
  claimRequestedBy?: { id: string; name: string; email: string; phone: string | null } | null;
  claimMessage?: string | null;
  claimedAt?: string | null;
  claimRejectionReason?: string | null;
};

type Application = {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNCLAIMED' | 'CLAIMED';
  businessName: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  location: string | null;
  phone: string | null;
  productCategories: string[];
  businessTypes: string[];
  pitchNote: string | null;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null; createdAt: string } | null;
  vendor: VendorDetail | null;
};

const STATUS_META = {
  PENDING:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: <Clock size={12} />,        label: 'Pending'   },
  APPROVED:  { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: <CheckCircle2 size={12} />, label: 'Approved'  },
  REJECTED:  { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)',   icon: <XCircle size={12} />,      label: 'Rejected'  },
  UNCLAIMED: { color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.2)',  icon: <Store size={12} />,        label: 'Unclaimed' },
  CLAIMED:   { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)',  icon: <ShieldCheck size={12} />,  label: 'Claimed'   },
};

const VENDOR_STATUS_META: Record<string, { color: string; bg: string; label: string }> = {
  ACTIVE:    { color: '#34d399', bg: 'rgba(16,185,129,0.1)',  label: 'Active'     },
  PENDING:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  label: 'Pending'    },
  SUSPENDED: { color: '#f87171', bg: 'rgba(239,68,68,0.1)',   label: 'Suspended'  },
  REJECTED:  { color: '#9494b0', bg: 'rgba(148,148,176,0.1)', label: 'Rejected'   },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Normalises phone numbers loosely (strips spaces, dashes, leading +) so
// "+254 700 000 000" and "254700000000" are recognised as the same value.
function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  return phone.replace(/[^\d]/g, '').replace(/^0+/, '');
}

function emailDomain(email: string | null | undefined): string {
  if (!email) return '';
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

function websiteDomain(website: string | null | undefined): string {
  if (!website) return '';
  try {
    const url = website.startsWith('http') ? website : `https://${website}`;
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

const EMPTY_VENDOR_FORM = {
  name: '', slug: '', tagline: '', logo: '', description: '', website: '',
  location: '', phone: '', twitterUrl: '', instagramUrl: '', facebookUrl: '', linkedinUrl: '',
};

export default function AdminVendorApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNCLAIMED' | 'CLAIMED'>('PENDING');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [reviewModal, setReviewModal] = useState<{ id: number; action: 'approve' | 'reject' } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionModal, setActionModal] = useState<{
    vendorId: number; vendorName: string; action: 'suspend' | 'unsuspend' | 'delete';
  } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Appeal review modal
  const [appealModal, setAppealModal] = useState<{
    vendorId: number; vendorName: string; suspendReason: string | null;
    appealMessage: string | null; issueResolved?: boolean; appealedAt: string | null;
  } | null>(null);
  const [appealAction, setAppealAction] = useState<'accept' | 'dismiss' | null>(null);
  const [appealResponse, setAppealResponse] = useState('');
  const [appealSubmitting, setAppealSubmitting] = useState(false);

  // Claim review modal
  const [claimModal, setClaimModal] = useState<{
    vendorId: number; vendorName: string; vendorPhone: string | null; vendorWebsite: string | null;
    claimantName: string; claimantEmail: string; claimantPhone: string | null; claimMessage: string | null;
  } | null>(null);
  const [claimAction, setClaimAction] = useState<'approve' | 'reject' | null>(null);
  const [claimRejectionReason, setClaimRejectionReason] = useState('');
  const [claimSubmitting, setClaimSubmitting] = useState(false);

  // Create / edit vendor modal
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorDetail | null>(null);

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/vendors');
      if (res.ok) setApplications(await res.json());
    } finally { setLoading(false); }
  }

  async function handleReview() {
    if (!reviewModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${reviewModal.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: reviewModal.action, reviewNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(reviewModal.action === 'approve' ? 'Vendor approved and live!' : 'Application rejected');
      setReviewModal(null);
      setReviewNote('');
      fetchApplications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally { setSubmitting(false); }
  }

  async function handleVendorAction() {
    if (!actionModal) return;
    setActionSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${actionModal.vendorId}/manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionModal.action, reason: actionNote }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const msgs = {
        suspend: 'Vendor suspended',
        unsuspend: 'Vendor reinstated',
        delete: 'Vendor deleted',
      };
      toast.success(msgs[actionModal.action]);
      setActionModal(null);
      setActionNote('');
      fetchApplications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Action failed');
    } finally { setActionSubmitting(false); }
  }

  async function handleAppealResolve() {
    if (!appealModal || !appealAction) return;
    setAppealSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${appealModal.vendorId}/appeal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: appealAction, response: appealResponse }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(appealAction === 'accept' ? 'Appeal accepted — vendor reinstated' : 'Appeal dismissed');
      setAppealModal(null);
      setAppealAction(null);
      setAppealResponse('');
      fetchApplications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally { setAppealSubmitting(false); }
  }

  async function handleClaimResolve() {
    if (!claimModal || !claimAction) return;
    setClaimSubmitting(true);
    try {
      const res = await fetch(`/api/admin/vendors/${claimModal.vendorId}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: claimAction, rejectionReason: claimRejectionReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(claimAction === 'approve' ? 'Claim approved — vendor transferred' : 'Claim rejected');
      setClaimModal(null);
      setClaimAction(null);
      setClaimRejectionReason('');
      fetchApplications();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setClaimSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return applications
      .filter(a => filter === 'ALL' || a.status === filter)
      .filter(a => !search ||
        a.businessName.toLowerCase().includes(search.toLowerCase()) ||
        (a.user?.email.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (a.user?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
      );
  }, [applications, filter, search]);

  const counts = useMemo(() => ({
    PENDING:   applications.filter(a => a.status === 'PENDING').length,
    APPROVED:  applications.filter(a => a.status === 'APPROVED').length,
    REJECTED:  applications.filter(a => a.status === 'REJECTED').length,
    UNCLAIMED: applications.filter(a => a.status === 'UNCLAIMED').length,
    CLAIMED:   applications.filter(a => a.status === 'CLAIMED').length,
  }), [applications]);

  const pendingAppeals = useMemo(
    () => applications.filter(a => a.vendor?.appealStatus === 'PENDING'),
    [applications]
  );

  const pendingClaims = useMemo(
    () => applications.filter(a => a.vendor?.claimStatus === 'PENDING'),
    [applications]
  );

  function openCreateVendor() {
    setEditingVendor(null);
    setVendorFormOpen(true);
  }

  function openEditVendor(vendor: VendorDetail) {
    setEditingVendor(vendor);
    setVendorFormOpen(true);
  }

  function openClaimModal(app: Application) {
    setClaimModal({
      vendorId: app.vendor!.id,
      vendorName: app.businessName,
      vendorPhone: app.vendor?.phone ?? null,
      vendorWebsite: app.vendor?.website ?? null,
      claimantName: app.vendor?.claimRequestedBy?.name ?? 'Unknown',
      claimantEmail: app.vendor?.claimRequestedBy?.email ?? '—',
      claimantPhone: app.vendor?.claimRequestedBy?.phone ?? null,
      claimMessage: app.vendor?.claimMessage ?? null,
    });
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a24', color: '#f0f0f5', border: '1px solid rgba(255,255,255,0.09)', fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem' }
      }} />

      {/* Header */}
      <div style={S.header}>
        <div>
          <h1 style={S.h1}>Vendor Applications</h1>
          <p style={S.subtitle}>Review, approve, and manage vendors on the Hustlecare marketplace</p>
        </div>
        <button style={S.createVendorBtn} onClick={openCreateVendor}>
          <Store size={14} /> Create Vendor
        </button>
      </div>

      {/* Pending appeals strip */}
      {pendingAppeals.length > 0 && (
        <div style={S.appealsStrip}>
          <div style={S.appealsStripHead}>
            <MessageSquare size={14} color="#fbbf24" />
            <span>{pendingAppeals.length} suspension appeal{pendingAppeals.length > 1 ? 's' : ''} awaiting review</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingAppeals.map(a => (
              <div key={a.id} style={S.appealRow}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#e2e2f0' }}>{a.businessName}</div>
                  <div style={{ fontSize: '0.76rem', color: '#55556e', marginTop: '0.1rem' }}>
                    Suspended: {a.vendor?.suspendReason ?? '—'}
                  </div>
                  {a.vendor?.appealMessage && (
                    <div style={S.appealQuote}>
                      {a.vendor.issueResolved && (
                        <span style={S.resolvedTag}><CheckSquare size={11} /> Vendor marked issue resolved</span>
                      )}
                      &ldquo;{a.vendor.appealMessage}&rdquo;
                      {a.vendor.appealedAt && <span style={{ color: '#3a3a56' }}> — {formatDate(a.vendor.appealedAt)}</span>}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button style={S.appealAcceptBtn} onClick={() => {
                    setAppealModal({ vendorId: a.vendor!.id, vendorName: a.businessName, suspendReason: a.vendor?.suspendReason ?? null, appealMessage: a.vendor?.appealMessage ?? null, issueResolved: a.vendor?.issueResolved, appealedAt: a.vendor?.appealedAt ?? null });
                    setAppealAction('accept');
                    setAppealResponse('');
                  }}>
                    <ShieldCheck size={12} /> Accept & Reinstate
                  </button>
                  <button style={S.appealDismissBtn} onClick={() => {
                    setAppealModal({ vendorId: a.vendor!.id, vendorName: a.businessName, suspendReason: a.vendor?.suspendReason ?? null, appealMessage: a.vendor?.appealMessage ?? null, issueResolved: a.vendor?.issueResolved, appealedAt: a.vendor?.appealedAt ?? null });
                    setAppealAction('dismiss');
                    setAppealResponse('');
                  }}>
                    <XCircle size={12} /> Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending claims strip */}
      {pendingClaims.length > 0 && (
        <div style={{ ...S.appealsStrip, background: 'rgba(16,185,129,0.05)', borderColor: 'rgba(16,185,129,0.18)' }}>
          <div style={{ ...S.appealsStripHead, color: '#34d399' }}>
            <Store size={14} color="#34d399" />
            <span>{pendingClaims.length} vendor claim{pendingClaims.length > 1 ? 's' : ''} awaiting review</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingClaims.map(a => (
              <div key={a.id} style={S.appealRow}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#e2e2f0' }}>{a.businessName}</div>
                  <div style={{ fontSize: '0.76rem', color: '#55556e', marginTop: '0.1rem' }}>
                    Claimed by: {a.vendor?.claimRequestedBy?.name ?? '—'} ({a.vendor?.claimRequestedBy?.email ?? '—'})
                  </div>
                  {a.vendor?.claimMessage && (
                    <div style={S.appealQuote}>&ldquo;{a.vendor.claimMessage}&rdquo;</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button style={S.appealAcceptBtn} onClick={() => { openClaimModal(a); setClaimAction('approve'); setClaimRejectionReason(''); }}>
                    <ShieldCheck size={12} /> Review Claim
                  </button>
                  <button style={S.appealDismissBtn} onClick={() => { openClaimModal(a); setClaimAction('reject'); setClaimRejectionReason(''); }}>
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats strip */}
      <div style={S.statsStrip}>
        {[
          { label: 'Total', value: applications.length, color: '#9494b0' },
          { label: 'Pending Review', value: counts.PENDING, color: '#fbbf24' },
          { label: 'Approved', value: counts.APPROVED, color: '#34d399' },
          { label: 'Unclaimed', value: counts.UNCLAIMED, color: '#818cf8' },
          { label: 'Claimed', value: counts.CLAIMED, color: '#34d399' },
          { label: 'Rejected', value: counts.REJECTED, color: '#f87171' },
        ].map(s => (
          <div key={s.label} style={S.statPill}>
            <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
            <span style={S.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={S.toolbar}>
        <div style={S.tabGroup}>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'UNCLAIMED', 'CLAIMED'] as const).map(f => (
            <button key={f} style={{ ...S.tab, ...(filter === f ? S.tabActive : {}) }}
              onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : STATUS_META[f].label}
              <span style={{
                ...S.tabCount,
                background: filter === f ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                color: filter === f ? '#fbbf24' : '#55556e',
              }}>
                {f === 'ALL' ? applications.length : counts[f]}
              </span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
          <input
            style={S.searchInput}
            placeholder="Search name, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.loadCenter}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#55556e' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={S.emptyState}>
            <Store size={28} style={{ color: '#3a3a56', marginBottom: '0.6rem' }} />
            <p style={{ color: '#55556e', fontSize: '0.84rem' }}>No applications match your filters</p>
          </div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Applicant</th>
                <th style={S.th}>Store</th>
                <th style={S.th}>Categories</th>
                <th style={S.th}>Products</th>
                <th style={S.th}>Applied</th>
                <th style={S.th}>Status</th>
                <th style={{ ...S.th, textAlign: 'right' as const }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(app => {
                const meta = STATUS_META[app.status];
                const isOpen = expanded === app.id;
                const vendorStatus = app.vendor?.status;
                const productCount = app.vendor?._count?.products ?? 0;
                const appealStatus = app.vendor?.appealStatus;
                const claimStatus = app.vendor?.claimStatus;
                const canManageVendor = !!app.vendor && (app.status === 'APPROVED' || app.status === 'UNCLAIMED' || app.status === 'CLAIMED');

                return (
                  <>
                    <tr key={app.id} style={S.tr} className="app-row" onClick={() => setExpanded(isOpen ? null : app.id)}>
                      {/* Applicant */}
                      <td style={S.td}>
                        {app.user ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            {app.user.image ? (
                              <Image src={app.user.image} alt={app.user.name} width={34} height={34} style={S.avatar} />
                            ) : (
                              <div style={S.avatarFallback}>{app.user.name[0]?.toUpperCase()}</div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <div style={S.userName}>{app.user.name}</div>
                              <div style={S.userEmail}>{app.user.email}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ ...S.avatarFallback, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                              <Store size={14} />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: '#55556e', fontStyle: 'italic' as const }}>
                              Admin created
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Store */}
                      <td style={S.td}>
                        <div style={S.bizName}>{app.businessName}</div>
                        <div style={S.bizSlug}>/vendors/{app.slug}</div>
                      </td>

                      {/* Categories */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {app.productCategories.slice(0, 2).map(c => (
                            <span key={c} style={S.catTag}>{c}</span>
                          ))}
                          {app.productCategories.length > 2 && (
                            <span style={{ ...S.catTag, color: '#55556e', background: 'rgba(255,255,255,0.04)' }}>
                              +{app.productCategories.length - 2}
                            </span>
                          )}
                          {app.productCategories.length === 0 && (
                            <span style={{ color: '#3a3a56', fontSize: '0.78rem' }}>—</span>
                          )}
                        </div>
                      </td>

                      {/* Products */}
                      <td style={S.td}>
                        {app.vendor ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' as const }}>
                            <Package size={13} style={{ color: productCount > 0 ? '#818cf8' : '#3a3a56' }} />
                            <span style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: '0.85rem',
                              color: productCount > 0 ? '#e2e2f0' : '#3a3a56',
                              fontWeight: 700,
                            }}>
                              {productCount}
                            </span>
                            {vendorStatus && (
                              <span style={{
                                ...S.vendorStatusBadge,
                                background: VENDOR_STATUS_META[vendorStatus]?.bg ?? 'rgba(255,255,255,0.05)',
                                color: VENDOR_STATUS_META[vendorStatus]?.color ?? '#9494b0',
                              }}>
                                {VENDOR_STATUS_META[vendorStatus]?.label ?? vendorStatus}
                              </span>
                            )}
                            {appealStatus === 'PENDING' && (
                              <span style={S.appealBadge} title="Appeal pending review">
                                <MessageSquare size={10} /> Appeal
                              </span>
                            )}
                            {claimStatus === 'PENDING' && (
                              <span
                                style={{ ...S.appealBadge, background: 'rgba(16,185,129,0.1)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)' }}
                                title="Claim pending review"
                              >
                                <Store size={10} /> Claim
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: '#3a3a56', fontSize: '0.78rem' }}>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={S.td}>
                        <span style={{ fontSize: '0.78rem', color: '#55556e' }}>
                          {new Date(app.createdAt).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={S.td}>
                        <span style={{ ...S.statusBadge, background: meta.bg, color: meta.color, borderColor: meta.border }}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ ...S.td, textAlign: 'right' as const }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem' }}>
                          {app.status === 'PENDING' && (
                            <>
                              <button style={S.approveBtn} onClick={() => { setReviewModal({ id: app.id, action: 'approve' }); setReviewNote(''); }}>
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button style={S.rejectBtn} onClick={() => { setReviewModal({ id: app.id, action: 'reject' }); setReviewNote(''); }}>
                                <XCircle size={12} /> Reject
                              </button>
                            </>
                          )}

                          {/* Vendor management actions — for approved/unclaimed/claimed vendors */}
                          {canManageVendor && (
                            <>
                              <a href={`/vendors/${app.vendor!.slug}`} target="_blank" style={S.iconBtn} title="View storefront">
                                <Eye size={13} />
                              </a>
                              <button style={S.iconBtn} title="Edit vendor" onClick={() => openEditVendor(app.vendor!)}>
                                <Pencil size={13} />
                              </button>
                              {vendorStatus === 'SUSPENDED' ? (
                                <button style={{ ...S.iconBtn, color: '#34d399', borderColor: 'rgba(16,185,129,0.2)' }}
                                  title="Reinstate vendor"
                                  onClick={() => { setActionModal({ vendorId: app.vendor!.id, vendorName: app.businessName, action: 'unsuspend' }); setActionNote(''); }}>
                                  <ShieldCheck size={13} />
                                </button>
                              ) : (
                                <button style={{ ...S.iconBtn, color: '#fbbf24', borderColor: 'rgba(245,158,11,0.2)' }}
                                  title="Suspend vendor"
                                  onClick={() => { setActionModal({ vendorId: app.vendor!.id, vendorName: app.businessName, action: 'suspend' }); setActionNote(''); }}>
                                  <ShieldOff size={13} />
                                </button>
                              )}
                              <button style={{ ...S.iconBtn, color: '#f87171', borderColor: 'rgba(239,68,68,0.15)' }}
                                title="Delete vendor"
                                onClick={() => { setActionModal({ vendorId: app.vendor!.id, vendorName: app.businessName, action: 'delete' }); setActionNote(''); }}>
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}

                          <button style={{ ...S.iconBtn, marginLeft: '0.1rem' }}>
                            {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isOpen && (
                      <tr key={`${app.id}-detail`}>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={S.detailPanel}>
                            <div style={S.detailGrid}>
                              {app.description && (
                                <div>
                                  <div style={S.detailLabel}>Description</div>
                                  <p style={S.detailText}>{app.description}</p>
                                </div>
                              )}
                              {app.pitchNote && (
                                <div>
                                  <div style={S.detailLabel}>Why Hustlecare?</div>
                                  <p style={S.detailText}>{app.pitchNote}</p>
                                </div>
                              )}
                              <div>
                                <div style={S.detailLabel}>Contact</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                  {app.website && (
                                    <a href={app.website} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#818cf8', fontSize: '0.82rem', textDecoration: 'none' }}>
                                      <Globe size={12} /> {app.website.replace(/^https?:\/\//, '')}
                                    </a>
                                  )}
                                  {app.location && <span style={{ fontSize: '0.82rem', color: '#9494b0' }}>{app.location}</span>}
                                  {app.phone && <span style={{ fontSize: '0.82rem', color: '#9494b0' }}>{app.phone}</span>}
                                  {!app.website && !app.location && !app.phone && (
                                    <span style={{ fontSize: '0.82rem', color: '#3a3a56' }}>—</span>
                                  )}
                                </div>
                              </div>
                              {app.reviewNote && (
                                <div>
                                  <div style={S.detailLabel}>Admin Note</div>
                                  <p style={{
                                    ...S.detailText,
                                    color: app.status === 'REJECTED' ? '#f87171' : '#34d399',
                                  }}>
                                    {app.reviewNote}
                                  </p>
                                </div>
                              )}

                              {/* Suspension / appeal details */}
                              {vendorStatus === 'SUSPENDED' && (
                                <div>
                                  <div style={S.detailLabel}>Suspension</div>
                                  <p style={{ ...S.detailText, color: '#f87171' }}>{app.vendor?.suspendReason ?? '—'}</p>
                                  {appealStatus && appealStatus !== 'NONE' && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                      <span style={{
                                        ...S.appealBadge,
                                        background: appealStatus === 'PENDING' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
                                        color: appealStatus === 'PENDING' ? '#fbbf24' : '#f87171',
                                        borderColor: appealStatus === 'PENDING' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.18)',
                                      }}>
                                        {appealStatus === 'PENDING' ? 'Appeal pending' : 'Appeal dismissed'}
                                      </span>
                                      {app.vendor?.appealMessage && (
                                        <p style={{ ...S.detailText, marginTop: '0.4rem', fontStyle: 'italic' }}>
                                          &ldquo;{app.vendor.appealMessage}&rdquo;
                                        </p>
                                      )}
                                      {appealStatus === 'PENDING' && (
                                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                                          <button style={S.appealAcceptBtn} onClick={() => {
                                            setAppealModal({ vendorId: app.vendor!.id, vendorName: app.businessName, suspendReason: app.vendor?.suspendReason ?? null, appealMessage: app.vendor?.appealMessage ?? null, issueResolved: app.vendor?.issueResolved, appealedAt: app.vendor?.appealedAt ?? null });
                                            setAppealAction('accept');
                                            setAppealResponse('');
                                          }}>
                                            <ShieldCheck size={12} /> Accept & Reinstate
                                          </button>
                                          <button style={S.appealDismissBtn} onClick={() => {
                                            setAppealModal({ vendorId: app.vendor!.id, vendorName: app.businessName, suspendReason: app.vendor?.suspendReason ?? null, appealMessage: app.vendor?.appealMessage ?? null, issueResolved: app.vendor?.issueResolved, appealedAt: app.vendor?.appealedAt ?? null });
                                            setAppealAction('dismiss');
                                            setAppealResponse('');
                                          }}>
                                            <XCircle size={12} /> Dismiss
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Claim details */}
                              {claimStatus && claimStatus !== 'NONE' && (
                                <div>
                                  <div style={S.detailLabel}>Claim Request</div>
                                  <p style={{ ...S.detailText }}>
                                    {app.vendor?.claimRequestedBy?.name ?? 'Unknown'} ({app.vendor?.claimRequestedBy?.email ?? '—'})
                                  </p>
                                  {app.vendor?.claimMessage && (
                                    <p style={{ ...S.detailText, marginTop: '0.3rem', fontStyle: 'italic' }}>
                                      &ldquo;{app.vendor.claimMessage}&rdquo;
                                    </p>
                                  )}
                                  {claimStatus === 'PENDING' && (
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                                      <button style={S.appealAcceptBtn} onClick={() => { openClaimModal(app); setClaimAction('approve'); setClaimRejectionReason(''); }}>
                                        <ShieldCheck size={12} /> Review Claim
                                      </button>
                                      <button style={S.appealDismissBtn} onClick={() => { openClaimModal(app); setClaimAction('reject'); setClaimRejectionReason(''); }}>
                                        <XCircle size={12} /> Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
        <div style={S.tableFooter}>
          Showing <strong style={{ color: '#9494b0' }}>{filtered.length}</strong> of{' '}
          <strong style={{ color: '#9494b0' }}>{applications.length}</strong> applications
        </div>
      </div>

      {/* Approve/Reject modal */}
      {reviewModal && (
        <div style={S.overlay} onClick={() => setReviewModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: reviewModal.action === 'approve' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              }}>
                {reviewModal.action === 'approve'
                  ? <CheckCircle2 size={24} color="#34d399" />
                  : <XCircle size={24} color="#f87171" />}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.35rem' }}>
                {reviewModal.action === 'approve' ? 'Approve Application' : 'Reject Application'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#9494b0', lineHeight: 1.6 }}>
                {reviewModal.action === 'approve'
                  ? 'Creates the vendor profile and grants vendor access immediately.'
                  : 'The applicant can reapply with updated information.'}
              </p>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={S.modalLabel}>
                Note to applicant <span style={{ fontWeight: 400, color: '#3a3a56' }}>(optional)</span>
              </label>
              <textarea style={S.modalTextarea} rows={3}
                placeholder={reviewModal.action === 'approve' ? 'Welcome message…' : 'Reason for rejection…'}
                value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button style={S.cancelBtn} onClick={() => setReviewModal(null)}>Cancel</button>
              <button style={{
                ...S.confirmBtn,
                background: reviewModal.action === 'approve'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(239,68,68,0.15)',
                color: reviewModal.action === 'approve' ? '#fff' : '#f87171',
                boxShadow: reviewModal.action === 'approve' ? '0 4px 14px rgba(16,185,129,0.25)' : 'none',
              }} onClick={handleReview} disabled={submitting}>
                {submitting && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {reviewModal.action === 'approve' ? 'Approve Vendor' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/Delete vendor modal */}
      {actionModal && (
        <div style={S.overlay} onClick={() => setActionModal(null)}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: actionModal.action === 'delete'
                  ? 'rgba(239,68,68,0.12)'
                  : actionModal.action === 'suspend'
                    ? 'rgba(245,158,11,0.12)'
                    : 'rgba(16,185,129,0.12)',
              }}>
                {actionModal.action === 'delete' && <Trash2 size={22} color="#f87171" />}
                {actionModal.action === 'suspend' && <ShieldOff size={22} color="#fbbf24" />}
                {actionModal.action === 'unsuspend' && <ShieldCheck size={22} color="#34d399" />}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.35rem' }}>
                {actionModal.action === 'delete' && `Delete "${actionModal.vendorName}"?`}
                {actionModal.action === 'suspend' && `Suspend "${actionModal.vendorName}"?`}
                {actionModal.action === 'unsuspend' && `Reinstate "${actionModal.vendorName}"?`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#9494b0', lineHeight: 1.6 }}>
                {actionModal.action === 'delete' && 'The vendor profile will be permanently removed. Their products will be archived. This cannot be undone.'}
                {actionModal.action === 'suspend' && 'The vendor\'s storefront and products will be hidden from the marketplace. They cannot add new products.'}
                {actionModal.action === 'unsuspend' && 'The vendor\'s storefront and active products will be restored to the marketplace.'}
              </p>
            </div>

            {actionModal.action !== 'unsuspend' && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={S.modalLabel}>
                  {actionModal.action === 'suspend' ? 'Reason for suspension' : 'Note'}
                  {actionModal.action === 'suspend' && <span style={{ color: '#f87171' }}> *</span>}
                  {actionModal.action === 'delete' && <span style={{ fontWeight: 400, color: '#3a3a56' }}> (optional)</span>}
                </label>
                <textarea style={S.modalTextarea} rows={3}
                  placeholder={actionModal.action === 'suspend'
                    ? 'Explain why this vendor is being suspended…'
                    : 'Any notes about this deletion…'}
                  value={actionNote} onChange={e => setActionNote(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
              <button style={S.cancelBtn} onClick={() => setActionModal(null)}>Cancel</button>
              <button style={{
                ...S.confirmBtn,
                background: actionModal.action === 'unsuspend'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : actionModal.action === 'suspend'
                    ? 'rgba(245,158,11,0.15)'
                    : 'rgba(239,68,68,0.15)',
                color: actionModal.action === 'unsuspend' ? '#fff'
                  : actionModal.action === 'suspend' ? '#fbbf24' : '#f87171',
              }}
                onClick={handleVendorAction}
                disabled={actionSubmitting || (actionModal.action === 'suspend' && !actionNote.trim())}>
                {actionSubmitting && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {actionModal.action === 'delete' && 'Delete Vendor'}
                {actionModal.action === 'suspend' && 'Suspend Vendor'}
                {actionModal.action === 'unsuspend' && 'Reinstate Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appeal resolution modal */}
      {appealModal && appealAction && (
        <div style={S.overlay} onClick={() => { setAppealModal(null); setAppealAction(null); }}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: appealAction === 'accept' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              }}>
                {appealAction === 'accept'
                  ? <ShieldCheck size={24} color="#34d399" />
                  : <XCircle size={24} color="#f87171" />}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.35rem' }}>
                {appealAction === 'accept' ? `Reinstate "${appealModal.vendorName}"?` : `Dismiss appeal from "${appealModal.vendorName}"?`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#9494b0', lineHeight: 1.6 }}>
                {appealAction === 'accept'
                  ? 'The vendor\'s status will be set to Active, their storefront and products restored, and the appeal cleared.'
                  : 'The vendor remains suspended. They\'ll see your response and can submit a new appeal.'}
              </p>
            </div>

            {/* Context */}
            <div style={S.appealContext}>
              <div style={S.detailLabel}>Suspension reason</div>
              <p style={{ ...S.detailText, color: '#f87171', marginBottom: '0.6rem' }}>{appealModal.suspendReason ?? '—'}</p>
              {appealModal.issueResolved && (
                <span style={S.resolvedTag}><CheckSquare size={11} /> Vendor marked issue resolved</span>
              )}
              <div style={S.detailLabel}>Vendor&apos;s appeal</div>
              <p style={{ ...S.detailText, fontStyle: 'italic' }}>&ldquo;{appealModal.appealMessage ?? '—'}&rdquo;</p>
              {appealModal.appealedAt && (
                <p style={{ fontSize: '0.72rem', color: '#3a3a56', marginTop: '0.3rem' }}>Submitted {formatDate(appealModal.appealedAt)}</p>
              )}
            </div>

            {appealAction === 'dismiss' && (
              <div style={{ margin: '1.25rem 0' }}>
                <label style={S.modalLabel}>
                  Response to vendor <span style={{ color: '#f87171' }}>*</span>
                </label>
                <textarea style={S.modalTextarea} rows={3}
                  placeholder="Explain why the appeal is being dismissed and what they still need to do…"
                  value={appealResponse} onChange={e => setAppealResponse(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button style={S.cancelBtn} onClick={() => { setAppealModal(null); setAppealAction(null); }}>Cancel</button>
              <button style={{
                ...S.confirmBtn,
                background: appealAction === 'accept'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(239,68,68,0.15)',
                color: appealAction === 'accept' ? '#fff' : '#f87171',
                boxShadow: appealAction === 'accept' ? '0 4px 14px rgba(16,185,129,0.25)' : 'none',
              }}
                onClick={handleAppealResolve}
                disabled={appealSubmitting || (appealAction === 'dismiss' && !appealResponse.trim())}>
                {appealSubmitting && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {appealAction === 'accept' ? 'Accept & Reinstate' : 'Dismiss Appeal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim resolution modal — with cross-check panel */}
      {claimModal && claimAction && (
        <div style={S.overlay} onClick={() => { setClaimModal(null); setClaimAction(null); }}>
          <div style={S.modal} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.85rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: claimAction === 'approve' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              }}>
                {claimAction === 'approve'
                  ? <ShieldCheck size={24} color="#34d399" />
                  : <XCircle size={24} color="#f87171" />}
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.35rem' }}>
                {claimAction === 'approve'
                  ? `Transfer "${claimModal.vendorName}" to ${claimModal.claimantName}?`
                  : `Reject claim from ${claimModal.claimantName}?`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#9494b0', lineHeight: 1.6 }}>
                {claimAction === 'approve'
                  ? 'This gives full ownership and dashboard access to this account.'
                  : 'The vendor profile stays unclaimed and available for future claim requests.'}
              </p>
            </div>

            {/* Cross-check panel */}
            <ClaimCrossCheck
              vendorPhone={claimModal.vendorPhone}
              vendorWebsite={claimModal.vendorWebsite}
              claimantEmail={claimModal.claimantEmail}
              claimantPhone={claimModal.claimantPhone}
            />

            <div style={{ ...S.appealContext, marginTop: '0.85rem' }}>
              <div style={S.detailLabel}>Requested by</div>
              <p style={{ ...S.detailText, marginBottom: '0.6rem' }}>
                {claimModal.claimantName} &middot; {claimModal.claimantEmail}
                {claimModal.claimantPhone ? ` · ${claimModal.claimantPhone}` : ''}
              </p>
              <div style={S.detailLabel}>Message</div>
              <p style={{ ...S.detailText, fontStyle: 'italic' }}>&ldquo;{claimModal.claimMessage ?? '—'}&rdquo;</p>
            </div>

            {claimAction === 'reject' && (
              <div style={{ margin: '1.25rem 0' }}>
                <label style={S.modalLabel}>
                  Reason for rejection <span style={{ color: '#f87171' }}>*</span>
                </label>
                <textarea style={S.modalTextarea} rows={3}
                  placeholder="Explain why this claim wasn't approved…"
                  value={claimRejectionReason} onChange={e => setClaimRejectionReason(e.target.value)} />
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button style={S.cancelBtn} onClick={() => { setClaimModal(null); setClaimAction(null); }}>Cancel</button>
              <button style={{
                ...S.confirmBtn,
                background: claimAction === 'approve'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'rgba(239,68,68,0.15)',
                color: claimAction === 'approve' ? '#fff' : '#f87171',
                boxShadow: claimAction === 'approve' ? '0 4px 14px rgba(16,185,129,0.25)' : 'none',
              }}
                onClick={handleClaimResolve}
                disabled={claimSubmitting || (claimAction === 'reject' && !claimRejectionReason.trim())}>
                {claimSubmitting && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
                {claimAction === 'approve' ? 'Approve & Transfer' : 'Reject Claim'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit vendor modal */}
      {vendorFormOpen && (
        <VendorFormModal
          vendor={editingVendor}
          onClose={() => setVendorFormOpen(false)}
          onSaved={() => {
            setVendorFormOpen(false);
            fetchApplications();
            toast.success(editingVendor ? 'Vendor updated' : 'Vendor created and live');
          }}
        />
      )}
    </div>
  );
}

/* ── Claim cross-check panel ────────────────────────────────────── */
function ClaimCrossCheck({
  vendorPhone,
  vendorWebsite,
  claimantEmail,
  claimantPhone,
}: {
  vendorPhone: string | null;
  vendorWebsite: string | null;
  claimantEmail: string;
  claimantPhone: string | null;
}) {
  const vendorDomain = websiteDomain(vendorWebsite);
  const claimantDomain = emailDomain(claimantEmail);
  const domainMatch = !!vendorDomain && !!claimantDomain && vendorDomain === claimantDomain;
  const domainKnown = !!vendorDomain;

  const phoneMatch = !!vendorPhone && !!claimantPhone && normalizePhone(vendorPhone) === normalizePhone(claimantPhone);
  const phoneKnown = !!vendorPhone && !!claimantPhone;

  const rows = [
    {
      label: 'Email domain vs. vendor website',
      known: domainKnown,
      match: domainMatch,
      detail: domainKnown
        ? `${claimantDomain || '—'} vs. ${vendorDomain}`
        : 'No website on file to compare against.',
    },
    {
      label: 'Phone number vs. vendor phone',
      known: phoneKnown,
      match: phoneMatch,
      detail: phoneKnown
        ? `${claimantPhone} vs. ${vendorPhone}`
        : !vendorPhone
          ? 'No phone on file for this vendor.'
          : 'Claimant has no phone number on their account.',
    },
  ];

  return (
    <div style={S.crossCheckBox}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
        <AlertTriangle size={13} color="#fbbf24" />
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#e2e2f0', textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
          Identity cross-check
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map(row => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            {!row.known ? (
              <span style={{ ...S.crossCheckIcon, background: 'rgba(148,148,176,0.12)', color: '#9494b0' }}>?</span>
            ) : row.match ? (
              <span style={{ ...S.crossCheckIcon, background: 'rgba(16,185,129,0.15)', color: '#34d399' }}><Check size={11} /></span>
            ) : (
              <span style={{ ...S.crossCheckIcon, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}><XCircle size={11} /></span>
            )}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e2f0' }}>{row.label}</div>
              <div style={{ fontSize: '0.74rem', color: '#6a6a86', marginTop: '0.1rem' }}>{row.detail}</div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.7rem', color: '#55556e', marginTop: '0.7rem', marginBottom: 0, lineHeight: 1.5 }}>
        This is a heuristic, not proof — a mismatch doesn&rsquo;t mean the claim is false, and a match doesn&rsquo;t guarantee it&rsquo;s genuine. Use it alongside the claimant&rsquo;s message and, ideally, a direct check via the vendor&rsquo;s phone number on file.
      </p>
    </div>
  );
}

/* ── Create / Edit Vendor Modal ─────────────────────────────────── */

function VendorFormModal({
  vendor,
  onClose,
  onSaved,
}: {
  vendor: VendorDetail | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!vendor;
  const [form, setForm] = useState(() => vendor ? {
    name: vendor.name ?? '',
    slug: vendor.slug ?? '',
    tagline: vendor.tagline ?? '',
    logo: vendor.logo ?? '',
    description: vendor.description ?? '',
    website: vendor.website ?? '',
    location: vendor.location ?? '',
    phone: vendor.phone ?? '',
    twitterUrl: vendor.twitterUrl ?? '',
    instagramUrl: vendor.instagramUrl ?? '',
    facebookUrl: vendor.facebookUrl ?? '',
    linkedinUrl: vendor.linkedinUrl ?? '',
  } : EMPTY_VENDOR_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleSubmit() {
    if (!form.name.trim()) { setError('Business name is required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const url = isEdit ? `/api/admin/vendors/${vendor!.id}` : '/api/vendors';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to ${isEdit ? 'update' : 'create'} vendor.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{ ...S.modal, maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', margin: '0 auto 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(99,102,241,0.12)' }}>
            {isEdit ? <Pencil size={20} color="#818cf8" /> : <Store size={22} color="#818cf8" />}
          </div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.35rem' }}>
            {isEdit ? `Edit "${vendor!.name}"` : 'Create Vendor Profile'}
          </h3>
          <p style={{ fontSize: '0.8rem', color: '#9494b0', lineHeight: 1.6 }}>
            {isEdit
              ? 'Changes apply immediately to the live storefront.'
              : 'Live immediately, no email needed. You can hand this over to a real vendor to claim later.'}
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '1rem', padding: '0.6rem 0.85rem', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}

        <div style={{ maxHeight: '58vh', overflowY: 'auto' as const, paddingRight: '0.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div>
              <label style={S.modalLabel}>Business name <span style={{ color: '#f87171' }}>*</span></label>
              <input style={S.modalInput} placeholder="e.g. Nairobi Hardware Supplies" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div>
              <label style={S.modalLabel}>Store URL slug</label>
              <input style={S.modalInput} placeholder="auto-generated if left blank" value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: '0.9rem' }}>
            <label style={S.modalLabel}>Tagline</label>
            <input style={S.modalInput} placeholder="e.g. Quality tools at fair prices" maxLength={120}
              value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
          </div>

          <div style={{ marginBottom: '0.9rem' }}>
            <label style={S.modalLabel}>Description</label>
            <textarea style={S.modalTextarea} rows={3}
              placeholder="What this vendor sells, their story, why entrepreneurs should buy from them…"
              value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div>
              <label style={S.modalLabel}><Globe size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Website</label>
              <input style={S.modalInput} placeholder="https://…" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <label style={S.modalLabel}>Logo URL</label>
              <input style={S.modalInput} placeholder="https://…" value={form.logo}
                onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div>
              <label style={S.modalLabel}><MapPin size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Location</label>
              <input style={S.modalInput} placeholder="e.g. Industrial Area, Nairobi" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label style={S.modalLabel}><Phone size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Phone</label>
              <input style={S.modalInput} placeholder="+254 700 000 000" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: '0.5rem', fontSize: '0.68rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
            Social Links <span style={{ fontWeight: 400, fontStyle: 'italic' as const, color: '#3a3a56' }}>optional</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={S.modalLabel}><Twitter size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Twitter / X</label>
              <input style={S.modalInput} placeholder="https://x.com/…" value={form.twitterUrl}
                onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))} />
            </div>
            <div>
              <label style={S.modalLabel}><Instagram size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Instagram</label>
              <input style={S.modalInput} placeholder="https://instagram.com/…" value={form.instagramUrl}
                onChange={e => setForm(f => ({ ...f, instagramUrl: e.target.value }))} />
            </div>
            <div>
              <label style={S.modalLabel}><Facebook size={11} style={{ verticalAlign: -1, marginRight: 4 }} />Facebook</label>
              <input style={S.modalInput} placeholder="https://facebook.com/…" value={form.facebookUrl}
                onChange={e => setForm(f => ({ ...f, facebookUrl: e.target.value }))} />
            </div>
            <div>
              <label style={S.modalLabel}><Linkedin size={11} style={{ verticalAlign: -1, marginRight: 4 }} />LinkedIn</label>
              <input style={S.modalInput} placeholder="https://linkedin.com/…" value={form.linkedinUrl}
                onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button style={S.cancelBtn} onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            style={{ ...S.confirmBtn, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
            {isEdit ? 'Save Changes' : 'Create Vendor'}
          </button>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  a { text-decoration: none; color: inherit; }
  .app-row { cursor: pointer; }
  .app-row:hover td { background: rgba(255,255,255,0.02) !important; }
`;

const S: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' as const },
  h1: { fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.2rem' },
  subtitle: { fontSize: '0.83rem', color: '#55556e' },
  createVendorBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: 9, background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: '#fff', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 700, flexShrink: 0 },

  appealsStrip: { background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, padding: '1rem 1.1rem', marginBottom: '1.25rem' },
  appealsStripHead: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.75rem' },
  appealRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.85rem', padding: '0.75rem 0.9rem', borderRadius: 9, background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' as const },
  appealQuote: { fontSize: '0.78rem', color: '#9494b0', lineHeight: 1.6, marginTop: '0.35rem', fontStyle: 'italic' as const },
  resolvedTag: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.12rem 0.5rem', borderRadius: 100, fontSize: '0.66rem', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#34d399', marginBottom: '0.4rem' },
  appealBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.12rem 0.45rem', borderRadius: 100, fontSize: '0.66rem', fontWeight: 700, marginLeft: '0.25rem', background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' },
  appealAcceptBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', borderRadius: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '0.74rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const },
  appealDismissBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.7rem', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: '0.74rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' as const },
  appealContext: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '0.85rem 1rem' },

  crossCheckBox: { background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 10, padding: '0.85rem 1rem' },
  crossCheckIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', fontSize: '0.66rem', fontWeight: 700, flexShrink: 0, marginTop: '0.1rem' },

  statsStrip: { display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  statPill: { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 1rem', borderRadius: 100, background: '#13131a', border: '1px solid rgba(255,255,255,0.07)' },
  statValue: { fontFamily: "'DM Mono', monospace", fontSize: '1.1rem', fontWeight: 700 },
  statLabel: { fontSize: '0.75rem', color: '#55556e' },
  toolbar: { display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' },
  tabGroup: { display: 'flex', gap: '0.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.2rem', flexWrap: 'wrap' as const },
  tab: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.85rem', borderRadius: 7, border: 'none', background: 'transparent', color: '#55556e', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s', whiteSpace: 'nowrap' },
  tabActive: { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.2)' },
  tabCount: { padding: '0.08rem 0.4rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700 },
  searchInput: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 9, padding: '0.48rem 0.85rem 0.48rem 2.1rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', outline: 'none', width: 220 },
  tableWrap: { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '0.65rem 1rem', textAlign: 'left' as const, fontSize: '0.7rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase' as const, letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#13131a', whiteSpace: 'nowrap' as const },
  td: { padding: '0.85rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)', verticalAlign: 'middle' },
  tr: { transition: 'background 0.15s' },
  loadCenter: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' },
  emptyState: { textAlign: 'center' as const, padding: '3rem', color: '#55556e' },
  tableFooter: { padding: '0.65rem 1.1rem', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', color: '#55556e' },
  avatar: { width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' as const, flexShrink: 0 },
  avatarFallback: { width: 34, height: 34, borderRadius: '50%', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.84rem', fontWeight: 700, flexShrink: 0 },
  userName: { fontSize: '0.84rem', fontWeight: 600, color: '#f0f0f5', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
  userEmail: { fontSize: '0.72rem', color: '#55556e', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 },
  bizName: { fontSize: '0.86rem', fontWeight: 700, color: '#e2e2f0', marginBottom: '0.1rem' },
  bizSlug: { fontSize: '0.7rem', color: '#55556e', fontFamily: "'DM Mono', monospace" },
  catTag: { display: 'inline-flex', padding: '0.15rem 0.5rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#818cf8' },
  vendorStatusBadge: { display: 'inline-flex', padding: '0.12rem 0.45rem', borderRadius: 100, fontSize: '0.66rem', fontWeight: 700, marginLeft: '0.25rem' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.22rem 0.65rem', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, border: '1px solid' },
  approveBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: 7, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: '0.74rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600 },
  rejectBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.65rem', borderRadius: 7, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: '0.74rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 600 },
  iconBtn: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' },
  detailPanel: { padding: '1rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' },
  detailGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' },
  detailLabel: { fontSize: '0.68rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: '0.35rem' },
  detailText: { fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.6, margin: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' },
  modal: { background: '#1a1a24', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, padding: '1.75rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' as const, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  modalLabel: { display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9494b0', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  modalTextarea: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.65rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem', outline: 'none', resize: 'none' as const, lineHeight: 1.6 },
  modalInput: { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.84rem', outline: 'none', height: 38, boxSizing: 'border-box' as const },
  cancelBtn: { padding: '0.55rem 1.1rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.84rem', fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' },
  confirmBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.25rem', borderRadius: 9, fontSize: '0.84rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, border: 'none', cursor: 'pointer' },
};