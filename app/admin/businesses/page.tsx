/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useMemo } from "react";
import BusinessCSVImport from '@/components/BusinessCSVImport';
import Image from "next/image";
import {
  Search, Plus, Edit2, Trash2, Eye, EyeOff, Download, Tag,
  Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Grid, List,
  Copy, ExternalLink, Building
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

type Category = { id: number; name: string; };
type Business = {
  id: number; name: string; description?: string; image?: string; slug: string;
  published: boolean; category?: Category | null; createdAt: string; updatedAt: string;
  _count?: { requirements: number; };
};
type SortField = 'name' | 'createdAt' | 'requirements' | 'category';
type SortOrder = 'asc' | 'desc';
type ViewMode  = 'table' | 'grid';
const CREATE_NEW = "__CREATE_NEW__";

/* ── Styles ── */
const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .b-table { width:100%; border-collapse:collapse; }
  .b-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .b-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .b-table tbody tr { transition:background 0.15s; }
  .b-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .b-table tbody tr.sel { background:rgba(99,102,241,0.06); }
  .b-table th.sort { cursor:pointer; transition:color 0.15s; }
  .b-table th.sort:hover { color:#a5b4fc; }

  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary  { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-success  { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.22); }
  .btn-success:hover { background:rgba(16,185,129,0.22); }
  .btn-danger   { background:rgba(239,68,68,0.12);  color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover  { background:rgba(239,68,68,0.22); }
  .btn-ghost    { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover   { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-filter   { background:rgba(255,255,255,0.05); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-filter.active { background:rgba(99,102,241,0.12); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .btn-view { padding:0.45rem; border-radius:7px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); color:#9494b0; cursor:pointer; transition:all 0.15s; }
  .btn-view.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }

  .filter-panel { background:#1a1a24; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); }
  .f-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; cursor:pointer; }
  .f-select:focus { border-color:rgba(99,102,241,0.5); }
  .f-select option { background:#1a1a24; }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:none; box-sizing:border-box; }
  .f-textarea::placeholder { color:#3a3a56; }
  .f-textarea:focus { border-color:rgba(99,102,241,0.5); }

  .bulk-bar { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 1rem; background:rgba(99,102,241,0.07); border-bottom:1px solid rgba(99,102,241,0.15); font-size:0.82rem; color:#a5b4fc; }

  .status-pill { display:inline-flex; align-items:center; gap:0.3rem; padding:0.22rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:600; cursor:pointer; transition:all 0.15s; border:none; font-family:'Sora',sans-serif; }
  .cat-pill   { display:inline-flex; align-items:center; gap:0.35rem; padding:0.22rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:600; background:rgba(139,92,246,0.12); color:#a78bfa; }
  .code-pill  { display:inline-flex; align-items:center; gap:0.4rem; background:rgba(255,255,255,0.06); border-radius:6px; padding:0.2rem 0.5rem; font-family:'DM Mono',monospace; font-size:0.74rem; color:#9494b0; }

  .g-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:14px; overflow:hidden; transition:all 0.2s; }
  .g-card:hover { border-color:rgba(99,102,241,0.25); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.35); }
  .g-card.sel { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.04); }

  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:480px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }

  .skel { background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; border-radius:6px; }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

export default function BusinessesAdminPage() {
  const [businesses,      setBusinesses]      = useState<Business[]>([]);
  const [categories,      setCategories]      = useState<Category[]>([]);
  const [search,          setSearch]          = useState('');
  const [isModalOpen,     setIsModalOpen]     = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business|null>(null);
  const [selectedIds,     setSelectedIds]     = useState<number[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [showFilters,     setShowFilters]     = useState(false);
  const [categoryFilter,  setCategoryFilter]  = useState('all');
  const [statusFilter,    setStatusFilter]    = useState('all');
  const [dateFilter,      setDateFilter]      = useState('all');
  const [sortField,       setSortField]       = useState<SortField>('createdAt');
  const [sortOrder,       setSortOrder]       = useState<SortOrder>('desc');
  const [viewMode,        setViewMode]        = useState<ViewMode>('table');
  const [selectedCatId,   setSelectedCatId]   = useState('');
  const [newCatName,      setNewCatName]      = useState('');
  const [formData,        setFormData]        = useState({ name:'', description:'', image:'', slug:'', published:true });

  useEffect(() => { fetchBusinesses(); fetchCategories(); }, []);

  const filtered = useMemo(() => {
    let f = businesses;
    if (search) f = f.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase()) || b.category?.name.toLowerCase().includes(search.toLowerCase()) || b.slug.toLowerCase().includes(search.toLowerCase()));
    if (categoryFilter !== 'all') { if(categoryFilter==='uncategorized') f=f.filter(b=>!b.category); else f=f.filter(b=>b.category?.id===Number(categoryFilter)); }
    if (statusFilter === 'published') f = f.filter(b => b.published);
    if (statusFilter === 'draft')     f = f.filter(b => !b.published);
    if (dateFilter !== 'all') { const now=new Date(); f=f.filter(b=>{ const d=Math.floor((now.getTime()-new Date(b.createdAt).getTime())/(86400000)); return dateFilter==='today'?d===0:dateFilter==='week'?d<=7:d<=30; }); }
    return [...f].sort((a,b)=>{
      let av: string|number='', bv: string|number='';
      if(sortField==='name'){av=a.name.toLowerCase();bv=b.name.toLowerCase();}
      else if(sortField==='createdAt'){av=new Date(a.createdAt).getTime();bv=new Date(b.createdAt).getTime();}
      else if(sortField==='requirements'){av=a._count?.requirements||0;bv=b._count?.requirements||0;}
      else{av=a.category?.name.toLowerCase()||'';bv=b.category?.name.toLowerCase()||'';}
      return av<bv?sortOrder==='asc'?-1:1:av>bv?sortOrder==='asc'?1:-1:0;
    });
  }, [businesses,search,categoryFilter,statusFilter,dateFilter,sortField,sortOrder]);

  const activeFiltersCount = [search!=='',categoryFilter!=='all',statusFilter!=='all',dateFilter!=='all'].filter(Boolean).length;

  function handleSort(field: SortField) { if(sortField===field){setSortOrder(o=>o==='asc'?'desc':'asc');}else{setSortField(field);setSortOrder('asc');} }
  function SortBtn({field,label}:{field:SortField;label:string}) {
    const active = sortField===field;
    return <button onClick={()=>handleSort(field)} style={{ background:'none', border:'none', color:active?'#a5b4fc':'#55556e', fontFamily:'Sora,sans-serif', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.3rem', padding:0 }}>
      {label}
      {active ? (sortOrder==='asc'?<ArrowUp size={11}/>:<ArrowDown size={11}/>) : <ArrowUpDown size={11} style={{opacity:0.4}}/>}
    </button>;
  }

  async function fetchBusinesses() { try { const r=await fetch('/api/admin/businesses'); if(r.ok) setBusinesses(await r.json()); } catch { toast.error('Failed to load businesses'); } }
  async function fetchCategories() { try { const r=await fetch('/api/admin/categories'); if(r.ok) setCategories(await r.json()); } catch {} }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCatId===CREATE_NEW && !newCatName.trim()) { toast.error('Enter a category name'); return; }
    setLoading(true);
    try {
      const catName = selectedCatId===CREATE_NEW ? newCatName.trim() : selectedCatId==='' ? '' : categories.find(c=>c.id===Number(selectedCatId))?.name??'';
      const method = editingBusiness ? 'PATCH' : 'POST';
      const body   = editingBusiness ? {...formData, id:editingBusiness.id, categoryName:catName} : {...formData, categoryName:catName};
      const r = await fetch('/api/admin/businesses', { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
      if (!r.ok) throw new Error();
      toast.success(editingBusiness ? 'Business updated!' : 'Business created!');
      closeModal(); fetchBusinesses(); fetchCategories();
    } catch { toast.error('Something went wrong!'); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this business?')) return;
    try {
      const r = await fetch('/api/admin/businesses', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
      if (!r.ok) { const d=await r.json(); throw new Error(d.error||'Failed'); }
      toast.success('Deleted!'); fetchBusinesses();
    } catch(e) { toast.error(e instanceof Error ? e.message : 'Failed to delete'); }
  }
  async function handleTogglePublish(b: Business) {
    try { const r=await fetch('/api/admin/businesses',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:b.id,published:!b.published})}); if(!r.ok)throw new Error(); toast.success(b.published?'Unpublished':'Published'); fetchBusinesses(); } catch { toast.error('Failed'); }
  }
  async function handleBulkDelete() {
    if(!selectedIds.length) return;
    if(!confirm(`Delete ${selectedIds.length} businesses?`)) return;
    await Promise.all(selectedIds.map(id=>fetch('/api/admin/businesses',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})));
    toast.success(`${selectedIds.length} deleted!`); setSelectedIds([]); fetchBusinesses();
  }
  async function handleBulkPublish(pub: boolean) {
    if(!selectedIds.length) return;
    await Promise.all(selectedIds.map(id=>fetch('/api/admin/businesses',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,published:pub})})));
    toast.success(`${selectedIds.length} ${pub?'published':'unpublished'}!`); setSelectedIds([]); fetchBusinesses();
  }

  function handleExport() {
    const csv=[['ID','Name','Slug','Category','Published','Requirements','Created'],...filtered.map(b=>[b.id,b.name,b.slug,b.category?.name||'',b.published?'Yes':'No',b._count?.requirements||0,new Date(b.createdAt).toLocaleDateString()])].map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob([csv],{type:'text/csv'})),download:`businesses-${new Date().toISOString()}.csv`}).click();
    toast.success('Exported!');
  }

  function openModal() { setFormData({name:'',description:'',image:'',slug:'',published:true}); setEditingBusiness(null); setSelectedCatId(''); setNewCatName(''); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setEditingBusiness(null); }
  function openEditModal(b: Business) {
    setFormData({name:b.name,description:b.description||'',image:b.image||'',slug:b.slug,published:b.published});
    setEditingBusiness(b); setSelectedCatId(b.category?String(b.category.id):''); setNewCatName(''); setIsModalOpen(true);
  }
  function genSlug(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
  function toggleSelectAll() { setSelectedIds(selectedIds.length===filtered.length?[]:filtered.map(b=>b.id)); }
  function toggleSelect(id: number) { setSelectedIds(p=>p.includes(id)?p.filter(i=>i!==id):[...p,id]); }

  return (
    <>
      <style>{S}</style>
      <Toaster position="top-right" toastOptions={{ style:{background:'#1a1a24',color:'#f0f0f5',border:'1px solid rgba(255,255,255,0.09)'} }} />
      <div className="adm" style={{ minHeight:'100vh' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>Businesses</h1>
            <p style={{ fontSize:'0.84rem', color:'#55556e' }}>{filtered.length} of {businesses.length} businesses</p>
          </div>
          <div style={{ display:'flex', gap:'0.65rem', flexWrap:'wrap', alignItems:'center' }}>
            {selectedIds.length>0 && <>
              <button className="btn btn-success" style={{ fontSize:'0.78rem', padding:'0.4rem 0.85rem' }} onClick={()=>handleBulkPublish(true)}><Eye size={13}/>Publish {selectedIds.length}</button>
              <button className="btn btn-ghost"   style={{ fontSize:'0.78rem', padding:'0.4rem 0.85rem' }} onClick={()=>handleBulkPublish(false)}><EyeOff size={13}/>Unpublish</button>
              <button className="btn btn-danger"  style={{ fontSize:'0.78rem', padding:'0.4rem 0.85rem' }} onClick={handleBulkDelete}><Trash2 size={13}/>Delete</button>
            </>}
            <BusinessCSVImport onImportComplete={()=>{fetchBusinesses();fetchCategories();}} />
            <button className="btn btn-success" onClick={handleExport}><Download size={14}/>Export</button>
            <button className="btn btn-primary" onClick={openModal}><Plus size={14}/>Add Business</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:'0.65rem', marginBottom:'1rem', flexWrap:'wrap' }}>
          <div style={{ position:'relative', flex:1, minWidth:220 }}>
            <Search size={15} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#55556e', pointerEvents:'none' }} />
            <input type="text" placeholder="Search businesses…" value={search} onChange={e=>setSearch(e.target.value)} className="u-input" />
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#55556e', cursor:'pointer', padding:0 }}><X size={14}/></button>}
          </div>
          <button className={`btn btn-filter${showFilters||activeFiltersCount>0?' active':''}`} onClick={()=>setShowFilters(!showFilters)}>
            <Filter size={14}/>Filters
            {activeFiltersCount>0 && <span style={{ background:'#6366f1', color:'#fff', borderRadius:'100px', fontSize:'0.65rem', fontWeight:700, padding:'0.1rem 0.45rem', marginLeft:'0.2rem' }}>{activeFiltersCount}</span>}
          </button>
          <div style={{ display:'flex', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, overflow:'hidden' }}>
            <button className={`btn-view${viewMode==='table'?' active':''}`} onClick={()=>setViewMode('table')} title="Table"><List size={15}/></button>
            <button className={`btn-view${viewMode==='grid'?' active':''}`}  onClick={()=>setViewMode('grid')}  title="Grid"  style={{ borderLeft:'1px solid rgba(255,255,255,0.09)' }}><Grid size={15}/></button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="filter-panel" style={{ marginBottom:'1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#9494b0' }}>Filters</span>
              <button onClick={()=>{setCategoryFilter('all');setStatusFilter('all');setDateFilter('all');setSearch('');}} style={{ fontSize:'0.75rem', color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>Clear all</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.75rem' }}>
              <select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)} className="u-select">
                <option value="all">All categories</option>
                <option value="uncategorized">Uncategorized</option>
                {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="u-select">
                <option value="all">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)} className="u-select">
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
              </select>
            </div>
          </div>
        )}

        {/* TABLE VIEW */}
        {viewMode==='table' && (
          <div style={{ background:'#13131a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
            {selectedIds.length>0 && (
              <div className="bulk-bar">
                <span>{selectedIds.length} selected</span>
                <button className="btn btn-ghost" style={{ padding:'0.28rem 0.65rem', fontSize:'0.75rem' }} onClick={()=>setSelectedIds([])}>Clear</button>
              </div>
            )}
            <div className="scroll" style={{ overflowX:'auto' }}>
              <table className="b-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft:'1.25rem', width:40 }}><input type="checkbox" checked={selectedIds.length===filtered.length&&filtered.length>0} onChange={toggleSelectAll} style={{ accentColor:'#6366f1', cursor:'pointer' }} /></th>
                    <th style={{ width:56 }}>Image</th>
                    <th className="sort"><SortBtn field="name" label="Name" /></th>
                    <th>Slug</th>
                    <th className="sort"><SortBtn field="category" label="Category" /></th>
                    <th>Status</th>
                    <th className="sort"><SortBtn field="requirements" label="Reqs" /></th>
                    <th className="sort"><SortBtn field="createdAt" label="Created" /></th>
                    <th style={{ textAlign:'right', paddingRight:'1.25rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length===0 ? (
                    <tr><td colSpan={9} style={{ textAlign:'center', padding:'3.5rem', color:'#3a3a56' }}>
                      <Building size={36} style={{ margin:'0 auto 0.75rem', display:'block' }} />
                      <div style={{ color:'#55556e', fontWeight:600 }}>{activeFiltersCount>0||search?'No matches found':'No businesses yet'}</div>
                    </td></tr>
                  ) : filtered.map(b=>(
                    <tr key={b.id} className={selectedIds.includes(b.id)?'sel':''}>
                      <td style={{ paddingLeft:'1.25rem' }}><input type="checkbox" checked={selectedIds.includes(b.id)} onChange={()=>toggleSelect(b.id)} style={{ accentColor:'#6366f1', cursor:'pointer' }} /></td>
                      <td>{b.image ? <Image src={b.image} alt={b.name} width={44} height={44} style={{ borderRadius:9, objectFit:'cover', border:'1px solid rgba(255,255,255,0.07)' }} /> : <div style={{ width:44, height:44, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px dashed rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}><Building size={16} color="#3a3a56" /></div>}</td>
                      <td>
                        <div style={{ fontWeight:600, fontSize:'0.88rem', color:'#f0f0f5' }}>{b.name}</div>
                        {b.description && <div style={{ fontSize:'0.75rem', color:'#55556e', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'0.1rem' }}>{b.description}</div>}
                      </td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                          <span className="code-pill">{b.slug}</span>
                          <button onClick={()=>{navigator.clipboard.writeText(b.slug);toast.success('Copied!');}} style={{ background:'none', border:'none', color:'#55556e', cursor:'pointer', padding:'0.1rem' }} title="Copy"><Copy size={12}/></button>
                          <a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer" style={{ color:'#55556e' }} title="View"><ExternalLink size={12}/></a>
                        </div>
                      </td>
                      <td>{b.category ? <span className="cat-pill"><Tag size={10}/>{b.category.name}</span> : <span style={{ color:'#3a3a56' }}>—</span>}</td>
                      <td>
                        <button onClick={()=>handleTogglePublish(b)} className="status-pill"
                          style={{ background:b.published?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.06)', color:b.published?'#34d399':'#9494b0' }}>
                          {b.published ? <><Eye size={11}/>Published</> : <><EyeOff size={11}/>Draft</>}
                        </button>
                      </td>
                      <td><span className="adm-mono" style={{ fontSize:'0.85rem', color:'#9494b0' }}>{b._count?.requirements||0}</span></td>
                      <td><span style={{ fontSize:'0.78rem', color:'#55556e' }}>{new Date(b.createdAt).toLocaleDateString()}</span></td>
                      <td style={{ paddingRight:'1.25rem', textAlign:'right' }}>
                        <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.25rem' }}>
                          <button className="btn btn-ghost btn-icon" onClick={()=>openEditModal(b)} title="Edit"><Edit2 size={14}/></button>
                          <button className="btn btn-danger btn-icon" onClick={()=>handleDelete(b.id)} title="Delete"><Trash2 size={14}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding:'0.65rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.04)', fontSize:'0.75rem', color:'#55556e' }}>
              Showing <span style={{ color:'#9494b0', fontWeight:600 }}>{filtered.length}</span> of <span style={{ color:'#9494b0', fontWeight:600 }}>{businesses.length}</span> businesses
            </div>
          </div>
        )}

        {/* GRID VIEW */}
        {viewMode==='grid' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
            {filtered.length===0 ? (
              <div style={{ gridColumn:'1/-1', textAlign:'center', padding:'3.5rem', color:'#3a3a56' }}>
                <Building size={36} style={{ margin:'0 auto 0.75rem', display:'block' }} />
                <div style={{ color:'#55556e', fontWeight:600 }}>No businesses found</div>
              </div>
            ) : filtered.map(b=>(
              <div key={b.id} className={`g-card${selectedIds.includes(b.id)?' sel':''}`}>
                <div style={{ position:'relative' }}>
                  {b.image ? <Image src={b.image} alt={b.name} width={400} height={180} style={{ width:'100%', height:160, objectFit:'cover', display:'block' }} /> : <div style={{ width:'100%', height:120, background:'rgba(255,255,255,0.03)', display:'flex', alignItems:'center', justifyContent:'center', color:'#2a2a3e' }}><Building size={32}/></div>}
                  <div style={{ position:'absolute', top:'0.6rem', left:'0.6rem' }}>
                    <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={()=>toggleSelect(b.id)} style={{ accentColor:'#6366f1', cursor:'pointer' }} />
                  </div>
                  <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem', display:'flex', gap:'0.25rem' }}>
                    <button className="btn btn-ghost btn-icon" style={{ background:'rgba(26,26,36,0.8)' }} onClick={()=>openEditModal(b)}><Edit2 size={13}/></button>
                    <button className="btn btn-danger btn-icon" style={{ background:'rgba(239,68,68,0.2)' }}  onClick={()=>handleDelete(b.id)}><Trash2 size={13}/></button>
                  </div>
                </div>
                <div style={{ padding:'0.85rem 1rem' }}>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#f0f0f5', marginBottom:'0.35rem' }}>{b.name}</div>
                  {b.description && <div style={{ fontSize:'0.75rem', color:'#55556e', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const }}>{b.description}</div>}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'0.65rem' }}>
                    {b.category && <span className="cat-pill"><Tag size={10}/>{b.category.name}</span>}
                    <button onClick={()=>handleTogglePublish(b)} className="status-pill" style={{ background:b.published?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.06)', color:b.published?'#34d399':'#9494b0' }}>
                      {b.published ? <Eye size={10}/> : <EyeOff size={10}/>}{b.published?'Published':'Draft'}
                    </button>
                  </div>
                </div>
                <div style={{ padding:'0.6rem 1rem', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', fontSize:'0.73rem', color:'#55556e' }}>
                  <span>{b._count?.requirements||0} requirements</span>
                  <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Modal ── */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>{editingBusiness?'Edit':'Add'} Business</h2>
                <button onClick={closeModal} className="btn btn-ghost btn-icon"><X size={16}/></button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
                <div><label className="f-label">Name</label><input type="text" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value,slug:genSlug(e.target.value)})} className="f-input" placeholder="Business name" /></div>
                <div><label className="f-label">Slug</label><input type="text" value={formData.slug} onChange={e=>setFormData({...formData,slug:e.target.value})} className="f-input" placeholder="auto-generated" /></div>
                <div>
                  <label className="f-label">Category</label>
                  <select value={selectedCatId} onChange={e=>{setSelectedCatId(e.target.value);if(e.target.value!==CREATE_NEW)setNewCatName('');}} className="f-select">
                    <option value="">No category</option>
                    {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value={CREATE_NEW}>+ Create new</option>
                  </select>
                  {selectedCatId===CREATE_NEW && <input type="text" placeholder="New category name" value={newCatName} onChange={e=>setNewCatName(e.target.value)} className="f-input" style={{ marginTop:'0.5rem', borderColor:'rgba(139,92,246,0.4)' }} autoFocus />}
                </div>
                <div><label className="f-label">Description</label><textarea value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} rows={3} className="f-textarea" placeholder="Brief description…" /></div>
                <div><label className="f-label">Image URL</label><input type="text" value={formData.image} onChange={e=>setFormData({...formData,image:e.target.value})} className="f-input" placeholder="https://…" /></div>
                <label style={{ display:'flex', alignItems:'center', gap:'0.6rem', cursor:'pointer' }}>
                  <input type="checkbox" checked={formData.published} onChange={e=>setFormData({...formData,published:e.target.checked})} style={{ accentColor:'#6366f1', width:16, height:16 }} />
                  <span style={{ fontSize:'0.84rem', color:'#9494b0', fontWeight:500 }}>Publish immediately</span>
                </label>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.65rem', marginTop:'0.5rem' }}>
                  <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading?'Saving…':editingBusiness?'Update':'Create'}</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}