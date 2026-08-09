/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/admin/carts/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ShoppingCart, TrendingUp, DollarSign, Package, ChevronDown, ChevronRight,
  Search, Download, Building, FileText
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */
type CartItemRow = {
  id: string;
  requirementName: string;
  category: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};
type CartRow = {
  id: string;
  name: string | null;
  totalCost: number;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
  business: { id: number; name: string; slug: string } | null;
  itemCount: number;
  items: CartItemRow[];
};
type TopBusiness = { businessId: number; businessName: string; businessSlug: string | null; cartCount: number; totalValue: number };
type TopProduct = { productId: number; productName: string; vendorName: string | null; cartAddCount: number; totalQuantity: number; totalValue: number };
type TopRequirement = { requirementName: string; category: string | null; cartAddCount: number; totalQuantity: number; totalValue: number };
type Summary = {
  totalCartsAllTime: number; totalCartsInWindow: number; totalValue: number; averageValue: number;
  totalItems: number; averageItemsPerCart: number; cartsThisWeek: number; cartsLastWeek: number; trend: number | null;
};
type CartsResponse = {
  summary: Summary;
  topBusinesses: TopBusiness[];
  topProducts: TopProduct[];
  topRequirements: TopRequirement[];
  carts: CartRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type TabKey = 'carts' | 'businesses' | 'requirements' | 'products';
type SortField = 'createdAt' | 'totalCost' | 'businessName' | 'userName';
type SortDir = 'asc' | 'desc';

const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '7', label: '7d' },
  { value: '30', label: '30d' },
  { value: '90', label: '90d' },
];
const TABS: { key: TabKey; label: string }[] = [
  { key: 'carts', label: 'All Carts' },
  { key: 'businesses', label: 'Top Businesses' },
  { key: 'requirements', label: 'Popular Requirements' },
  { key: 'products', label: 'Top Products' },
];

