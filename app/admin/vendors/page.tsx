'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Plus, Search, Edit2, Trash2, ExternalLink, X, Store, Globe } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

/* ── This page is a complete replacement for the vendors page. ──
   VendorTable and VendorModal have been inlined so the dark theme
   is self-contained. Swap the import path in your app router.      */

type Vendor = {
  id: number; name: string; website?: string | null; logo?: string | null;
  _count?: { products: number };
  createdAt?: string;
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .v-table { width:100%; border-collapse:collapse; }
  .v-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); background:#13131a; white-space:nowrap; }
  .v-table td { padding:0.9rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .v-table tbody tr { transition:background 0.15s; }
  .v-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .v-table tbody tr.sel { background:rgba(99,102,241,0.06); }

  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }

  .bulk-bar { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 1rem; background:rgba(99,102,241,0.07); border-bottom:1px solid rgba(99,102,241,0.15); font-size:0.82rem; color:#a5b4fc; }

  .logo-wrap { width:40px; height:40px; border-radius:10px; overflow:hidden; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .logo-fallback { width:40px; height:40px; border-radius:10px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  .v-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:13px; padding:1.1rem; transition:all 0.2s; }
  .v-card:hover { border-color:rgba(99,102,241,0.25); box-shadow:0 6px 24px rgba(0,0,0,0.3); }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:440px; box-shadow:0 24px 80px rgba(0,0,0,0.6); }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }

  .stat-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; }

  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

