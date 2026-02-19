'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, ShoppingCart, Building, Star, MessageSquare,
  TrendingUp, DollarSign, Eye, Activity, ArrowUpRight,
  Clock, AlertCircle, RefreshCw
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────────── */
interface Stats {
  users:        { total: number; activeToday: number; newThisWeek: number; trend: number };
  businesses:   { total: number; published: number; draft: number };
  products:     { total: number; averagePrice: number; byVendor: number };
  requirements: { total: number; required: number; optional: number };
  comments:     { total: number; pending: number; approved: number };
  reviews:      { total: number; averageRating: number; pending: number };
  searches:     { total: number; uniqueKeywords: number; topKeyword: string };
  carts:        { total: number; totalValue: number; averageValue: number };
}
interface RecentActivity {
  id: string; action: string; entity: string; user: string; timestamp: string;
}

/* ─── Shared dark-theme styles ─────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');

  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  /* stat cards */
  .sc {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:1.25rem 1.5rem;
    transition:all 0.2s; cursor:pointer; position:relative; overflow:hidden;
    display:flex; flex-direction:column; gap:0.75rem;
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
  .sc-value { font-size:1.75rem; font-weight:700; color:#f0f0f5; line-height:1; }
  .sc-label { font-size:0.75rem; font-weight:600; color:#55556e; text-transform:uppercase; letter-spacing:0.07em; }
  .sc-sub { font-size:0.78rem; color:#9494b0; }
  .sc-trend { display:flex; align-items:center; gap:0.3rem; font-size:0.75rem; font-weight:600; }

  /* alert cards */
  .alert-panel {
    background:#13131a; border:1px solid rgba(245,158,11,0.2);
    border-radius:14px; padding:1.25rem 1.5rem;
  }
  .alert-item {
    background:#1a1a24; border-radius:10px; padding:0.85rem 1rem;
    border:1px solid rgba(255,255,255,0.06);
    display:flex; align-items:center; justify-content:space-between;
    cursor:pointer; transition:all 0.15s;
  }
  .alert-item:hover { border-color:rgba(255,255,255,0.12); background:#1f1f2e; }

  /* activity feed */
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

  /* mini panels */
  .mini-panel {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:14px; padding:1.25rem;
  }
  .mini-row {
    display:flex; align-items:center; justify-content:space-between;
    padding:0.55rem 0.75rem; border-radius:8px;
    transition:background 0.15s; cursor:pointer;
  }
  .mini-row:hover { background:rgba(255,255,255,0.04); }
  .mini-row span:first-child { font-size:0.82rem; color:#9494b0; }
  .mini-row span:last-child { font-size:0.85rem; font-weight:700; color:#f0f0f5; }

  /* section header */
  .sec-hd { font-size:0.65rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.12em; margin-bottom:0.75rem; }

  /* quick-stat row */
  .qs-card {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:12px; padding:1rem 1.25rem;
  }

  /* refresh button */
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

  /* skeleton */
  .skel {
    background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);
    background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  /* separator */
  .divider { height:1px; background:rgba(255,255,255,0.06); margin:0.25rem 0; }
`;

/* ─── Color maps ───────────────────────────────────────────────── */
const ICON_COLORS: Record<string,string> = {
  blue:   'rgba(99,102,241,0.15)',   purple: 'rgba(139,92,246,0.15)',
  green:  'rgba(16,185,129,0.15)',   orange: 'rgba(245,158,11,0.15)',
  red:    'rgba(239,68,68,0.15)',    indigo: 'rgba(99,102,241,0.15)',
  pink:   'rgba(236,72,153,0.15)',   yellow: 'rgba(234,179,8,0.15)',
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
  subtitle?:string; trend?:number; color?:string; onClick?:()=>void;
}) {
  return (
    <button onClick={onClick} className="sc" style={{ textAlign:'left', width:'100%' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
        <div style={{ flex:1 }}>
          <div className="sc-label" style={{ marginBottom:'0.5rem' }}>{title}</div>
          <div className="sc-value">{value}</div>
        </div>
        <div className="sc-icon" style={{ background:ICON_COLORS[color] }}>
          <Icon size={18} color={ICON_FG[color]} />
        </div>
      </div>
      {subtitle && <div className="sc-sub">{subtitle}</div>}
      {trend !== undefined && (
        <div className="sc-trend" style={{ color: trend>=0 ? '#34d399' : '#f87171' }}>
          <TrendingUp size={12} style={{ transform: trend<0 ? 'rotate(180deg)' : 'none' }} />
          {trend>=0?'+':''}{trend}% this week
        </div>
      )}
      <ArrowUpRight size={14} color="#55556e" style={{ position:'absolute', top:'1rem', right:'1rem' }} />
    </button>
  );
}

function AlertItem({ title, count, color, onClick }: { title:string; count:number; color:string; onClick:()=>void }) {
  if (count === 0) return null;
  return (
    <button onClick={onClick} className="alert-item" style={{ width:'100%', border:'none' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <div style={{ padding:'0.5rem', borderRadius:'8px', background:`${color}18` }}>
          <AlertCircle size={16} color={color} />
        </div>
        <div style={{ textAlign:'left' }}>
          <div style={{ fontSize:'0.85rem', fontWeight:600, color:'#f0f0f5' }}>{title}</div>
          <div style={{ fontSize:'0.72rem', color:'#9494b0' }}>Needs attention</div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
        <span style={{ fontSize:'1.4rem', fontWeight:700, color:'#f0f0f5', fontFamily:'DM Mono,monospace' }}>{count}</span>
        <ArrowUpRight size={14} color="#55556e" />
      </div>
    </button>
  );
}

function Skeleton() {
  return (
    <div style={{ display:'grid', gap:'1.5rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem' }}>
        {Array.from({length:4}).map((_,i)=>(
          <div key={i} className="sc">
            <div className="skel" style={{ height:14, width:'50%' }} />
            <div className="skel" style={{ height:32, width:'60%' }} />
            <div className="skel" style={{ height:12, width:'80%' }} />
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
    (stats?.businesses.draft||0)>0;

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

            {/* ── Pending alerts ── */}
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
                </div>
              </div>
            )}

            {/* ── Primary stats ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
              <StatCard title="Total Users"      value={stats?.users.total.toLocaleString()||'0'}        icon={Users}       subtitle={`${stats?.users.activeToday||0} active today`}                       trend={stats?.users.trend} color="blue"   onClick={()=>router.push('/admin/users')} />
              <StatCard title="Businesses"       value={stats?.businesses.total||'0'}                     icon={Building}    subtitle={`${stats?.businesses.published||0} published`}                        color="purple" onClick={()=>router.push('/admin/businesses')} />
              <StatCard title="Products"         value={stats?.products.total.toLocaleString()||'0'}      icon={ShoppingCart} subtitle={`Avg KES ${stats?.products.averagePrice.toLocaleString()||0}`}      color="green"  onClick={()=>router.push('/admin/products')} />
              <StatCard title="Total Cart Value" value={`KES ${stats?.carts.totalValue.toLocaleString()||0}`} icon={DollarSign} subtitle={`${stats?.carts.total||0} active carts`}                         color="orange" onClick={()=>router.push('/admin')} />
            </div>

            {/* ── Secondary stats ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
              <StatCard title="Requirements" value={stats?.requirements.total||'0'}  icon={Eye}          subtitle={`${stats?.requirements.required||0} required`}                          color="indigo" onClick={()=>router.push('/admin/requirements')} />
              <StatCard title="Reviews"      value={stats?.reviews.total||'0'}        icon={Star}         subtitle={`Avg ${stats?.reviews.averageRating.toFixed(1)||'0.0'} ★`}              color="yellow" onClick={()=>router.push('/admin/reviews')} />
              <StatCard title="Comments"     value={stats?.comments.total||'0'}       icon={MessageSquare} subtitle={`${stats?.comments.pending||0} pending`}                              color="pink"   onClick={()=>router.push('/admin/comments')} />
              <StatCard title="Searches"     value={stats?.searches.total.toLocaleString()||'0'} icon={TrendingUp} subtitle={`Top: ${stats?.searches.topKeyword||'N/A'}`}               color="red"    onClick={()=>router.push('/admin')} />
            </div>

            {/* ── Quick insights row ── */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.75rem' }}>
              {[
                { label:'Users',      value:stats?.users.total||0,          change:stats?.users.trend||0 },
                { label:'Businesses', value:stats?.businesses.total||0,     change:5 },
                { label:'Products',   value:stats?.products.total||0,       change:12 },
                { label:'Revenue',    value:stats?.carts.totalValue||0,     change:8 },
              ].map(s=>(
                <div key={s.label} className="qs-card">
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'0.75rem', color:'#9494b0', fontWeight:600 }}>{s.label}</span>
                    <span style={{ fontSize:'0.7rem', fontWeight:700, color:s.change>=0?'#34d399':'#f87171', display:'flex', alignItems:'center', gap:'0.2rem' }}>
                      <TrendingUp size={10} style={{ transform:s.change<0?'rotate(180deg)':'none' }} />
                      {s.change>=0?'+':''}{s.change}%
                    </span>
                  </div>
                  <div className="adm-mono" style={{ fontSize:'1.4rem', fontWeight:700, color:'#f0f0f5' }}>
                    {s.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Bottom row: Activity + Panels ── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'1.25rem', alignItems:'start' }}>

              {/* Activity feed */}
              <div className="feed-card">
                <div style={{ padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#f0f0f5' }}>Recent Activity</div>
                    <div style={{ fontSize:'0.75rem', color:'#55556e', marginTop:'0.15rem' }}>Latest admin actions across the platform</div>
                  </div>
                  <button onClick={()=>router.push('/admin/audit')} style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.78rem', fontWeight:600, color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
                    View All <ArrowUpRight size={13} />
                  </button>
                </div>
                <div style={{ maxHeight:360, overflowY:'auto' }}>
                  {recentActivity.length>0 ? recentActivity.map(a=>(
                    <div key={a.id} className="feed-item">
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                        <div>
                          <div style={{ fontSize:'0.84rem', fontWeight:600, color:'#f0f0f5' }}>{a.action}</div>
                          <div style={{ fontSize:'0.75rem', color:'#9494b0', marginTop:'0.2rem' }}>{a.entity} · by {a.user}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.72rem', color:'#55556e', whiteSpace:'nowrap', flexShrink:0 }}>
                          <Clock size={11} />
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

              {/* Right panels */}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>

                {/* Content overview */}
                <div className="mini-panel">
                  <div className="sec-hd">Content Overview</div>
                  {[
                    { label:'Businesses',   val:stats?.businesses.total||0,   href:'/admin/businesses' },
                    { label:'Requirements', val:stats?.requirements.total||0, href:'/admin/requirements' },
                    { label:'Products',     val:stats?.products.total||0,     href:'/admin/products' },
                  ].map(r=>(
                    <button key={r.label} className="mini-row" style={{ width:'100%', border:'none', background:'transparent', fontFamily:'Sora,sans-serif' }} onClick={()=>router.push(r.href)}>
                      <span>{r.label}</span>
                      <span className="adm-mono">{r.val}</span>
                    </button>
                  ))}
                </div>

                {/* Engagement */}
                <div className="mini-panel">
                  <div className="sec-hd">User Engagement</div>
                  {[
                    { label:'Active Carts',    val:stats?.carts.total||0 },
                    { label:'Searches Today',  val:stats?.searches.total||0 },
                    { label:'Reviews',         val:stats?.reviews.total||0 },
                  ].map(r=>(
                    <div key={r.label} className="mini-row" style={{ cursor:'default' }}>
                      <span>{r.label}</span>
                      <span className="adm-mono">{r.val}</span>
                    </div>
                  ))}
                </div>

                {/* Moderation */}
                <div className="mini-panel">
                  <div className="sec-hd">Moderation Queue</div>
                  {[
                    { label:'Pending Comments', val:stats?.comments.pending||0,  href:'/admin/comments',    warn:true },
                    { label:'Pending Reviews',  val:stats?.reviews.pending||0,   href:'/admin/reviews',     warn:true },
                    { label:'Draft Businesses', val:stats?.businesses.draft||0,  href:'/admin/businesses',  warn:false },
                  ].map(r=>(
                    <button key={r.label} className="mini-row" style={{ width:'100%', border:'none', background:'transparent', fontFamily:'Sora,sans-serif' }} onClick={()=>router.push(r.href)}>
                      <span>{r.label}</span>
                      <span className="adm-mono" style={{ color: r.val>0&&r.warn ? '#fbbf24' : '#f0f0f5' }}>{r.val}</span>
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