/* ─── Styles ─────────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .kpi-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1.1rem 1.25rem; position:relative; overflow:hidden; }
  .kpi-icon { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; margin-bottom:0.65rem; }
  .kpi-trend { display:flex; align-items:center; gap:0.3rem; font-size:0.72rem; font-weight:600; margin-top:0.35rem; }

  .btn-filter { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.05); color:#9494b0; transition:all 0.15s; white-space:nowrap; }
  .btn-filter:hover { background:rgba(255,255,255,0.09); color:#f0f0f5; }
  .btn-filter.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.35); }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.83rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-success { background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.25); }
  .btn-success:hover { background:rgba(16,185,129,0.25); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-ghost:disabled { opacity:0.35; cursor:not-allowed; }

  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; cursor:pointer; background:#13131a; transition:color 0.15s; }
  .r-table th:hover { color:#a5b4fc; }
  .r-table th.no-sort { cursor:default; }
  .r-table th.no-sort:hover { color:#55556e; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr.data-row { transition:background 0.15s; cursor:pointer; }
  .r-table tbody tr.data-row:hover { background:rgba(255,255,255,0.025); }
  .r-table tbody tr.expanded-row td { background:rgba(99,102,241,0.03); border-bottom:1px solid rgba(255,255,255,0.06); }

  .item-line { display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.8rem; }
  .item-line:last-child { border-bottom:none; }
  .cat-badge { display:inline-flex; align-items:center; padding:0.12rem 0.5rem; border-radius:100px; font-size:0.68rem; font-weight:600; background:rgba(99,102,241,0.1); color:#a5b4fc; }

  .section-title { font-size:1.05rem; font-weight:700; margin-bottom:0.2rem; }
  .section-sub { font-size:0.8rem; color:#55556e; margin-bottom:0.9rem; }

  .req-row { display:flex; align-items:center; gap:0.85rem; padding:0.7rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); }
  .req-row:last-child { border-bottom:none; }
  .req-rank { width:22px; flex-shrink:0; font-size:0.76rem; font-weight:700; color:#3a3a56; }
  .req-bar-track { flex:1; height:8px; border-radius:100px; background:rgba(255,255,255,0.05); overflow:hidden; min-width:60px; }
  .req-bar-fill { height:100%; border-radius:100px; background:linear-gradient(90deg,#6366f1,#818cf8); }

  .tab-bar { display:flex; gap:0.35rem; border-bottom:1px solid rgba(255,255,255,0.07); margin-bottom:1.25rem; overflow-x:auto; }
  .tab-btn { position:relative; padding:0.7rem 0.25rem; margin-right:1.5rem; background:none; border:none; cursor:pointer; font-family:'Sora',sans-serif; font-size:0.86rem; font-weight:600; color:#55556e; transition:color 0.15s; white-space:nowrap; }
  .tab-btn:hover { color:#9494b0; }
  .tab-btn.active { color:#f0f0f5; }
  .tab-btn.active::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px; background:linear-gradient(90deg,#6366f1,#a5b4fc); border-radius:2px; }

  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

function SortArrow({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field)
    return (
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{ marginLeft: 4, opacity: 0.25 }}>
        <path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  return sortDir === 'asc' ? (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}><path d="M5 1L9 6H1L5 1Z" fill="currentColor" /></svg>
  ) : (
    <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{ marginLeft: 4, color: '#818cf8' }}><path d="M5 6L1 1H9L5 6Z" fill="currentColor" /></svg>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function kes(n: number) { return `KES ${n.toLocaleString()}`; }

export default function AdminCartsPage() {
  const [data, setData] = useState<CartsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('carts');

  const [days, setDays] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [days]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), pageSize: String(pageSize),
      search: debouncedSearch, sortField, sortDir, days,
    });
    fetch(`/api/admin/carts?${params}`)
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [page, pageSize, debouncedSearch, sortField, sortDir, days]);

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('desc'); }
    setPage(1);
  }

  function handleExport() {
    if (!data) return;
    const csv = [
      ['Cart ID', 'User', 'Email', 'Business', 'Items', 'Total Cost (KES)', 'Created'],
      ...data.carts.map(c => [
        c.id, c.user?.name || '', c.user?.email || '', c.business?.name || '',
        String(c.itemCount), String(c.totalCost), new Date(c.createdAt).toISOString(),
      ]),
    ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `carts-page${page}-${new Date().toISOString()}.csv`,
    });
    a.click();
  }

  const summary = data?.summary;
  const maxRequirementEngagement = Math.max(1, ...(data?.topRequirements.map(r => r.cartAddCount) ?? [1]));
  const maxBusinessCarts = Math.max(1, ...(data?.topBusinesses.map(b => b.cartCount) ?? [1]));
  const maxProductAdds = Math.max(1, ...(data?.topProducts.map(p => p.cartAddCount) ?? [1]));

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>
                Cart & Startup Cost Analytics
              </h1>
              <p style={{ fontSize: '0.84rem', color: '#55556e', maxWidth: 620 }}>
                Every cart is a user's estimated startup cost for a business — the requirements and products
                they've added in the calculator. This is the core signal for what people actually plan to spend.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {DAY_OPTIONS.map(opt => (
                <button key={opt.value} className={`btn-filter${days === opt.value ? ' active' : ''}`} onClick={() => setDays(opt.value)}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(99,102,241,0.12)' }}><ShoppingCart size={16} color="#818cf8" /></div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{summary?.totalCartsAllTime.toLocaleString() ?? '—'}</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Carts (all time)</div>
              {summary && (
                <div className="kpi-trend" style={{ color: summary.trend === null ? '#818cf8' : summary.trend >= 0 ? '#34d399' : '#f87171' }}>
                  <TrendingUp size={11} style={{ transform: summary.trend !== null && summary.trend < 0 ? 'rotate(180deg)' : 'none' }} />
                  {summary.trend === null ? 'New this week' : `${summary.trend >= 0 ? '+' : ''}${summary.trend}% this week`}
                </div>
              )}
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(16,185,129,0.12)' }}><DollarSign size={16} color="#34d399" /></div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700, color: '#34d399' }}>{summary ? kes(summary.totalValue) : '—'}</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Estimated Startup Cost</div>
              <p style={{ fontSize: '0.72rem', color: '#3a3a56', marginTop: '0.35rem' }}>Sum of cart values in selected window — not confirmed revenue.</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(245,158,11,0.12)' }}><Package size={16} color="#fbbf24" /></div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{summary ? kes(summary.averageValue) : '—'}</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Average Cart Value</div>
              <p style={{ fontSize: '0.72rem', color: '#3a3a56', marginTop: '0.35rem' }}>{summary ? `${summary.averageItemsPerCart} items per cart on average` : ''}</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon" style={{ background: 'rgba(236,72,153,0.12)' }}><FileText size={16} color="#f472b6" /></div>
              <div className="adm-mono" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{summary?.totalItems.toLocaleString() ?? '—'}</div>
              <div style={{ fontSize: '0.76rem', color: '#55556e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Requirements Added to Carts</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="tab-bar">
            {TABS.map(tab => (
              <button key={tab.key} className={`tab-btn${activeTab === tab.key ? ' active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── All Carts tab ── */}
          {activeTab === 'carts' && (
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                  <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#55556e', pointerEvents: 'none' }} />
                  <input type="text" placeholder="Search by user, email, or business…" value={search} onChange={e => setSearch(e.target.value)} className="u-input" />
                </div>
                <button className="btn btn-success" onClick={handleExport}><Download size={14} />Export page</button>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#55556e', marginBottom: '0.75rem' }}>
                Showing <strong style={{ color: '#9494b0' }}>{data?.carts.length ?? 0}</strong> of{' '}
                <strong style={{ color: '#9494b0' }}>{data?.pagination.total ?? 0}</strong> carts
              </div>

              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <div className="scroll" style={{ overflowX: 'auto' }}>
                  <table className="r-table">
                    <thead>
                      <tr>
                        <th className="no-sort" style={{ paddingLeft: '1.25rem', width: 30 }}></th>
                        <th onClick={() => handleSort('userName')}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>User<SortArrow field="userName" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        <th onClick={() => handleSort('businessName')}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>Business<SortArrow field="businessName" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        <th className="no-sort" style={{ textAlign: 'right' }}>Items</th>
                        <th onClick={() => handleSort('totalCost')} style={{ textAlign: 'right' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>Total Cost<SortArrow field="totalCost" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                        <th onClick={() => handleSort('createdAt')} style={{ textAlign: 'right', paddingRight: '1.25rem' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center' }}>Created<SortArrow field="createdAt" sortField={sortField} sortDir={sortDir} /></span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</td></tr>}
                      {!loading && (data?.carts.length ?? 0) === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>
                          {search ? 'No carts match your search.' : 'No carts in this window yet.'}
                        </td></tr>
                      )}
                      {!loading && data?.carts.map(c => {
                        const isExpanded = expandedId === c.id;
                        return (
                          <>
                            <tr key={c.id} className="data-row" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                              <td style={{ paddingLeft: '1.25rem' }}>
                                {isExpanded ? <ChevronDown size={14} color="#818cf8" /> : <ChevronRight size={14} color="#55556e" />}
                              </td>
                              <td>
                                <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{c.user?.name ?? 'Unknown user'}</div>
                                <div style={{ fontSize: '0.75rem', color: '#55556e' }}>{c.user?.email ?? ''}</div>
                              </td>
                              <td style={{ fontSize: '0.84rem', color: '#9494b0' }}>{c.business?.name ?? 'Unknown business'}</td>
                              <td style={{ textAlign: 'right', fontSize: '0.83rem', color: '#9494b0' }} className="adm-mono">{c.itemCount}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.86rem', color: '#34d399' }} className="adm-mono">{kes(c.totalCost)}</td>
                              <td style={{ textAlign: 'right', paddingRight: '1.25rem', fontSize: '0.78rem', color: '#55556e' }}>{fmtDate(c.createdAt)}</td>
                            </tr>
                            {isExpanded && (
                              <tr className="expanded-row">
                                <td colSpan={6} style={{ padding: '0 1.25rem 1rem 3.25rem' }}>
                                  {c.items.length === 0 ? (
                                    <div style={{ fontSize: '0.8rem', color: '#3a3a56', padding: '0.5rem 0' }}>No items in this cart.</div>
                                  ) : (
                                    c.items.map(item => (
                                      <div key={item.id} className="item-line">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                          <span className="cat-badge">{item.category}</span>
                                          <span style={{ fontWeight: 600 }}>{item.requirementName}</span>
                                          {item.productName && <span style={{ color: '#55556e' }}>· {item.productName}</span>}
                                        </div>
                                        <div className="adm-mono" style={{ color: '#9494b0' }}>
                                          {item.quantity} × KES {item.unitPrice.toLocaleString()} = <strong style={{ color: '#f0f0f5' }}>{kes(item.lineTotal)}</strong>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {data && data.pagination.totalPages > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                  <span style={{ fontSize: '0.8rem', color: '#9494b0' }} className="adm-mono">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </span>
                  <button className="btn btn-ghost" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </div>
          )}

          {/* ── Top Businesses tab ── */}
          {activeTab === 'businesses' && (
            <div>
              <div className="section-title">Businesses With the Most Carts</div>
              <div className="section-sub">Which business ideas generate the most cost-estimation activity.</div>
              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</div>}
                {!loading && (data?.topBusinesses.length ?? 0) === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No cart activity in this window yet.</div>
                )}
                {!loading && data?.topBusinesses.map((b, i) => {
                  const pct = Math.max(3, Math.round((b.cartCount / maxBusinessCarts) * 100));
                  return (
                    <div className="req-row" key={b.businessId}>
                      <div className="req-rank">{i + 1}</div>
                      <div style={{ width: 240, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={13} color="#55556e" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.businessName}</span>
                      </div>
                      <div className="req-bar-track"><div className="req-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, fontSize: '0.78rem', color: '#9494b0' }} className="adm-mono">
                        <span>{b.cartCount} carts</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{kes(b.totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Popular Requirements tab ── */}
          {activeTab === 'requirements' && (
            <div>
              <div className="section-title">Popular Requirements</div>
              <div className="section-sub">Requirements most frequently added to carts, across all businesses — signals where cost data matters most.</div>
              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</div>}
                {!loading && (data?.topRequirements.length ?? 0) === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No requirement activity in this window yet.</div>
                )}
                {!loading && data?.topRequirements.map((r, i) => {
                  const pct = Math.max(3, Math.round((r.cartAddCount / maxRequirementEngagement) * 100));
                  return (
                    <div className="req-row" key={`${r.requirementName}-${r.category}`}>
                      <div className="req-rank">{i + 1}</div>
                      <div style={{ width: 220, flexShrink: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.requirementName}</div>
                        {r.category && <span className="cat-badge" style={{ marginTop: 4 }}>{r.category}</span>}
                      </div>
                      <div className="req-bar-track"><div className="req-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, fontSize: '0.78rem', color: '#9494b0' }} className="adm-mono">
                        <span>{r.cartAddCount} carts</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{kes(r.totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Top Products tab ── */}
          {activeTab === 'products' && (
            <div>
              <div className="section-title">Most-Added Products</div>
              <div className="section-sub">Specific vendor products people are pricing into their startup costs most often.</div>
              <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>Loading…</div>}
                {!loading && (data?.topProducts.length ?? 0) === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: '#3a3a56' }}>No product activity in this window yet.</div>
                )}
                {!loading && data?.topProducts.map((p, i) => {
                  const pct = Math.max(3, Math.round((p.cartAddCount / maxProductAdds) * 100));
                  return (
                    <div className="req-row" key={p.productId}>
                      <div className="req-rank">{i + 1}</div>
                      <div style={{ width: 240, flexShrink: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.productName}</div>
                        {p.vendorName && <div style={{ fontSize: '0.74rem', color: '#55556e', marginTop: 2 }}>{p.vendorName}</div>}
                      </div>
                      <div className="req-bar-track"><div className="req-bar-fill" style={{ width: `${pct}%` }} /></div>
                      <div style={{ display: 'flex', gap: '1rem', flexShrink: 0, fontSize: '0.78rem', color: '#9494b0' }} className="adm-mono">
                        <span>{p.cartAddCount} carts · {p.totalQuantity} units</span>
                        <span style={{ color: '#34d399', fontWeight: 700 }}>{kes(p.totalValue)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}