export default function VendorsPage() {
  const [vendors,      setVendors]      = useState<Vendor[]>([]);
  const [search,       setSearch]       = useState('');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [editingVendor,setEditingVendor]= useState<Vendor|null>(null);
  const [selectedIds,  setSelectedIds]  = useState<number[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [deleteId,     setDeleteId]     = useState<number|null>(null);
  const [formData,     setFormData]     = useState({ name:'', website:'', logo:'' });

  useEffect(() => { fetchVendors(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase();
    return vendors.filter(v => v.name.toLowerCase().includes(q) || v.website?.toLowerCase().includes(q));
  }, [vendors, search]);

  async function fetchVendors() {
    try {
      const r = await fetch('/api/vendors');
      if (r.ok) setVendors(await r.json());
      else toast.error('Failed to load vendors');
    } catch { toast.error('Failed to load vendors'); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true);
    try {
      const method = editingVendor ? 'PATCH' : 'POST';
      const body   = editingVendor ? { ...formData, id:editingVendor.id } : formData;
      const r = await fetch('/api/vendors', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (!r.ok) throw new Error();
      toast.success(editingVendor ? 'Vendor updated!' : 'Vendor created!');
      closeModal(); fetchVendors();
    } catch { toast.error('Something went wrong!'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    try {
      const r = await fetch(`/api/vendors/${id}`, { method:'DELETE' });
      if (!r.ok) { const d=await r.json(); throw new Error(d.error||'Failed'); }
      toast.success('Vendor deleted!'); setDeleteId(null); fetchVendors();
    } catch(err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  }

  async function handleBulkDelete() {
    if (!confirm(`Delete ${selectedIds.length} vendors?`)) return;
    await Promise.all(selectedIds.map(id => fetch(`/api/vendors/${id}`, { method:'DELETE' })));
    toast.success(`${selectedIds.length} vendors deleted!`); setSelectedIds([]); fetchVendors();
  }

  function openCreate() { setFormData({name:'',website:'',logo:''}); setEditingVendor(null); setIsModalOpen(true); }
  function openEdit(v: Vendor) { setFormData({name:v.name,website:v.website||'',logo:v.logo||''}); setEditingVendor(v); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setEditingVendor(null); }
  function toggleSelect(id: number) { setSelectedIds(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id]); }
  function toggleSelectAll() { setSelectedIds(selectedIds.length===filtered.length ? [] : filtered.map(v=>v.id)); }

  const totalProducts = vendors.reduce((s,v)=>s+(v._count?.products||0),0);

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style:{background:'#1a1a24',color:'#f0f0f5',border:'1px solid rgba(255,255,255,0.09)'} }} />
      <div className="adm" style={{ minHeight:'100vh' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>Vendors</h1>
            <p style={{ fontSize:'0.84rem', color:'#55556e' }}>Manage product vendors and suppliers</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={14}/>Add Vendor</button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.75rem', marginBottom:'1.25rem' }}>
          {[
            { label:'Total Vendors',  val:vendors.length,  color:'#818cf8', bg:'rgba(99,102,241,0.12)' },
            { label:'With Website',   val:vendors.filter(v=>v.website).length, color:'#34d399', bg:'rgba(16,185,129,0.12)' },
            { label:'Total Products', val:totalProducts, color:'#fbbf24', bg:'rgba(245,158,11,0.1)' },
            { label:'Filtered',       val:filtered.length,  color:'#a78bfa', bg:'rgba(139,92,246,0.12)' },
          ].map(s=>(
            <div key={s.label} className="stat-card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:'0.7rem', color:'#55556e', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:'0.35rem' }}>{s.label}</div>
                <div className="adm-mono" style={{ fontSize:'1.5rem', fontWeight:700 }}>{s.val}</div>
              </div>
              <div style={{ width:36, height:36, borderRadius:9, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Store size={16} color={s.color} />
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:'0.65rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#55556e', pointerEvents:'none' }} />
            <input type="text" placeholder="Search vendors or websites…" value={search} onChange={e=>setSearch(e.target.value)} className="u-input" />
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#55556e', cursor:'pointer', padding:0 }}><X size={14}/></button>}
          </div>
          {selectedIds.length>0 && (
            <button className="btn btn-danger" onClick={handleBulkDelete}><Trash2 size={14}/>Delete {selectedIds.length}</button>
          )}
        </div>

        {/* Table */}
        <div style={{ background:'#13131a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
          {selectedIds.length>0 && (
            <div className="bulk-bar">
              <span>{selectedIds.length} selected</span>
              <button className="btn btn-ghost" style={{ padding:'0.28rem 0.65rem', fontSize:'0.75rem' }} onClick={()=>setSelectedIds([])}>Clear</button>
            </div>
          )}
          <div className="scroll" style={{ overflowX:'auto' }}>
            <table className="v-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft:'1.25rem', width:40 }}><input type="checkbox" checked={selectedIds.length===filtered.length&&filtered.length>0} onChange={toggleSelectAll} style={{ accentColor:'#6366f1', cursor:'pointer' }} /></th>
                  <th style={{ width:60 }}>Logo</th>
                  <th>Name</th>
                  <th>Website</th>
                  <th>Products</th>
                  <th style={{ textAlign:'right', paddingRight:'1.25rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:'3.5rem', color:'#3a3a56' }}>
                    <Store size={32} style={{ margin:'0 auto 0.75rem', display:'block' }} />
                    <div style={{ color:'#55556e', fontWeight:600 }}>{search?'No vendors match your search':'No vendors yet'}</div>
                    {!search && <button onClick={openCreate} style={{ marginTop:'0.65rem', fontSize:'0.8rem', color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif', textDecoration:'underline' }}>Add your first vendor</button>}
                  </td></tr>
                ) : filtered.map(vendor=>(
                  <tr key={vendor.id} className={selectedIds.includes(vendor.id)?'sel':''}>
                    <td style={{ paddingLeft:'1.25rem' }}><input type="checkbox" checked={selectedIds.includes(vendor.id)} onChange={()=>toggleSelect(vendor.id)} style={{ accentColor:'#6366f1', cursor:'pointer' }} /></td>
                    <td>
                      {vendor.logo ? (
                        <div className="logo-wrap">
                          <Image src={vendor.logo} alt={vendor.name} width={40} height={40} style={{ objectFit:'cover', width:'100%', height:'100%' }} />
                        </div>
                      ) : (
                        <div className="logo-fallback"><Store size={16} color="#818cf8" /></div>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight:700, fontSize:'0.88rem', color:'#f0f0f5' }}>{vendor.name}</span>
                    </td>
                    <td>
                      {vendor.website ? (
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'0.35rem', color:'#818cf8', fontSize:'0.82rem', textDecoration:'none', transition:'color 0.15s' }}>
                          <Globe size={13}/>{vendor.website.replace(/^https?:\/\//,'')}
                          <ExternalLink size={11}/>
                        </a>
                      ) : <span style={{ color:'#3a3a56' }}>—</span>}
                    </td>
                    <td>
                      <span className="adm-mono" style={{ fontSize:'0.85rem', color:'#9494b0' }}>
                        {vendor._count?.products ?? 0}
                      </span>
                    </td>
                    <td style={{ paddingRight:'1.25rem', textAlign:'right' }}>
                      <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.25rem' }}>
                        <button className="btn btn-ghost btn-icon" onClick={()=>openEdit(vendor)} title="Edit"><Edit2 size={14}/></button>
                        <button className="btn btn-danger btn-icon" onClick={()=>setDeleteId(vendor.id)} title="Delete"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'0.65rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:'0.75rem', color:'#55556e' }}>
            Showing <span style={{ color:'#9494b0', fontWeight:600 }}>{filtered.length}</span> of <span style={{ color:'#9494b0', fontWeight:600 }}>{vendors.length}</span> vendors
          </div>
        </div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>{editingVendor?'Edit':'Add'} Vendor</h2>
                <button onClick={closeModal} className="btn btn-ghost btn-icon"><X size={16}/></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
                <div>
                  <label className="f-label">Name <span style={{ color:'#f87171' }}>*</span></label>
                  <input type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} className="f-input" placeholder="Vendor name" required autoFocus />
                </div>
                <div>
                  <label className="f-label">Website</label>
                  <input type="url" value={formData.website} onChange={e=>setFormData({...formData,website:e.target.value})} className="f-input" placeholder="https://vendor.com" />
                </div>
                <div>
                  <label className="f-label">Logo URL</label>
                  <input type="url" value={formData.logo} onChange={e=>setFormData({...formData,logo:e.target.value})} className="f-input" placeholder="https://vendor.com/logo.png" />
                  {formData.logo && (
                    <div style={{ marginTop:'0.6rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <div className="logo-wrap"><Image src={formData.logo} alt="preview" width={40} height={40} style={{ objectFit:'cover', width:'100%', height:'100%' }} /></div>
                      <span style={{ fontSize:'0.75rem', color:'#55556e' }}>Preview</span>
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.65rem', marginTop:'0.5rem' }}>
                  <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>{loading?'Saving…':editingVendor?'Update':'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteId!==null && (
          <div className="modal-overlay" onClick={()=>setDeleteId(null)}>
            <div className="modal-box" style={{ maxWidth:380 }} onClick={e=>e.stopPropagation()}>
              <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.85rem' }}>
                  <Trash2 size={20} color="#f87171" />
                </div>
                <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'0.4rem' }}>Delete vendor?</h3>
                <p style={{ fontSize:'0.82rem', color:'#9494b0' }}>This will permanently remove the vendor. Products linked to them will be unaffected.</p>
              </div>
              <div style={{ display:'flex', gap:'0.65rem', justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={()=>setDeleteId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={()=>handleDelete(deleteId)}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}