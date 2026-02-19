'use client';
import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Tag, ExternalLink, X } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getCategoryIcon } from '@/components/CategoryCard';

type Category = {
  id: number; name: string; slug: string;
  createdAt: string; updatedAt: string;
  _count: { businesses: number };
};

function generateSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .c-table { width:100%; border-collapse:collapse; }
  .c-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .c-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .c-table tbody tr { transition:background 0.15s; }
  .c-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .c-table tbody tr.sel { background:rgba(16,185,129,0.05); }

  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(16,185,129,0.5); box-shadow:0 0 0 3px rgba(16,185,129,0.08); }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#10b981,#059669); color:#fff; box-shadow:0 4px 14px rgba(16,185,129,0.25); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(16,185,129,0.35); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-icon { padding:0.45rem; border-radius:8px; }

  .bulk-bar { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 1rem; background:rgba(239,68,68,0.06); border-bottom:1px solid rgba(239,68,68,0.12); font-size:0.82rem; color:#f87171; }

  .biz-badge { display:inline-flex; align-items:center; padding:0.22rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:700; }
  .code-slug { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.05); border-radius:6px; padding:0.22rem 0.55rem; font-family:'DM Mono',monospace; font-size:0.74rem; color:#9494b0; }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:440px; box-shadow:0 24px 80px rgba(0,0,0,0.6); }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(16,185,129,0.5); box-shadow:0 0 0 3px rgba(16,185,129,0.08); }

  .preview-box { display:flex; align-items:center; gap:0.75rem; padding:0.85rem 1rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); border-radius:10px; }
  .preview-icon { width:36px; height:36px; border-radius:9px; background:rgba(16,185,129,0.12); display:flex; align-items:center; justify-content:center; flex-shrink:0; }

  .scroll::-webkit-scrollbar { width:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

export default function AdminCategoriesPage() {
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [search,          setSearch]          = useState('');
  const [loading,         setLoading]         = useState(false);
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category|null>(null);
  const [selectedIds,     setSelectedIds]     = useState<number[]>([]);
  const [formData,        setFormData]        = useState({ name:'', slug:'' });
  const [slugManual,      setSlugManual]      = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, search]);

  async function fetchCategories() {
    try { const r = await fetch('/api/admin/categories'); if(r.ok) setCategories(await r.json()); }
    catch { toast.error('Failed to load categories'); }
  }

  function openCreate() { setFormData({name:'',slug:''}); setSlugManual(false); setEditingCategory(null); setIsModalOpen(true); }
  function openEdit(cat: Category) { setFormData({name:cat.name,slug:cat.slug}); setSlugManual(true); setEditingCategory(cat); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setEditingCategory(null); }
  function handleNameChange(name: string) { setFormData(p=>({ name, slug:slugManual?p.slug:generateSlug(name) })); }
  function handleSlugChange(slug: string) { setSlugManual(true); setFormData(p=>({...p,slug})); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    if (!formData.slug.trim()) { toast.error('Slug is required'); return; }
    setLoading(true);
    try {
      const method = editingCategory ? 'PATCH' : 'POST';
      const body   = editingCategory ? { id:editingCategory.id, ...formData } : formData;
      const r = await fetch('/api/admin/categories', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error||'Failed to save');
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      closeModal(); fetchCategories();
    } catch(err) { toast.error(err instanceof Error ? err.message : 'Something went wrong'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number, bizCount: number) {
    if (bizCount>0) { toast.error(`Cannot delete — ${bizCount} business${bizCount!==1?'es are':' is'} using this category.`); return; }
    if (!confirm('Delete this category?')) return;
    try {
      const r = await fetch('/api/admin/categories', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error||'Failed');
      toast.success('Category deleted'); fetchCategories();
    } catch(err) { toast.error(err instanceof Error ? err.message : 'Failed to delete'); }
  }

  async function handleBulkDelete() {
    const blocked = categories.filter(c=>selectedIds.includes(c.id)&&c._count.businesses>0);
    if (blocked.length>0) { toast.error(`${blocked.length} categor${blocked.length>1?'ies have':' has'} businesses attached.`); return; }
    if (!confirm(`Delete ${selectedIds.length} categories?`)) return;
    try {
      await Promise.all(selectedIds.map(id=>fetch('/api/admin/categories',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})));
      toast.success(`${selectedIds.length} categories deleted`); setSelectedIds([]); fetchCategories();
    } catch { toast.error('Bulk delete failed'); }
  }

  function toggleSelectAll() { setSelectedIds(selectedIds.length===filtered.length?[]:filtered.map(c=>c.id)); }
  function toggleSelect(id: number) { setSelectedIds(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id]); }

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style:{background:'#1a1a24',color:'#f0f0f5',border:'1px solid rgba(255,255,255,0.09)'} }} />
      <div className="adm" style={{ minHeight:'100vh' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>Categories</h1>
            <p style={{ fontSize:'0.84rem', color:'#55556e' }}>Manage business categories — {categories.length} total</p>
          </div>
          <div style={{ display:'flex', gap:'0.65rem', alignItems:'center' }}>
            {selectedIds.length>0 && <button className="btn btn-danger" onClick={handleBulkDelete}><Trash2 size={14}/>Delete {selectedIds.length}</button>}
            <button className="btn btn-primary" onClick={openCreate}><Plus size={14}/>Add Category</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:'1rem', maxWidth:480 }}>
          <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#55556e', pointerEvents:'none' }} />
          <input type="text" placeholder="Search categories…" value={search} onChange={e=>setSearch(e.target.value)} className="u-input" />
          {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#55556e', cursor:'pointer', padding:0 }}><X size={14}/></button>}
        </div>

        {/* Stats row */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          {[
            { label:'Total', val:categories.length, bg:'rgba(16,185,129,0.12)', color:'#34d399' },
            { label:'With businesses', val:categories.filter(c=>c._count.businesses>0).length, bg:'rgba(99,102,241,0.12)', color:'#818cf8' },
            { label:'Empty', val:categories.filter(c=>c._count.businesses===0).length, bg:'rgba(245,158,11,0.1)', color:'#fbbf24' },
          ].map(s=>(
            <div key={s.label} style={{ background:s.bg, border:`1px solid ${s.color}22`, borderRadius:10, padding:'0.5rem 1rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
              <span style={{ fontSize:'1.15rem', fontWeight:700, color:s.color, fontFamily:'DM Mono,monospace' }}>{s.val}</span>
              <span style={{ fontSize:'0.75rem', color:s.color, opacity:0.75 }}>{s.label}</span>
            </div>
          ))}
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
            <table className="c-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft:'1.25rem', width:40 }}><input type="checkbox" checked={selectedIds.length===filtered.length&&filtered.length>0} onChange={toggleSelectAll} style={{ accentColor:'#10b981', cursor:'pointer' }} /></th>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Businesses</th>
                  <th className="hidden md:table-cell">Created</th>
                  <th style={{ textAlign:'right', paddingRight:'1.25rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={6} style={{ textAlign:'center', padding:'3.5rem', color:'#3a3a56' }}>
                    <Tag size={32} style={{ margin:'0 auto 0.75rem', display:'block' }} />
                    <div style={{ color:'#55556e', fontWeight:600 }}>{search?`No categories match "${search}"`:'No categories yet'}</div>
                    {!search && <button onClick={openCreate} style={{ marginTop:'0.75rem', fontSize:'0.8rem', color:'#34d399', background:'none', border:'none', cursor:'pointer', textDecoration:'underline', fontFamily:'Sora,sans-serif' }}>Create your first category</button>}
                  </td></tr>
                ) : filtered.map(cat=>{
                  const Icon = getCategoryIcon(cat.name);
                  return (
                    <tr key={cat.id} className={selectedIds.includes(cat.id)?'sel':''}>
                      <td style={{ paddingLeft:'1.25rem' }}><input type="checkbox" checked={selectedIds.includes(cat.id)} onChange={()=>toggleSelect(cat.id)} style={{ accentColor:'#10b981', cursor:'pointer' }} /></td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <Icon size={16} color="#34d399" strokeWidth={1.75} />
                          </div>
                          <span style={{ fontWeight:600, fontSize:'0.88rem', color:'#f0f0f5' }}>{cat.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          <span className="code-slug">{cat.slug}</span>
                          <a href={`/categories/${cat.slug}`} target="_blank" rel="noopener noreferrer" style={{ color:'#3a3a56', transition:'color 0.15s' }} title="View public page">
                            <ExternalLink size={13}/>
                          </a>
                        </div>
                      </td>
                      <td>
                        <span className="biz-badge" style={{ background:cat._count.businesses>0?'rgba(16,185,129,0.1)':'rgba(255,255,255,0.05)', color:cat._count.businesses>0?'#34d399':'#55556e' }}>
                          {cat._count.businesses} {cat._count.businesses===1?'business':'businesses'}
                        </span>
                      </td>
                      <td><span style={{ fontSize:'0.78rem', color:'#55556e' }}>{new Date(cat.createdAt).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'})}</span></td>
                      <td style={{ paddingRight:'1.25rem', textAlign:'right' }}>
                        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.25rem' }}>
                          <button className="btn btn-ghost btn-icon" onClick={()=>openEdit(cat)} title="Edit"><Edit2 size={14}/></button>
                          <button
                            className="btn btn-icon"
                            onClick={()=>handleDelete(cat.id, cat._count.businesses)}
                            title={cat._count.businesses>0?'Cannot delete — has businesses':'Delete'}
                            style={{ background:'none', border:'none', color:cat._count.businesses>0?'#3a3a56':'#f87171', cursor:cat._count.businesses>0?'not-allowed':'pointer' }}
                          ><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding:'0.65rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:'0.75rem', color:'#55556e' }}>
            Showing <span style={{ color:'#9494b0', fontWeight:600 }}>{filtered.length}</span> of <span style={{ color:'#9494b0', fontWeight:600 }}>{categories.length}</span> categories
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>{editingCategory?'Edit Category':'New Category'}</h2>
                <button onClick={closeModal} className="btn btn-ghost btn-icon"><X size={16}/></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                <div>
                  <label className="f-label">Name <span style={{ color:'#f87171' }}>*</span></label>
                  <input type="text" value={formData.name} onChange={e=>handleNameChange(e.target.value)} placeholder="e.g. Technology" className="f-input" autoFocus />
                </div>
                <div>
                  <label className="f-label">Slug <span style={{ color:'#f87171' }}>*</span></label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', fontSize:'0.8rem', color:'#55556e', pointerEvents:'none', userSelect:'none' }}>/categories/</span>
                    <input type="text" value={formData.slug} onChange={e=>handleSlugChange(e.target.value)} placeholder="technology" className="f-input" style={{ paddingLeft:'6.5rem', fontFamily:'DM Mono,monospace' }} />
                  </div>
                  <p style={{ fontSize:'0.72rem', color:'#55556e', marginTop:'0.35rem' }}>Auto-generated from name. Edit manually if needed.</p>
                </div>
                {formData.name && (
                  <div className="preview-box">
                    {(() => { const Icon=getCategoryIcon(formData.name); return <div className="preview-icon"><Icon size={16} color="#34d399" strokeWidth={1.75}/></div>; })()}
                    <div>
                      <div style={{ fontSize:'0.84rem', fontWeight:600, color:'#f0f0f5' }}>{formData.name}</div>
                      <div style={{ fontSize:'0.72rem', color:'#55556e', fontFamily:'DM Mono,monospace' }}>/categories/{formData.slug||'…'}</div>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.65rem', marginTop:'0.5rem' }}>
                  <button type="button" onClick={closeModal} className="btn btn-ghost">Cancel</button>
                  <button type="submit" disabled={loading} className="btn btn-primary">{loading?'Saving…':editingCategory?'Save Changes':'Create Category'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}