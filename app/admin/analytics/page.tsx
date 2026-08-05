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

type ProductRow = {
  productId: number;
  productName: string;
  vendorId: number | null;
  vendorName: string | null;
  vendorStatus: string | null;
  priceKES: number | null;
  currency: string;
  category: string | null;
  requirementName: string | null;
  buyNowClicks: number;
  outboundRedirects: number;
  cartAdds: number;
  clickThroughRate: number;
};

type RequirementRow = {
  requirementName: string;
  category: string | null;
  buyNowClicks: number;
  outboundRedirects: number;
  cartAdds: number;
  clickThroughRate: number;
};

type AnalyticsResponse = {
  days: number;
  perLeadFeeKES: number;
  totalDonationClicks: number;
  vendors: VendorRow[];
  products: ProductRow[];
  requirements: RequirementRow[];
};

type VendorSortField = 'vendorName' | 'buyNowClicks' | 'outboundRedirects' | 'cartAdds' | 'clickThroughRate' | 'suggestedInvoiceKES';
type ProductSortField = 'productName' | 'priceKES' | 'buyNowClicks' | 'outboundRedirects' | 'cartAdds' | 'clickThroughRate';
type SortDir = 'asc' | 'desc';
type TabKey = 'vendors' | 'products' | 'requirements';

const RANGE_OPTIONS = [7, 30, 90];

