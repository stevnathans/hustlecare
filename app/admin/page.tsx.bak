'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ShoppingCart, Building, Star, MessageSquare,
  TrendingUp, DollarSign, Activity, AlertCircle, RefreshCw,
  Store, FileText, BarChart3, ExternalLink, Search
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────── */
interface Stats {
  users:        { total: number; activeToday: number; newThisWeek: number; trend: number | null };
  businesses:   { total: number; published: number; draft: number; trend: number | null };
  products:     { total: number; averagePrice: number; byVendor: number; trend: number | null };
  requirements: { total: number; templates: number; businessLinks: number; required: number; optional: number };
  comments:     { total: number; pending: number; approved: number; trend: number | null };
  reviews:      { total: number; averageRating: number; pending: number; trend: number | null };
  searches:     { total: number; uniqueKeywords: number; topKeyword: string; trend: number | null };
  carts:        { total: number; totalValue: number; averageValue: number; trend: number | null };
  vendors?:     { pendingApplications: number; pendingAppeals: number; pendingProducts: number };
}
interface RecentActivity {
  id: string; action: string; entity: string; user: string; timestamp: string;
}

/* ─── Shared dark-theme styles ─────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');

  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .sc {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:1.25rem 1.5rem;
    transition:all 0.2s; cursor:pointer; position:relative; overflow:hidden;
    display:flex; flex-direction:column; gap:0.75rem; text-align:left; width:100%;
  }
  .sc::before {
    content:''; position:absolute; inset:0;
    background:rgba(255,255,255,0); transition:background 0.2s;
  }
  .sc:hover::before { background:rgba(255,255,255,0.02); }
  .sc:hover { border-color:rgba(255,255,255,0.12); transform:translateY(-1px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }

  .sc-icon {
    width:40px; height:40px; border-radius:10px;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .sc-value { font-size:1.6rem; font-weight:700; color:#f0f0f5; line-height:1; }
  .sc-label { font-size:0.72rem; font-weight:600; color:#55556e; text-transform:uppercase; letter-spacing:0.06em; }
  .sc-sub { font-size:0.76rem; color:#9494b0; }
  .sc-trend { display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; font-weight:600; }

  .alert-panel {
    background:#13131a; border:1px solid rgba(245,158,11,0.2);
    border-radius:14px; padding:1.25rem 1.5rem;
  }
  .alert-item {
    background:#1a1a24; border-radius:10px; padding:0.85rem 1rem;
    border:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; justify-content:space-between;
    cursor:pointer; transition:all 0.15s; width:100%;
  }
  .alert-item:hover { border-color:rgba(255,255,255,0.12); background:#1f1f2e; }

  .feed-card {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; overflow:hidden;
  }
  .feed-item {
    padding:0.9rem 1.25rem; border-bottom:1px solid rgba(255,255,255,0.04);
    transition:background 0.15s;
  }
  .feed-item:last-child { border-bottom:none; }
  .feed-item:hover { background:rgba(255,255,255,0.02); }

  .mini-panel {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:1.25rem;
  }
  .mini-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:0.6rem 0.75rem; border-radius:8px;
    transition:background 0.15s; cursor:pointer; width:100%;
    border:none; background:transparent; font-family:'Sora',sans-serif;
  }
  .mini-row:hover { background:rgba(255,255,255,0.04); }
  .mini-row span:first-child { font-size:0.82rem; color:#9494b0; }
  .mini-row span:last-child { font-size:0.85rem; font-weight:700; color:#f0f0f5; }

  .sec-hd { font-size:0.65rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:0.9rem; display:flex; align-items:center; gap:0.4rem; }

  .bar-track { height:8px; border-radius:4px; background:rgba(255,255,255,0.06); overflow:hidden; }
  .bar-fill { height:100%; border-radius:4px; transition:width 0.4s ease; }

  .refresh-btn {
    display:inline-flex; align-items:center; gap:0.4rem;
    padding:0.5rem 1rem; border-radius:9px;
    background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.25);
    color:#818cf8; font-size:0.82rem; font-weight:600;
    font-family:'Sora',sans-serif; cursor:pointer; transition:all 0.15s;
  }
  .refresh-btn:hover { background:rgba(99,102,241,0.25); color:#a5b4fc; }
  .refresh-btn.spinning svg { animation:spin 0.8s linear infinite; }
  @keyframes spin { to { transform:rotate(360deg); } }

  .skel {
    background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

/* ─── Color maps ───────────────────────────────────────────────── */
const ICON_BG: Record<string,string> = {
  blue:'rgba(99,102,241,0.15)', purple:'rgba(139,92,246,0.15)',
  green:'rgba(16,185,129,0.15)', orange:'rgba(245,158,11,0.15)',
  red:'rgba(239,68,68,0.15)', indigo:'rgba(99,102,241,0.15)',
  pink:'rgba(236,72,153,0.15)', yellow:'rgba(234,179,8,0.15)',
};
const ICON_FG: Record<string,string> = {
  blue:'#818cf8', purple:'#a78bfa', green:'#34d399', orange:'#fbbf24',
  red:'#f87171', indigo:'#818cf8', pink:'#f472b6', yellow:'#facc15',
};

