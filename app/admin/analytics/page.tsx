/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
// app/admin/analytics/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────
type VendorRow = {
  vendorId: number;
  vendorName: string;
  vendorStatus: string;
  buyNowClicks: number;
  outboundRedirects: number;
  cartAdds: number;
  donationClicks: number;
  clickThroughRate: number;
  suggestedInvoiceKES: number;
};

type AnalyticsResponse = {
  days: number;
  perLeadFeeKES: number;
  totalDonationClicks: number;
  vendors: VendorRow[];
};

type SortField = 'vendorName' | 'buyNowClicks' | 'outboundRedirects' | 'cartAdds' | 'clickThroughRate' | 'suggestedInvoiceKES';
type SortDir = 'asc' | 'desc';

const RANGE_OPTIONS = [7, 30, 90];

// ── Styles (matches the dark admin theme used across /admin) ──────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; cursor:pointer; background:#13131a; transition:color 0.15s; }
  .r-table th:hover { color:#a5b4fc; }
  .r-table th.no-sort { cursor:default; }
  .r-table th.no-sort:hover { color:#55556e; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .r-table tbody tr.top-row td:first-child { position:relative; }
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .btn-filter { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.05); color:#9494b0; transition:all 0.15s; white-space:nowrap; }
  .btn-filter:hover { background:rgba(255,255,255,0.09); color:#f0f0f5; }
  .btn-filter.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.35); }
  .kpi-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1.1rem 1.25rem; position:relative; overflow:hidden; }
  .kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:0.65rem; }
  .status-badge { display:inline-flex; align-items:center; padding:0.14rem 0.55rem; border-radius:100px; font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
  .ctr-track { width:64px; height:6px; border-radius:100px; background:rgba(255,255,255,0.07); overflow:hidden; display:inline-block; vertical-align:middle; }
  .ctr-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#6366f1,#a5b4fc); }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

function statusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'active') return { bg: 'rgba(16,185,129,0.12)', color: '#34d399' };
  if (s === 'suspended' || s === 'archived') return { bg: 'rgba(239,68,68,0.12)', color: '#f87171' };
  return { bg: 'rgba(148,148,176,0.12)', color: '#9494b0' };
}

