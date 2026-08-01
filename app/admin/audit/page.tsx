/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Download, Clock, X, Activity, ChevronLeft, ChevronRight, User as UserIcon,
} from 'lucide-react';
import Image from 'next/image';

/* ─── Types ───────────────────────────────────────────────────── */
type AuditItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  user: string;
  userImage: string | null;
  timestamp: string;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
};
type AuditResponse = {
  items: AuditItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

// Mirrors AuditAction / AuditEntity in lib/admin-utils.ts.
// No shared constants module exists yet — if those change, update both places.
const AUDIT_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'APPROVE', 'REJECT', 'SEND', 'BULK_UPDATE'] as const;
const AUDIT_ENTITIES = ['Business', 'Product', 'Requirement', 'Vendor', 'User', 'Comment', 'Review', 'LegalFeeSchedule', 'TradeClass'] as const;

/* ─── Styles ──────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .u-input {
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
    border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem;
    color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem;
    outline:none; transition:border-color 0.2s, box-shadow 0.2s; width:100%;
  }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select {
    background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
    border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem;
    color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem;
    outline:none; cursor:pointer; appearance:none;
    background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 0.7rem center;
  }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.83rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-success { background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.25); }
  .btn-success:hover { background:rgba(16,185,129,0.25); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .btn:disabled { opacity:0.4; cursor:not-allowed; }

  .u-table { width:100%; border-collapse:collapse; }
  .u-table th {
    padding:0.65rem 1rem; text-align:left; font-size:0.7rem;
    font-weight:700; color:#55556e; text-transform:uppercase;
    letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06);
    white-space:nowrap; background:#13131a;
  }
  .u-table td {
    padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04);
    vertical-align:middle;
  }
  .u-table tbody tr { transition:background 0.15s; }
  .u-table tbody tr.expandable { cursor:pointer; }
  .u-table tbody tr.expandable:hover { background:rgba(255,255,255,0.025); }

  .avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.78rem; color:#fff; flex-shrink:0; }
  .ab { display:inline-flex; align-items:center; padding:0.2rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:700; letter-spacing:0.04em; }

  .u-scroll::-webkit-scrollbar { width:4px; height:4px; }
  .u-scroll::-webkit-scrollbar-track { background:transparent; }
  .u-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

  .skel { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

const ACTION_BADGE: Record<string, { bg: string; color: string }> = {
  CREATE:      { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
  UPDATE:      { bg: 'rgba(99,102,241,0.12)',  color: '#818cf8' },
  DELETE:      { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  VIEW:        { bg: 'rgba(148,148,176,0.12)', color: '#9494b0' },
  EXPORT:      { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24' },
  APPROVE:     { bg: 'rgba(16,185,129,0.12)',  color: '#34d399' },
  REJECT:      { bg: 'rgba(239,68,68,0.12)',   color: '#f87171' },
  SEND:        { bg: 'rgba(20,184,166,0.12)',  color: '#2dd4bf' },
  BULK_UPDATE: { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa' },
};

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/* ─── Main ────────────────────────────────────────────────────── */
export default function AuditLogPage() {
  const [data, setData]             = useState<AuditResponse | null>(null);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [action, setAction]         = useState('');
  const [entity, setEntity]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (search)   params.set('search', search);
    if (action)   params.set('action', action);
    if (entity)   params.set('entity', entity);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo)   params.set('dateTo', dateTo);

    try {
      const r = await fetch(`/api/admin/audit?${params.toString()}`);
      if (r.ok) setData(await r.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, action, entity, dateFrom, dateTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useEffect(() => { setPage(1); }, [search, action, entity, dateFrom, dateTo]);

  const hasFilters = !!(search || action || entity || dateFrom || dateTo);
  function clearFilters() {
    setSearch(''); setAction(''); setEntity(''); setDateFrom(''); setDateTo('');
  }

  // Exports only the currently loaded page (server caps each call at 100 rows;
  // for a full export across all matching results you'd need a dedicated
  // server-side export endpoint that pages through results).
  function handleExport() {
    if (!data || data.items.length === 0) return;
    const rows = [
      ['Time', 'Action', 'Entity', 'Entity ID', 'User', 'IP Address'],
      ...data.items.map(i => [
        i.timestamp, i.action, i.entity, i.entityId, i.user, i.ipAddress || '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `audit-log-page${page}-${new Date().toISOString()}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Audit Log</h1>
            <p style={{ fontSize: '0.84rem', color: '#55556e' }}>Full history of admin and privileged user actions across the platform.</p>
          </div>
          <button className="btn btn-success" onClick={handleExport} disabled={!data || data.items.length === 0}>
            <Download size={14} />Export page
          </button>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by user, entity ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="u-input"
            />
          </div>
          <select value={action} onChange={e => setAction(e.target.value)} className="u-select">
            <option value="">All Actions</option>
            {AUDIT_ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={entity} onChange={e => setEntity(e.target.value)} className="u-select">
            <option value="">All Entities</option>
            {AUDIT_ENTITIES.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="u-select"
            style={{ paddingLeft: '0.85rem', colorScheme: 'dark' }}
          />
          <span style={{ color: '#55556e', fontSize: '0.8rem' }}>to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="u-select"
            style={{ paddingLeft: '0.85rem', colorScheme: 'dark' }}
          />
          {hasFilters && (
            <button className="btn btn-ghost" style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }} onClick={clearFilters}>
              <X size={13} />Clear
            </button>
          )}
        </div>

        {/* ── Table ── */}
        <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
          <div className="u-scroll" style={{ overflowX: 'auto' }}>
            <table className="u-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.25rem' }}>Time</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>User</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skel-${i}`}>
                      <td colSpan={5} style={{ padding: '0.9rem 1.25rem' }}>
                        <div className="skel" style={{ height: 16, width: '100%' }} />
                      </td>
                    </tr>
                  ))
                ) : !data || data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#3a3a56' }}>
                      <Activity size={36} style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#55556e' }}>
                        {hasFilters ? 'No entries match your filters' : 'No audit log entries yet'}
                      </div>
                    </td>
                  </tr>
                ) : data.items.map(item => {
                  const badge = ACTION_BADGE[item.action] ?? { bg: 'rgba(148,148,176,0.12)', color: '#9494b0' };
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className="expandable"
                        onClick={() => item.changes && setExpandedId(isExpanded ? null : item.id)}
                      >
                        <td style={{ paddingLeft: '1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#9494b0' }}>
                            <Clock size={11} style={{ flexShrink: 0 }} />
                            {fmtDateTime(item.timestamp)}
                          </div>
                        </td>
                        <td>
                          <span className="ab" style={{ background: badge.bg, color: badge.color }}>{item.action}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.entity}</div>
                          <div style={{ fontSize: '0.74rem', color: '#55556e' }}>{item.entityId}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            {item.userImage ? (
                              <Image
                                src={item.userImage}
                                alt={item.user}
                                width={30}
                                height={30}
                                style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)' }}
                              />
                            ) : (
                              <div className="avatar" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}>
                                {item.user[0]?.toUpperCase()}
                              </div>
                            )}
                            <span style={{ fontSize: '0.83rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              <UserIcon size={11} style={{ color: '#55556e' }} />{item.user}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="adm-mono" style={{ fontSize: '0.76rem', color: '#55556e' }}>{item.ipAddress || '—'}</span>
                        </td>
                      </tr>
                      {isExpanded && item.changes && (
                        <tr>
                          <td colSpan={5} style={{ padding: 0 }}>
                            <pre
                              className="adm-mono"
                              style={{
                                margin: 0, padding: '0.85rem 1.25rem', fontSize: '0.75rem',
                                color: '#9494b0', background: '#0d0d12', overflowX: 'auto',
                              }}
                            >
                              {JSON.stringify(item.changes, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Footer / pagination ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ fontSize: '0.75rem', color: '#55556e' }}>
              {data ? (
                <>
                  Page <span style={{ color: '#9494b0', fontWeight: 600 }}>{data.page}</span> of{' '}
                  <span style={{ color: '#9494b0', fontWeight: 600 }}>{data.totalPages}</span> ·{' '}
                  <span style={{ color: '#9494b0', fontWeight: 600 }}>{data.total}</span> entries
                </>
              ) : ''}
            </span>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button className="btn btn-ghost btn-icon" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={15} />
              </button>
              <button
                className="btn btn-ghost btn-icon"
                disabled={!data || page >= data.totalPages || loading}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}