const TABS: { key: TabKey; label: string }[] = [
  { key: 'vendors', label: 'Vendors' },
  { key: 'products', label: 'Top Products' },
  { key: 'requirements', label: 'Popular Requirements' },
];

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
  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .btn-filter { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.05); color:#9494b0; transition:all 0.15s; white-space:nowrap; }
  .btn-filter:hover { background:rgba(255,255,255,0.09); color:#f0f0f5; }
  .btn-filter.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.35); }
  .kpi-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1.1rem 1.25rem; position:relative; overflow:hidden; }
  .kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:0.65rem; }
  .status-badge { display:inline-flex; align-items:center; padding:0.14rem 0.55rem; border-radius:100px; font-size:0.66rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; }
  .cat-badge { display:inline-flex; align-items:center; padding:0.12rem 0.5rem; border-radius:100px; font-size:0.68rem; font-weight:600; background:rgba(99,102,241,0.1); color:#a5b4fc; }
  .ctr-track { width:56px; height:6px; border-radius:100px; background:rgba(255,255,255,0.07); overflow:hidden; display:inline-block; vertical-align:middle; }
  .ctr-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#6366f1,#a5b4fc); }
  .section-title { font-size:1.05rem; font-weight:700; margin-bottom:0.2rem; }
  .section-sub { font-size:0.8rem; color:#55556e; margin-bottom:0.9rem; }
  .req-row { display:flex; align-items:center; gap:0.85rem; padding:0.7rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); }
  .req-row:last-child { border-bottom:none; }
  .req-rank { width:22px; flex-shrink:0; font-size:0.76rem; font-weight:700; color:#3a3a56; }
  .req-bar-track { flex:1; height:8px; border-radius:100px; background:rgba(255,255,255,0.05); overflow:hidden; min-width:60px; }
  .req-bar-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#6366f1,#818cf8); }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .tab-bar { display:flex; gap:0.35rem; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:1.25rem; }
  .tab-btn { position:relative; padding:0.7rem 0.25rem; margin-right:1.5rem; background:none; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-size:0.86rem; font-weight:600; color:#55556e; transition:color 0.15s; }
  .tab-btn:hover { color:#9494b0; }
  .tab-btn.active { color:#f0f0f5; }
  .tab-btn.active::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:linear-gradient(90deg,#6366f1,#a5b4fc); border-radius:2px; }
  .tab-count { display:inline-flex; align-items:center; justify-content:center; min-width:18px; height:18px; padding:0 0.35rem; margin-left:0.4rem; border-radius:100px; font-size:0.66rem; font-weight:700; background:rgba(255,255,255,0.08); color:#9494b0; }
  .tab-btn.active .tab-count { background:rgba(99,102,241,0.2); color:#a5b4fc; }
`;

function statusBadgeStyle(status: string) {
  const s = status.toLowerCase();
  if (s === 'active') return { bg: 'rgba(16,185,129,0.12)', color: '#34d399' };
  if (s === 'suspended' || s === 'archived') return { bg: 'rgba(239,68,68,0.12)', color: '#f87171' };
  return { bg: 'rgba(148,148,176,0.12)', color: '#9494b0' };
}

function SortArrow<T extends string>({ field, sortField, sortDir }: { field: T; sortField: T; sortDir: SortDir }) {
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

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', maxWidth: 320 }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} className="u-input" />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#55556e', cursor: 'pointer', padding: 0, fontSize: '1.1rem' }}
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('vendors');

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorSortField, setVendorSortField] = useState<VendorSortField>('suggestedInvoiceKES');
  const [vendorSortDir, setVendorSortDir] = useState<SortDir>('desc');

  const [productSearch, setProductSearch] = useState('');
  const [productSortField, setProductSortField] = useState<ProductSortField>('buyNowClicks');
  const [productSortDir, setProductSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  function handleVendorSort(field: VendorSortField) {
    if (vendorSortField === field) setVendorSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setVendorSortField(field);
      setVendorSortDir('desc');
    }
  }

  function handleProductSort(field: ProductSortField) {
    if (productSortField === field) setProductSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setProductSortField(field);
      setProductSortDir('desc');
    }
  }

  const totalRedirects = data?.vendors.reduce((sum, v) => sum + v.outboundRedirects, 0) ?? 0;
  const totalBuyNow = data?.vendors.reduce((sum, v) => sum + v.buyNowClicks, 0) ?? 0;
  const totalSuggestedInvoice = data?.vendors.reduce((sum, v) => sum + v.suggestedInvoiceKES, 0) ?? 0;
  const overallCTR = totalBuyNow > 0 ? totalRedirects / totalBuyNow : 0;
  const maxInvoice = Math.max(1, ...(data?.vendors.map((v) => v.suggestedInvoiceKES) ?? [1]));

  const vendorRows = useMemo(() => {
    const list = (data?.vendors ?? []).filter((v) => !vendorSearch || v.vendorName.toLowerCase().includes(vendorSearch.toLowerCase()));
    return [...list].sort((a, b) => {
      if (vendorSortField === 'vendorName') {
        return vendorSortDir === 'asc' ? a.vendorName.localeCompare(b.vendorName) : b.vendorName.localeCompare(a.vendorName);
      }
      const va = a[vendorSortField] as number;
      const vb = b[vendorSortField] as number;
      return vendorSortDir === 'asc' ? va - vb : vb - va;
    });
  }, [data, vendorSearch, vendorSortField, vendorSortDir]);

  const productRows = useMemo(() => {
    const list = (data?.products ?? []).filter((p) => {
      if (!productSearch) return true;
      const q = productSearch.toLowerCase();
      return (
        p.productName.toLowerCase().includes(q) ||
        (p.vendorName ?? '').toLowerCase().includes(q) ||
        (p.requirementName ?? '').toLowerCase().includes(q)
      );
    });
    return [...list].sort((a, b) => {
      if (productSortField === 'productName') {
        return productSortDir === 'asc' ? a.productName.localeCompare(b.productName) : b.productName.localeCompare(a.productName);
      }
      const va = (a[productSortField] as number) ?? 0;
      const vb = (b[productSortField] as number) ?? 0;
      return productSortDir === 'asc' ? va - vb : vb - va;
    });
  }, [data, productSearch, productSortField, productSortDir]);

  const requirementRows = data?.requirements ?? [];
  const maxRequirementEngagement = Math.max(1, ...requirementRows.map((r) => r.buyNowClicks + r.cartAdds));

  const tabCounts: Record<TabKey, number> = {
    vendors: data?.vendors.length ?? 0,
    products: data?.products.length ?? 0,
    requirements: data?.requirements.length ?? 0,
  };

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                Vendor & Product Engagement
              </h1>
              <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 560 }}>
                Buy Now clicks, outbound redirects, and cart adds across vendors, products, and requirements —
                the basis for manual pay-per-lead invoicing until checkout is live.
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
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

          {/* Tabs */}
          <div className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
                <span className="tab-count">{tabCounts[tab.key]}</span>
              </button>
            ))}
          </div>

          {/* ── Vendors tab ── */}
          {activeTab === 'vendors' && (
            <div>
              <div className="section-title">Vendors</div>
              <div className="section-sub">Redirects and suggested invoicing per vendor.</div>

              <div style={{ marginBottom: '0.75rem' }}>
                <SearchInput value={vendorSearch} onChange={setVendorSearch} placeholder="Search vendor…" />
              </div>

              <div style={{ fontSize: '0.75rem', color: '#55556e', marginBottom: '0.75rem' }}>
                Showing <strong style={{ color: '#9494b0' }}>{vendorRows.length}</strong> vendor{vendorRows.length === 1 ? '' : 's'}
              </div>

              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <div className="scroll" style={{ overflowX: 'auto' }}>
                  <table className="r-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleVendorSort('vendorName')} style={{ paddingLeft: '1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Vendor<SortArrow field="vendorName" sortField={vendorSortField} sortDir={vendorSortDir} />
                          </span>
                        </th>
                        <th className="no-sort">Status</th>
                        <th onClick={() => handleVendorSort('buyNowClicks')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Buy Now<SortArrow field="buyNowClicks" sortField={vendorSortField} sortDir={vendorSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleVendorSort('outboundRedirects')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Continued to Vendor<SortArrow field="outboundRedirects" sortField={vendorSortField} sortDir={vendorSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleVendorSort('cartAdds')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Cart Adds<SortArrow field="cartAdds" sortField={vendorSortField} sortDir={vendorSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleVendorSort('clickThroughRate')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Click-through<SortArrow field="clickThroughRate" sortField={vendorSortField} sortDir={vendorSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleVendorSort('suggestedInvoiceKES')} style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Suggested Invoice<SortArrow field="suggestedInvoiceKES" sortField={vendorSortField} sortDir={vendorSortDir} />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</td></tr>
                      )}
                      {!loading && vendorRows.length === 0 && (
                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>
                          {vendorSearch ? 'No vendors match your search.' : 'No engagement recorded in this window yet.'}
                        </td></tr>
                      )}
                      {!loading && vendorRows.map((v) => {
                        const badge = statusBadgeStyle(v.vendorStatus);
                        const barPct = Math.max(2, Math.round((v.suggestedInvoiceKES / maxInvoice) * 100));
                        return (
                          <tr key={v.vendorId}>
                            <td style={{ paddingLeft: '1.25rem', fontWeight: 600, fontSize: '0.84rem' }}>{v.vendorName}</td>
                            <td><span className="status-badge" style={{ background: badge.bg, color: badge.color }}>{v.vendorStatus}</span></td>
                            <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{v.buyNowClicks}</td>
                            <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{v.outboundRedirects}</td>
                            <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{v.cartAdds}</td>
                            <td style={{ textAlign: 'right' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                <span className="ctr-track"><span className="ctr-fill" style={{ width: `${Math.min(100, v.clickThroughRate * 100)}%` }} /></span>
                                <span className="adm-mono" style={{ fontSize: '0.8rem', color: '#9494b0', minWidth: 32, textAlign: 'right' }}>{(v.clickThroughRate * 100).toFixed(0)}%</span>
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.86rem' }} className="adm-mono">KSh {v.suggestedInvoiceKES.toLocaleString()}</div>
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
            </div>
          )}

          {/* ── Top Products tab ── */}
          {activeTab === 'products' && (
            <div>
              <div className="section-title">Top Products</div>
              <div className="section-sub">Which specific products get clicked, and whether that turns into a vendor visit or cart add.</div>

              <div style={{ marginBottom: '0.75rem' }}>
                <SearchInput value={productSearch} onChange={setProductSearch} placeholder="Search product, vendor, or requirement…" />
              </div>

              <div style={{ fontSize: '0.75rem', color: '#55556e', marginBottom: '0.75rem' }}>
                Showing <strong style={{ color: '#9494b0' }}>{productRows.length}</strong> product{productRows.length === 1 ? '' : 's'}
              </div>

              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <div className="scroll" style={{ overflowX: 'auto' }}>
                  <table className="r-table">
                    <thead>
                      <tr>
                        <th onClick={() => handleProductSort('productName')} style={{ paddingLeft: '1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Product<SortArrow field="productName" sortField={productSortField} sortDir={productSortDir} />
                          </span>
                        </th>
                        <th className="no-sort">Requirement</th>
                        <th className="no-sort">Vendor</th>
                        <th onClick={() => handleProductSort('priceKES')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Price<SortArrow field="priceKES" sortField={productSortField} sortDir={productSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleProductSort('buyNowClicks')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Buy Now<SortArrow field="buyNowClicks" sortField={productSortField} sortDir={productSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleProductSort('outboundRedirects')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Continued to Vendor<SortArrow field="outboundRedirects" sortField={productSortField} sortDir={productSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleProductSort('cartAdds')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Cart Adds<SortArrow field="cartAdds" sortField={productSortField} sortDir={productSortDir} />
                          </span>
                        </th>
                        <th onClick={() => handleProductSort('clickThroughRate')} style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                            Click-through<SortArrow field="clickThroughRate" sortField={productSortField} sortDir={productSortDir} />
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</td></tr>
                      )}
                      {!loading && productRows.length === 0 && (
                        <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>
                          {productSearch ? 'No products match your search.' : 'No product engagement recorded in this window yet.'}
                        </td></tr>
                      )}
                      {!loading && productRows.map((p) => (
                        <tr key={p.productId}>
                          <td style={{ paddingLeft: '1.25rem', fontWeight: 600, fontSize: '0.84rem', maxWidth: 220 }}>{p.productName}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {p.category && <span className="cat-badge" style={{ marginRight: 6 }}>{p.category}</span>}
                            <span style={{ color: '#9494b0' }}>{p.requirementName ?? '—'}</span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{p.vendorName ?? '—'}</td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem' }} className="adm-mono">
                            {p.priceKES != null ? `${p.currency} ${p.priceKES.toLocaleString()}` : '—'}
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{p.buyNowClicks}</td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{p.outboundRedirects}</td>
                          <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{p.cartAdds}</td>
                          <td style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span className="ctr-track"><span className="ctr-fill" style={{ width: `${Math.min(100, p.clickThroughRate * 100)}%` }} /></span>
                              <span className="adm-mono" style={{ fontSize: '0.8rem', color: '#9494b0', minWidth: 32, textAlign: 'right' }}>{(p.clickThroughRate * 100).toFixed(0)}%</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Popular Requirements tab ── */}
          {activeTab === 'requirements' && (
            <div>
              <div className="section-title">Popular Requirements</div>
              <div className="section-sub">Which requirements drive the most product engagement, across all products under them — useful for spotting where vendor coverage matters most.</div>

              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</div>}
                {!loading && requirementRows.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No requirement engagement recorded in this window yet.</div>
                )}
                {!loading && requirementRows.map((r, i) => {
                  const engagement = r.buyNowClicks + r.cartAdds;
                  const pct = Math.max(3, Math.round((engagement / maxRequirementEngagement) * 100));
                  return (
                    <div className="req-row" key={r.requirementName}>
                      <div className="req-rank">{i + 1}</div>
                      <div style={{ width: 220, flexShrink: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.requirementName}
                        </div>
                        {r.category && <span className="cat-badge" style={{ marginTop: 4 }}>{r.category}</span>}
                      </div>
                      <div className="req-bar-track">
                        <div className="req-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.9rem', flexShrink: 0, fontSize: '0.78rem', color: '#9494b0' }} className="adm-mono">
                        <span title="Buy Now clicks">{r.buyNowClicks} views</span>
                        <span title="Continued to vendor">{r.outboundRedirects} redirects</span>
                        <span title="Cart adds">{r.cartAdds} cart</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <p style={{ fontSize: '0.74rem', color: '#3a3a56', marginTop: '1.5rem', lineHeight: 1.5 }}>
            "Buy Now Clicks" = the interstitial page was viewed (purchase intent). "Continued to Vendor" = the
            user actually clicked through to the vendor's site or WhatsApp. A big gap between the two often
            means a product page or link needs work, not necessarily that demand is low. "Popular Requirements"
            aggregates across every product listed under that requirement.
          </p>
        </div>
      </div>
    </>
  );
}