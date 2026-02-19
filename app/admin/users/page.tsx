/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useMemo } from 'react';
import {
  Search, Plus, Edit2, Trash2, Ban, CheckCircle,
  Download, Calendar, Activity, Shield, Mail, Phone, Clock, X, Users
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import Image from 'next/image';

/* ─── Types ───────────────────────────────────────────────────── */
type User = {
  id: string; name: string; email: string; phone?: string; image?: string;
  role: string; isActive: boolean; emailVerified: Date | null;
  lastLoginAt: Date | null; createdAt: Date;
  _count?: { businesses:number; carts:number; comments:number; reviews:number; searches:number };
};
type UserStats = {
  total:number; active:number; inactive:number; admins:number; editors:number;
  authors:number; reviewers:number; users:number;
  newToday:number; newThisWeek:number; newThisMonth:number;
};

/* ─── Styles ──────────────────────────────────────────────────── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  /* stat card */
  .u-sc {
    background:#13131a; border:1px solid rgba(255,255,255,0.07);
    border-radius:12px; padding:1rem 1.25rem;
    display:flex; align-items:center; justify-content:space-between;
  }
  .u-sc-icon { width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center; }

  /* table */
  .u-table { width:100%; border-collapse:collapse; }
  .u-table th {
    padding:0.65rem 1rem; text-align:left; font-size:0.7rem;
    font-weight:700; color:#55556e; text-transform:uppercase;
    letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06);
    white-space:nowrap; background:#13131a;
  }
  .u-table td {
    padding:0.9rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04);
    vertical-align:middle;
  }
  .u-table tbody tr { transition:background 0.15s; }
  .u-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .u-table tbody tr.selected { background:rgba(99,102,241,0.06); }

  /* inputs */
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

  /* buttons */
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.83rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-success { background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.25); }
  .btn-success:hover { background:rgba(16,185,129,0.25); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }

  /* modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:440px; box-shadow:0 24px 80px rgba(0,0,0,0.6); }

  /* form fields */
  .f-label { display:block; font-size:0.78rem; font-weight:600; color:#9494b0; margin-bottom:0.4rem; }
  .f-input {
    width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
    border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5;
    font-family:'Sora',sans-serif; font-size:0.84rem; outline:none;
    transition:border-color 0.2s, box-shadow 0.2s; box-sizing:border-box;
  }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .f-input:disabled { opacity:0.4; cursor:not-allowed; }
  .f-select {
    width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09);
    border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5;
    font-family:'Sora',sans-serif; font-size:0.84rem; outline:none;
    transition:border-color 0.2s; box-sizing:border-box; cursor:pointer;
  }
  .f-select:focus { border-color:rgba(99,102,241,0.5); }
  .f-select option { background:#1a1a24; }

  /* bulk bar */
  .bulk-bar { display:flex; align-items:center; gap:0.75rem; padding:0.65rem 1rem; background:rgba(99,102,241,0.07); border-bottom:1px solid rgba(99,102,241,0.15); font-size:0.82rem; color:#a5b4fc; }

  /* avatar */
  .avatar { width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.9rem; color:#fff; flex-shrink:0; }

  /* role badge */
  .rb { display:inline-flex; align-items:center; padding:0.2rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:700; letter-spacing:0.04em; }

  /* status pill */
  .sp { display:inline-flex; align-items:center; gap:0.3rem; padding:0.25rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:600; cursor:pointer; transition:all 0.15s; border:none; font-family:'Sora',sans-serif; }

  /* scrollbar */
  .u-scroll::-webkit-scrollbar { width:4px; height:4px; }
  .u-scroll::-webkit-scrollbar-track { background:transparent; }
  .u-scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }

  /* skel */
  .skel { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
`;

/* ─── Helpers ─────────────────────────────────────────────────── */
const ROLE_BADGE: Record<string, { bg:string; color:string }> = {
  user:     { bg:'rgba(148,148,176,0.12)', color:'#9494b0' },
  author:   { bg:'rgba(99,102,241,0.12)',  color:'#818cf8' },
  editor:   { bg:'rgba(139,92,246,0.12)',  color:'#a78bfa' },
  reviewer: { bg:'rgba(16,185,129,0.12)',  color:'#34d399' },
  admin:    { bg:'rgba(239,68,68,0.12)',   color:'#f87171' },
};
const AVATAR_GRAD: Record<string, string> = {
  user:'from-slate-500 to-slate-600', author:'from-blue-500 to-indigo-600',
  editor:'from-violet-500 to-purple-600', reviewer:'from-emerald-500 to-teal-600',
  admin:'from-rose-500 to-red-600',
};
const ICON_COLORS = { blue:'rgba(99,102,241,0.15)', green:'rgba(16,185,129,0.15)', red:'rgba(239,68,68,0.15)', purple:'rgba(139,92,246,0.15)', orange:'rgba(245,158,11,0.15)' };
const ICON_FG    = { blue:'#818cf8', green:'#34d399', red:'#f87171', purple:'#a78bfa', orange:'#fbbf24' };

/* ─── Main ────────────────────────────────────────────────────── */
export default function UsersManagementPage() {
  const [users,       setUsers]       = useState<User[]>([]);
  const [stats,       setStats]       = useState<UserStats|null>(null);
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('all');
  const [statusFilter,setStatusFilter]= useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User|null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [formData,    setFormData]    = useState({ name:'', email:'', phone:'', role:'user', isActive:true });

  useEffect(() => { fetchUsers(); fetchStats(); }, []);

  const filteredUsers = useMemo(() => {
    let f = users;
    if (search) f = f.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.phone?.toLowerCase().includes(search.toLowerCase()));
    if (roleFilter   !== 'all') f = f.filter(u => u.role === roleFilter);
    if (statusFilter === 'active')   f = f.filter(u => u.isActive);
    if (statusFilter === 'inactive') f = f.filter(u => !u.isActive);
    return f;
  }, [users, search, roleFilter, statusFilter]);

  async function fetchUsers() {
    try { const r = await fetch('/api/admin/users'); if(r.ok) setUsers(await r.json()); else toast.error('Failed to load users'); }
    catch { toast.error('Failed to load users'); }
  }
  async function fetchStats() {
    try { const r = await fetch('/api/admin/users/stats'); if(r.ok) setStats(await r.json()); } catch {}
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const method = editingUser ? 'PATCH' : 'POST';
      const body   = editingUser ? { ...formData, userId:editingUser.id } : formData;
      const r = await fetch('/api/admin/users', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (!r.ok) throw new Error();
      toast.success(editingUser ? 'User updated!' : 'User created!');
      closeModal(); fetchUsers(); fetchStats();
    } catch { toast.error('Something went wrong!'); }
    finally { setLoading(false); }
  }
  async function handleToggleStatus(user: User) {
    try {
      const r = await fetch('/api/admin/users', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:user.id, isActive:!user.isActive }) });
      if (!r.ok) throw new Error();
      toast.success(user.isActive ? 'User deactivated' : 'User activated');
      fetchUsers(); fetchStats();
    } catch { toast.error('Failed to update status'); }
  }
  async function handleDelete(id: string) {
    if (!confirm('Delete this user?')) return;
    try {
      const r = await fetch('/api/admin/users', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ userId:id }) });
      if (!r.ok) throw new Error();
      toast.success('User deleted!'); fetchUsers(); fetchStats();
    } catch { toast.error('Failed to delete user'); }
  }
  function handleExport() {
    const csv = [
      ['ID','Name','Email','Phone','Role','Status','Created','Last Login'],
      ...filteredUsers.map(u=>[u.id,u.name,u.email,u.phone||'',u.role,u.isActive?'Active':'Inactive',new Date(u.createdAt).toLocaleDateString(),u.lastLoginAt?new Date(u.lastLoginAt).toLocaleDateString():'Never']),
    ].map(r=>r.join(',')).join('\n');
    const a = Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download:`users-${new Date().toISOString()}.csv` });
    a.click(); toast.success('Exported!');
  }
  function openModal() { setFormData({name:'',email:'',phone:'',role:'user',isActive:true}); setEditingUser(null); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setEditingUser(null); }
  function openEditModal(u: User) { setFormData({name:u.name,email:u.email,phone:u.phone||'',role:u.role,isActive:u.isActive}); setEditingUser(u); setIsModalOpen(true); }
  function toggleSelect(id: string) { setSelectedIds(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id]); }
  function toggleSelectAll() { setSelectedIds(selectedIds.length===filteredUsers.length ? [] : filteredUsers.map(u=>u.id)); }

  const rb = (role: string) => ROLE_BADGE[role] ?? ROLE_BADGE.user;

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style:{ background:'#1a1a24', color:'#f0f0f5', border:'1px solid rgba(255,255,255,0.09)' } }} />
      <div className="adm" style={{ minHeight:'100vh' }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>Users Management</h1>
            <p style={{ fontSize:'0.84rem', color:'#55556e' }}>Manage user accounts, roles, and permissions</p>
          </div>
          <div style={{ display:'flex', gap:'0.65rem', flexWrap:'wrap' }}>
            <button className="btn btn-success" onClick={handleExport}><Download size={14} />Export</button>
            <button className="btn btn-primary" onClick={openModal}><Plus size={14} />Add User</button>
          </div>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
            {[
              { label:'Total Users',    val:stats.total,       sub:`${stats.active} active`, ic:Users,    col:'blue' },
              { label:'Admins',         val:stats.admins,      sub:'',                       ic:Shield,   col:'red' },
              { label:'Editors',        val:stats.editors,     sub:'',                       ic:Edit2,    col:'purple' },
              { label:'New This Week',  val:stats.newThisWeek, sub:'',                       ic:Calendar, col:'green' },
              { label:'New Today',      val:stats.newToday,    sub:'',                       ic:Activity, col:'orange' },
            ].map(s=>(
              <div key={s.label} className="u-sc">
                <div>
                  <div style={{ fontSize:'0.7rem', color:'#55556e', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.4rem' }}>{s.label}</div>
                  <div className="adm-mono" style={{ fontSize:'1.5rem', fontWeight:700 }}>{s.val.toLocaleString()}</div>
                  {s.sub && <div style={{ fontSize:'0.72rem', color:'#9494b0', marginTop:'0.15rem' }}>{s.sub}</div>}
                </div>
                <div className="u-sc-icon" style={{ background:(ICON_COLORS as any)[s.col] }}>
                  <s.ic size={16} color={(ICON_FG as any)[s.col]} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Filters ── */}
        <div style={{ display:'flex', gap:'0.65rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#55556e', pointerEvents:'none' }} />
            <input type="text" placeholder="Search by name, email, or phone…" value={search} onChange={e=>setSearch(e.target.value)} className="u-input" />
          </div>
          <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} className="u-select">
            <option value="all">All Roles</option>
            {['admin','editor','author','reviewer','user'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="u-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{ background:'#13131a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
          {selectedIds.length>0 && (
            <div className="bulk-bar">
              <span>{selectedIds.length} selected</span>
              <button className="btn btn-danger" style={{ padding:'0.3rem 0.75rem', fontSize:'0.76rem' }} onClick={async()=>{ if(!confirm(`Delete ${selectedIds.length} users?`))return; await Promise.all(selectedIds.map(id=>fetch('/api/admin/users',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:id})}))); setSelectedIds([]); fetchUsers(); fetchStats(); toast.success('Deleted!'); }}>Delete selected</button>
              <button className="btn btn-ghost" style={{ padding:'0.3rem 0.75rem', fontSize:'0.76rem' }} onClick={()=>setSelectedIds([])}>Clear</button>
            </div>
          )}
          <div className="u-scroll" style={{ overflowX:'auto' }}>
            <table className="u-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft:'1.25rem', width:40 }}>
                    <input type="checkbox" checked={selectedIds.length===filteredUsers.length&&filteredUsers.length>0} onChange={toggleSelectAll} style={{ accentColor:'#6366f1', cursor:'pointer' }} />
                  </th>
                  <th>User</th><th>Contact</th><th>Role</th><th>Status</th><th>Activity</th><th>Last Login</th>
                  <th style={{ textAlign:'right', paddingRight:'1.25rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length===0 ? (
                  <tr><td colSpan={8} style={{ textAlign:'center', padding:'3.5rem 1rem', color:'#3a3a56' }}>
                    <Users size={36} style={{ margin:'0 auto 0.75rem', display:'block' }} />
                    <div style={{ fontSize:'0.9rem', fontWeight:600, color:'#55556e' }}>{search||roleFilter!=='all'||statusFilter!=='all'?'No users match your filters':'No users yet'}</div>
                  </td></tr>
                ) : filteredUsers.map(user=>(
                  <tr key={user.id} className={selectedIds.includes(user.id)?'selected':''}>
                    <td style={{ paddingLeft:'1.25rem' }}>
                      <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={()=>toggleSelect(user.id)} style={{ accentColor:'#6366f1', cursor:'pointer' }} />
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        {user.image ? (
                          <Image src={user.image} alt={user.name} width={38} height={38} style={{ borderRadius:'50%', border:'1px solid rgba(255,255,255,0.08)' }} />
                        ) : (
                          <div className="avatar" style={{ background:`linear-gradient(135deg, ${user.role==='admin'?'#f43f5e,#dc2626':user.role==='editor'?'#8b5cf6,#7c3aed':user.role==='reviewer'?'#10b981,#059669':'#6366f1,#4f46e5'})` }}>
                            {user.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#f0f0f5' }}>{user.name}</div>
                          <div style={{ fontSize:'0.72rem', color:'#55556e', fontFamily:'DM Mono,monospace' }}>{user.id.slice(0,10)}…</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', color:'#9494b0' }}><Mail size={12} />{user.email}</div>
                        {user.phone && <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.8rem', color:'#9494b0' }}><Phone size={12} />{user.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <span className="rb" style={{ background:rb(user.role).bg, color:rb(user.role).color }}>
                        {user.role.charAt(0).toUpperCase()+user.role.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button onClick={()=>handleToggleStatus(user)} className="sp"
                        style={{ background:user.isActive?'rgba(16,185,129,0.12)':'rgba(239,68,68,0.1)', color:user.isActive?'#34d399':'#f87171' }}>
                        {user.isActive ? <><CheckCircle size={11} />Active</> : <><Ban size={11} />Inactive</>}
                      </button>
                    </td>
                    <td>
                      <div style={{ fontSize:'0.75rem', color:'#9494b0', display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                        <span>{user._count?.carts||0} carts</span>
                        <span style={{ color:'#3a3a56' }}>·</span>
                        <span>{user._count?.comments||0} comments</span>
                        <span style={{ color:'#3a3a56' }}>·</span>
                        <span>{user._count?.reviews||0} reviews</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.78rem', color:'#9494b0' }}>
                        <Clock size={12} />
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </div>
                    </td>
                    <td style={{ paddingRight:'1.25rem', textAlign:'right' }}>
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.25rem' }}>
                        <button className="btn btn-ghost btn-icon" onClick={()=>openEditModal(user)} title="Edit"><Edit2 size={14} /></button>
                        <button className="btn btn-danger btn-icon" onClick={()=>handleDelete(user.id)} title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Footer count */}
          <div style={{ padding:'0.65rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:'0.75rem', color:'#55556e' }}>
            Showing <span style={{ color:'#9494b0', fontWeight:600 }}>{filteredUsers.length}</span> of <span style={{ color:'#9494b0', fontWeight:600 }}>{users.length}</span> users
          </div>
        </div>

        {/* ── Modal ── */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>{editingUser ? 'Edit User' : 'Add User'}</h2>
                <button onClick={closeModal} className="btn btn-ghost btn-icon"><X size={16} /></button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div><label className="f-label">Name</label><input type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="f-input" placeholder="Full name" /></div>
                <div><label className="f-label">Email</label><input type="email" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})} className="f-input" placeholder="email@example.com" disabled={!!editingUser} /></div>
                <div><label className="f-label">Phone</label><input type="tel" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} className="f-input" placeholder="+254 …" /></div>
                <div><label className="f-label">Role</label>
                  <select value={formData.role} onChange={e=>setFormData({...formData,role:e.target.value})} className="f-select">
                    {['user','author','editor','reviewer','admin'].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer' }}>
                  <input type="checkbox" checked={formData.isActive} onChange={e=>setFormData({...formData,isActive:e.target.checked})} style={{ accentColor:'#6366f1', width:16, height:16 }} />
                  <span style={{ fontSize:'0.84rem', color:'#9494b0', fontWeight:500 }}>Active account</span>
                </label>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.65rem', marginTop:'0.5rem' }}>
                  <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading?'Saving…':editingUser?'Update':'Create'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}