function SortArrow({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field)
    return (
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: 4, opacity: 0.25 }}>
        <path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  return sortDir === 'asc' ? (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}>
      <path d="M5 1L9 6H1L5 1Z" fill="currentColor" />
    </svg>
  ) : (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}>
      <path d="M5 6L1 1H9L5 6Z" fill="currentColor" />
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('suggestedInvoiceKES');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  }

  const totalRedirects = data?.vendors.reduce((sum, v) => sum + v.outboundRedirects, 0) ?? 0;
  const totalBuyNow = data?.vendors.reduce((sum, v) => sum + v.buyNowClicks, 0) ?? 0;
  const totalSuggestedInvoice = data?.vendors.reduce((sum, v) => sum + v.suggestedInvoiceKES, 0) ?? 0;
  const overallCTR = totalBuyNow > 0 ? totalRedirects / totalBuyNow : 0;
  const maxInvoice = Math.max(1, ...(data?.vendors.map((v) => v.suggestedInvoiceKES) ?? [1]));

  const filteredSorted = useMemo(() => {
    const list = (data?.vendors ?? []).filter(
      (v) => !search || v.vendorName.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => {
      let va: number | string = a[sortField];
      let vb: number | string = b[sortField];
      if (sortField === 'vendorName') {
        va = a.vendorName.toLowerCase();
        vb = b.vendorName.toLowerCase();
        return sortDir === 'asc' ? (va as string).localeCompare(vb as string) : (vb as string).localeCompare(va as string);
      }
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
  }, [data, search, sortField, sortDir]);

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                Vendor Engagement Analytics
              </h1>
              <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 520 }}>
                Buy Now clicks, outbound redirects, and cart adds per vendor — the basis for manual
                pay-per-lead invoicing until checkout is live.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {RANGE_OPTIONS.map((opt) => (
                <button key={opt} className={`btn-filter${days === opt ? ' active' : ''}`} onClick={() => setDays(opt)}>
                  {opt}d
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M17 7h4v4" />
                </svg>
              </div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{totalRedirects.toLocaleString()}</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Outbound Redirects
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2">
                  <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                </svg>
              </div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>
                KSh {totalSuggestedInvoice.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Suggested Invoicing
              </div>
              <p style={{ fontSize: '0.72rem', color: '#3a3a56', marginTop: '0.35rem' }}>
                at KSh {data?.perLeadFeeKES ?? '—'} / redirect — adjust in lib/constants.ts
              </p>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(236,72,153,0.12)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2">
                  <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
                </svg>
              </div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data?.totalDonationClicks ?? 0}</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Donation Clicks
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" />
                </svg>
              </div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{(overallCTR * 100).toFixed(0)}%</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Overall Click-through
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 320, marginBottom: '0.75rem' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search vendor…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="u-input"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: 0, fontSize: '1.1rem' }}
              >
                ×
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.75rem', color: '#55556e', marginBottom: '0.75rem' }}>
            Showing <strong style={{ color: '#9494b0' }}>{filteredSorted.length}</strong> vendor
            {filteredSorted.length === 1 ? '' : 's'}
          </div>

          {/* Vendor table */}
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="scroll" style={{ overflowX: 'auto' }}>
              <table className="r-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('vendorName')} style={{ paddingLeft: '1.25rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Vendor
                        <SortArrow field="vendorName" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th className="no-sort">Status</th>
                    <th onClick={() => handleSort('buyNowClicks')} style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Buy Now
                        <SortArrow field="buyNowClicks" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th onClick={() => handleSort('outboundRedirects')} style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Continued to Vendor
                        <SortArrow field="outboundRedirects" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th onClick={() => handleSort('cartAdds')} style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Cart Adds
                        <SortArrow field="cartAdds" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th onClick={() => handleSort('clickThroughRate')} style={{ textAlign: 'right' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Click-through
                        <SortArrow field="clickThroughRate" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                    <th onClick={() => handleSort('suggestedInvoiceKES')} style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        Suggested Invoice
                        <SortArrow field="suggestedInvoiceKES" sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>
                        Loading…
                      </td>
                    </tr>
                  )}
                  {!loading && filteredSorted.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>
                        {search ? 'No vendors match your search.' : 'No engagement recorded in this window yet.'}
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filteredSorted.map((v) => {
                      const badge = statusBadgeStyle(v.vendorStatus);
                      const barPct = Math.max(2, Math.round((v.suggestedInvoiceKES / maxInvoice) * 100));
                      return (
                        <tr key={v.vendorId}>
                          <td style={{ paddingLeft: '1.25rem', fontWeight: 600, fontSize: '0.84rem' }}>{v.vendorName}</td>
                          <td>
                            <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>
                              {v.vendorStatus}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">
                            {v.buyNowClicks}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">
                            {v.outboundRedirects}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">
                            {v.cartAdds}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span className="ctr-track">
                                <span className="ctr-fill" style={{ width: `${Math.min(100, v.clickThroughRate * 100)}%` }} />
                              </span>
                              <span className="adm-mono" style={{ fontSize: '0.8rem', color: '#9494b0', minWidth: 32, textAlign: 'right' }}>
                                {(v.clickThroughRate * 100).toFixed(0)}%
                              </span>
                            </span>
                          </td>
                          <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                            <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.86rem' }} className="adm-mono">
                              KSh {v.suggestedInvoiceKES.toLocaleString()}
                            </div>
                            <div style={{ width: '100%', height: 3, borderRadius: 100, background: 'rgba(255,255,255,0.06)', marginTop: 4 }}>
                              <div style={{ width: `${barPct}%`, height: '100%', borderRadius: 100, background: 'rgba(52,211,153,0.5)' }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          <p style={{ fontSize: '0.74rem', color: '#3a3a56', marginTop: '1rem', lineHeight: 1.5 }}>
            "Buy Now Clicks" = the interstitial page was viewed (purchase intent). "Continued to Vendor" = the
            user actually clicked through to the vendor's site or WhatsApp. A big gap between the two for a
            vendor often means their product page or link needs work, not necessarily that demand is low.
          </p>
        </div>
      </div>
    </>
  );
}