/* ─── Sub-components ───────────────────────────────────────────── */
function StatCard({
  title, value, icon: Icon, subtitle, trend, color='blue', onClick
}: {
  title:string; value:string|number; icon:React.ElementType;
  subtitle?:string; trend?:number|null; color?:string; onClick?:()=>void;
}) {
  const hasTrendValue = trend !== undefined && trend !== null;
  const isNewTrend = trend === null;

  return (
    <button onClick={onClick} className="sc">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
        <div style={{ flex:1 }}>
          <div className="sc-label" style={{ marginBottom:'0.5rem' }}>{title}</div>
          <div className="sc-value">{value}</div>
        </div>
        <div className="sc-icon" style={{ background:ICON_BG[color] }}>
          <Icon size={18} color={ICON_FG[color]} />
        </div>
      </div>
      {subtitle && <div className="sc-sub">{subtitle}</div>}
      {hasTrendValue && (
        <div className="sc-trend" style={{ color: (trend as number)>=0 ? '#34d399' : '#f87171' }}>
          <TrendingUp size={12} style={{ transform: (trend as number)<0 ? 'rotate(180deg)' : 'none' }} />
          {(trend as number)>=0?'+':''}{trend}% this week
        </div>
      )}
      {isNewTrend && (
        <div className="sc-trend" style={{ color:'#818cf8' }}>
          <TrendingUp size={12} />
          New this week
        </div>
      )}
    </button>
  );
}

function AlertItem({ title, count, color, onClick }: { title:string; count:number; color:string; onClick:()=>void }) {
  if (count === 0) return null;
  return (
    <button onClick={onClick} className="alert-item">
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <div style={{ padding:'0.5rem', borderRadius:'8px', background:`${color}18` }}>
          <AlertCircle size={16} color={color} />
        </div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#f0f0f5' }}>{title}</div>
          <div style={{ fontSize:'0.72rem', color:'#9494b0' }}>Needs attention</div>
        </div>
      </div>
      <span className="adm-mono" style={{ fontSize:'1.4rem', fontWeight:700, color:'#f0f0f5' }}>{count}</span>
    </button>
  );
}

function Bar({ label, value, total, color }: { label:string; value:number; total:number; color:string }) {
  const pct = total > 0 ? Math.round((value/total)*100) : 0;
  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
        <span style={{ fontSize:'0.78rem', color:'#9494b0' }}>{label}</span>
        <span className="adm-mono" style={{ fontSize:'0.78rem', color:'#f0f0f5', fontWeight:600 }}>{value} · {pct}%</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width:`${pct}%`, background:color }} />
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display:'grid', gap:'1.5rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
        {Array.from({length:8}).map((_,i)=>(
          <div key={i} className="sc" style={{ cursor:'default' }}>
            <div className="skel" style={{ height:12, width:'50%' }} />
            <div className="skel" style={{ height:28, width:'60%' }} />
            <div className="skel" style={{ height:11, width:'80%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────── */
export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats|null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh=false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [sRes, aRes] = await Promise.all([
        fetch('/api/admin/stats'), fetch('/api/admin/activity')
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) setRecentActivity(await aRes.json());
    } catch(e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(t);
  }, []);

  const hasPending =
    (stats?.comments.pending||0)>0 ||
    (stats?.reviews.pending||0)>0 ||
    (stats?.businesses.draft||0)>0 ||
    (stats?.vendors?.pendingApplications||0)>0 ||
    (stats?.vendors?.pendingAppeals||0)>0 ||
    (stats?.vendors?.pendingProducts||0)>0;

  // Single source of truth for the top-row metrics — each metric appears exactly once.
  const metricCards = stats ? [
    { title:'Total Users', value: stats.users.total.toLocaleString(), icon:Users, subtitle:`${stats.users.activeToday} active today`, trend: stats.users.trend, color:'blue', href:'/admin/users' },
    { title:'Businesses', value: stats.businesses.total, icon:Building, subtitle:`${stats.businesses.published} published · ${stats.businesses.draft} draft`, trend: stats.businesses.trend, color:'purple', href:'/admin/businesses' },
    { title:'Products', value: stats.products.total.toLocaleString(), icon:ShoppingCart, subtitle:`Avg KES ${stats.products.averagePrice.toLocaleString()}`, trend: stats.products.trend, color:'green', href:'/admin/products' },
    { title:'Requirements', value: stats.requirements.templates, icon:FileText, subtitle:`${stats.requirements.businessLinks} links · ${stats.requirements.required} required`, trend: undefined, color:'indigo', href:'/admin/requirements' },
    { title:'Reviews', value: stats.reviews.total, icon:Star, subtitle:`Avg ${stats.reviews.averageRating.toFixed(1)} ★ · ${stats.reviews.pending} pending`, trend: stats.reviews.trend, color:'yellow', href:'/admin/reviews' },
    { title:'Comments', value: stats.comments.total, icon:MessageSquare, subtitle:`${stats.comments.pending} pending`, trend: stats.comments.trend, color:'pink', href:'/admin/comments' },
    { title:'Searches', value: stats.searches.total.toLocaleString(), icon:Search, subtitle:`Top: ${stats.searches.topKeyword || 'N/A'}`, trend: stats.searches.trend, color:'red', href:'/admin' },
    { title:'Potential Cart Value', value: `KES ${stats.carts.totalValue.toLocaleString()}`, icon:DollarSign, subtitle:`${stats.carts.total} active carts`, trend: stats.carts.trend, color:'orange', href:'/admin' },
  ] : [];

  return (
    <>
      <style>{S}</style>
      <div className="adm" style={{ minHeight:'100vh', padding:'0.25rem 0' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', color:'#f0f0f5', marginBottom:'0.25rem' }}>
              Dashboard Overview
            </h1>
            <p style={{ fontSize:'0.85rem', color:'#55556e' }}>
              Welcome back — here&apos;s what&apos;s happening with Hustlecare today.
            </p>
          </div>
          <button className={`refresh-btn${refreshing?' spinning':''}`} onClick={()=>fetchData(true)}>
            <RefreshCw size={14} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {loading ? <Skeleton /> : (
          <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>

            {/* ── Pending alerts (single source of truth for anything needing action) ── */}
            {hasPending && (
              <div className="alert-panel">
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
                  <AlertCircle size={16} color="#f59e0b" />
                  <span style={{ fontSize:'0.85rem', fontWeight:700, color:'#fbbf24' }}>Pending Actions</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'0.75rem' }}>
                  <AlertItem title="Pending Comments" count={stats?.comments.pending||0} color="#f59e0b" onClick={()=>router.push('/admin/comments')} />
                  <AlertItem title="Pending Reviews"  count={stats?.reviews.pending||0}  color="#f59e0b" onClick={()=>router.push('/admin/reviews')} />
                  <AlertItem title="Draft Businesses" count={stats?.businesses.draft||0}  color="#6366f1" onClick={()=>router.push('/admin/businesses')} />
                  <AlertItem title="Vendor Applications" count={stats?.vendors?.pendingApplications||0} color="#34d399" onClick={()=>router.push('/admin/vendors')} />
                  <AlertItem title="Vendor Suspension Appeals" count={stats?.vendors?.pendingAppeals||0} color="#f87171" onClick={()=>router.push('/admin/vendors')} />
                  <AlertItem title="Vendor Products Awaiting Review" count={stats?.vendors?.pendingProducts||0} color="#fbbf24" onClick={()=>router.push('/admin/products')} />
                </div>
              </div>
            )}

            {/* ── Platform metrics (every totals metric, shown once) ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
              {metricCards.map(m => (
                <StatCard
                  key={m.title}
                  title={m.title}
                  value={m.value}
                  icon={m.icon}
                  subtitle={m.subtitle}
                  trend={m.trend}
                  color={m.color}
                  onClick={()=>router.push(m.href)}
                />
              ))}
            </div>

            {/* ── Bottom row: Activity feed + sidebar ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem', alignItems:'start' }}>

              {/* Activity feed */}
              <div className="feed-card">
                <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#f0f0f5' }}>Recent Activity</div>
                    <div style={{ fontSize:'0.75rem', color:'#55556e', marginTop:'0.15rem' }}>Latest admin actions across the platform</div>
                  </div>
                  <button onClick={()=>router.push('/admin/audit')} style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', fontWeight:600, color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
                    View All
                  </button>
                </div>
                <div style={{ maxHeight:420, overflowY:'auto' }}>
                  {recentActivity.length>0 ? recentActivity.map(a=>(
                    <div key={a.id} className="feed-item">
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                        <div>
                          <div style={{ fontSize:'0.84rem', fontWeight:600, color:'#f0f0f5' }}>{a.action}</div>
                          <div style={{ fontSize:'0.75rem', color:'#9494b0', marginTop:'0.2rem' }}>{a.entity} · by {a.user}</div>
                        </div>
                        <div style={{ fontSize:'0.72rem', color:'#55556e', whiteSpace:'nowrap', flexShrink:0 }}>
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign:'center', padding:'3rem 1rem', color:'#3a3a56' }}>
                      <Activity size={32} style={{ margin:'0 auto 0.75rem', display:'block' }} />
                      <div style={{ fontSize:'0.85rem' }}>No recent activity</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

                {/* Content Health — real breakdowns not shown anywhere else */}
                {stats && (
                  <div className="mini-panel">
                    <div className="sec-hd"><BarChart3 size={12} /> Content Health</div>
                    <Bar
                      label="Businesses published"
                      value={stats.businesses.published}
                      total={stats.businesses.total}
                      color="#818cf8"
                    />
                    <Bar
                      label="Requirements required"
                      value={stats.requirements.required}
                      total={stats.requirements.required + stats.requirements.optional}
                      color="#34d399"
                    />
                  </div>
                )}

                {/* Quick Links — sections not otherwise linked from this page */}
                <div className="mini-panel">
                  <div className="sec-hd">Quick Links</div>
                  {[
                    { label:'Vendors',       href:'/admin/vendors',   icon:Store },
                    { label:'Community',     href:'/admin/community', icon:Users },
                    { label:'Analytics',     href:'/admin/analytics', icon:BarChart3 },
                    { label:'Audit Log',     href:'/admin/audit',     icon:FileText },
                  ].map(l=>(
                    <button key={l.label} className="mini-row" onClick={()=>router.push(l.href)}>
                      <span style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <l.icon size={13} style={{ color:'#55556e' }} /> {l.label}
                      </span>
                      <ExternalLink size={13} color="#55556e" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}