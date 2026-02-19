/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import Image from 'next/image';
import RequirementCSVImport from '@/components/RequirementCSVImport';

type Requirement = {
  id: number; name: string; description?: string; image?: string;
  category: string; businessId: number; necessity: 'Required'|'Optional';
  productCount: number; commentCount: number;
  business: { name: string };
};
type Business = { id: number; name: string; description?: string; image?: string; };
type FormData = { name: string; description: string; image: string; category: string; businessId: string|number; necessity: 'Required'|'Optional'; };
type SortField = 'name'|'category'|'business'|'necessity'|'productCount'|'commentCount';
type SortDir   = 'asc'|'desc';
type ViewMode  = 'table'|'cards';

const CATEGORIES = ['Equipment','Software','Documents','Legal','Branding','Operating Expenses'];
const CAT_COLORS: Record<string,[string,string]> = {
  Equipment:          ['rgba(99,102,241,0.12)', '#818cf8'],
  Software:           ['rgba(139,92,246,0.12)', '#a78bfa'],
  Documents:          ['rgba(245,158,11,0.12)', '#fbbf24'],
  Legal:              ['rgba(239,68,68,0.12)',  '#f87171'],
  Branding:           ['rgba(236,72,153,0.12)', '#f472b6'],
  'Operating Expenses':['rgba(20,184,166,0.12)','#2dd4bf'],
};

const defaultForm: FormData = { name:'', description:'', image:'', category:'', businessId:'', necessity:'Required' };

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }

  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; cursor:pointer; background:#13131a; transition:color 0.15s; }
  .r-table th:hover { color:#a5b4fc; }
  .r-table td { padding:0.85rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .r-table tbody tr.sel { background:rgba(99,102,241,0.06); }
  .r-table th.no-sort { cursor:default; }

  .u-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 0.9rem 0.55rem 2.4rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s,box-shadow 0.2s; width:100%; box-sizing:border-box; }
  .u-input::placeholder { color:#3a3a56; }
  .u-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .u-select { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.55rem 2rem 0.55rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.82rem; outline:none; cursor:pointer; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%2355556e' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.7rem center; }
  .u-select:focus { border-color:rgba(99,102,241,0.5); }
  .u-select option { background:#1a1a24; }

  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
  .btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(99,102,241,0.4); }
  .btn-danger { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.2); }
  .btn-danger:hover { background:rgba(239,68,68,0.22); }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-filter { background:rgba(255,255,255,0.05); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-filter.active { background:rgba(99,102,241,0.12); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }
  .btn-icon { padding:0.45rem; border-radius:8px; }
  .btn-view { padding:0.45rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); color:#9494b0; cursor:pointer; transition:all 0.15s; }
  .btn-view.active { background:rgba(99,102,241,0.15); color:#a5b4fc; border-color:rgba(99,102,241,0.3); }

  .stat-pill { display:inline-flex; align-items:center; gap:0.4rem; padding:0.4rem 1rem; border-radius:10px; }

  .group-hd { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.65rem; }
  .group-hd-text { font-size:0.72rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.1em; }
  .group-hd-line { flex:1; height:1px; background:rgba(255,255,255,0.05); }

  .bulk-bar { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 1rem; background:rgba(99,102,241,0.07); border-bottom:1px solid rgba(99,102,241,0.15); font-size:0.82rem; color:#a5b4fc; }

  .filter-panel { background:#1a1a24; border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:1rem 1.25rem; margin-bottom:1rem; }

  /* card view */
  .r-card { background:#13131a; border:1px solid rgba(255,255,255,0.07); border-radius:13px; overflow:hidden; transition:all 0.2s; }
  .r-card:hover { border-color:rgba(99,102,241,0.25); transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,0.3); }
  .r-card.sel { border-color:rgba(99,102,241,0.5); background:rgba(99,102,241,0.04); }

  /* modal */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:520px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .modal-sm { max-width:400px; }
  .f-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.35rem; }
  .f-input { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; }
  .f-input::placeholder { color:#3a3a56; }
  .f-input:focus { border-color:rgba(99,102,241,0.5); box-shadow:0 0 0 3px rgba(99,102,241,0.1); }
  .f-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; box-sizing:border-box; cursor:pointer; }
  .f-select:focus { border-color:rgba(99,102,241,0.5); }
  .f-select option { background:#1a1a24; }
  .f-textarea { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; resize:none; box-sizing:border-box; }
  .f-textarea::placeholder { color:#3a3a56; }
  .f-textarea:focus { border-color:rgba(99,102,241,0.5); }

  /* necessity toggle */
  .nec-opt { flex:1; display:flex; align-items:center; justify-content:center; gap:0.5rem; padding:0.65rem; border-radius:9px; border:2px solid rgba(255,255,255,0.07); cursor:pointer; transition:all 0.15s; font-size:0.84rem; font-weight:600; }

  .toast-custom { background:#1a1a24; color:#f0f0f5; border:1px solid rgba(255,255,255,0.09); border-radius:10px; }

  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-track { background:transparent; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

function SortArrow({field,sortField,sortDir}:{field:string;sortField:string;sortDir:SortDir}) {
  if (sortField!==field) return <svg width="10" height="12" viewBox="0 0 10 12" fill="none" style={{marginLeft:4,opacity:0.25}}><path d="M5 1v10M2 4l3-3 3 3M2 8l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  return sortDir==='asc'
    ? <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{marginLeft:4,color:'#818cf8'}}><path d="M5 1L9 6H1L5 1Z" fill="currentColor"/></svg>
    : <svg width="10" height="7" viewBox="0 0 10 7" fill="none" style={{marginLeft:4,color:'#818cf8'}}><path d="M5 6L1 1H9L5 6Z" fill="currentColor"/></svg>;
}

export default function RequirementsPage() {
  const [requirements,     setRequirements]     = useState<Requirement[]>([]);
  const [formData,         setFormData]         = useState<FormData>(defaultForm);
  const [isOpen,           setIsOpen]           = useState(false);
  const [editingId,        setEditingId]        = useState<number|null>(null);
  const [search,           setSearch]           = useState('');
  const [businesses,       setBusinesses]       = useState<Business[]>([]);
  const [selectedIds,      setSelectedIds]      = useState<Set<number>>(new Set());
  const [deleteConfirmId,  setDeleteConfirmId]  = useState<number|null>(null);
  const [bulkConfirm,      setBulkConfirm]      = useState(false);
  const [sortField,        setSortField]        = useState<SortField>('name');
  const [sortDir,          setSortDir]          = useState<SortDir>('asc');
  const [filterCat,        setFilterCat]        = useState('');
  const [filterBiz,        setFilterBiz]        = useState('');
  const [filterNec,        setFilterNec]        = useState('');
  const [viewMode,         setViewMode]         = useState<ViewMode>('table');
  const [groupBy,          setGroupBy]          = useState<'none'|'category'|'business'|'necessity'>('none');
  const [filtersOpen,      setFiltersOpen]      = useState(false);
  const [toast,            setToast]            = useState<{msg:string;type:'success'|'error'}|null>(null);

  useEffect(() => { fetchRequirements(); fetchBusinesses(); }, []);

  function showToast(msg:string,type:'success'|'error'='success') { setToast({msg,type}); setTimeout(()=>setToast(null),3000); }
  async function fetchRequirements() { try { const r=await fetch('/api/requirements'); if(!r.ok)throw new Error(); const d=await r.json(); setRequirements(Array.isArray(d)?d:[]); } catch { setRequirements([]); } }
  async function fetchBusinesses() { try { const r=await fetch('/api/businesses'); if(r.ok) setBusinesses(await r.json()); } catch {} }

  function handleSort(field:SortField) { if(sortField===field){setSortDir(d=>d==='asc'?'desc':'asc');}else{setSortField(field);setSortDir('asc');} }

  const activeFilterCount = [filterCat,filterBiz,filterNec].filter(Boolean).length;

  const filtered = useMemo(() => {
    if (!Array.isArray(requirements)) return [];
    return requirements
      .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase()) || r.business?.name.toLowerCase().includes(search.toLowerCase()))
      .filter(r => !filterCat || r.category===filterCat)
      .filter(r => !filterBiz || String(r.businessId)===filterBiz)
      .filter(r => !filterNec || r.necessity===filterNec)
      .sort((a,b) => {
        let va:string|number='', vb:string|number='';
        if(sortField==='name'){va=a.name;vb=b.name;}
        else if(sortField==='category'){va=a.category;vb=b.category;}
        else if(sortField==='business'){va=a.business?.name||'';vb=b.business?.name||'';}
        else if(sortField==='necessity'){va=a.necessity;vb=b.necessity;}
        else if(sortField==='productCount'){va=a.productCount;vb=b.productCount;}
        else{va=a.commentCount;vb=b.commentCount;}
        if(typeof va==='string') return sortDir==='asc'?va.localeCompare(vb as string):(vb as string).localeCompare(va);
        return sortDir==='asc'?(va as number)-(vb as number):(vb as number)-(va as number);
      });
  }, [requirements,search,filterCat,filterBiz,filterNec,sortField,sortDir]);

  const grouped = useMemo(() => {
    if (groupBy==='none') return {'':filtered};
    const g:Record<string,Requirement[]>={};
    filtered.forEach(r=>{ const k=groupBy==='business'?r.business?.name||'Unknown':groupBy==='category'?r.category:r.necessity; if(!g[k])g[k]=[]; g[k].push(r); });
    return Object.fromEntries(Object.entries(g).sort(([a],[b])=>a.localeCompare(b)));
  }, [filtered,groupBy]);

  function openNew() { setFormData(defaultForm); setEditingId(null); setIsOpen(true); }
  function openEdit(req:Requirement) { setFormData({name:req.name,description:req.description||'',image:req.image||'',category:req.category,businessId:String(req.businessId),necessity:req.necessity}); setEditingId(req.id); setIsOpen(true); }
  function toggleSel(id:number) { const s=new Set(selectedIds); if(s.has(id)){s.delete(id);}else{s.add(id);} setSelectedIds(s); }
  function toggleSelAll() { setSelectedIds(selectedIds.size===filtered.length?new Set():new Set(filtered.map(r=>r.id))); }
  function clearFilters() { setSearch(''); setFilterCat(''); setFilterBiz(''); setFilterNec(''); }

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault();
    try {
      const method=editingId?'PATCH':'POST';
      const url=editingId?`/api/requirements/${editingId}`:'/api/requirements';
      const r=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...formData,businessId:Number(formData.businessId)})});
      if(!r.ok) throw new Error();
      setIsOpen(false); fetchRequirements();
      showToast(editingId?'Requirement updated':'Requirement created');
    } catch { showToast('Failed to save','error'); }
  }

  async function handleDelete() {
    if(!deleteConfirmId) return;
    await fetch(`/api/requirements/${deleteConfirmId}`,{method:'DELETE'});
    setDeleteConfirmId(null); fetchRequirements(); showToast('Requirement deleted');
  }

  async function handleBulkDelete() {
    await Promise.all(Array.from(selectedIds).map(id=>fetch(`/api/requirements/${id}`,{method:'DELETE'})));
    setSelectedIds(new Set()); setBulkConfirm(false); fetchRequirements();
    showToast(`${selectedIds.size} requirements deleted`);
  }

  const stats = useMemo(()=>({
    total:requirements.length, required:requirements.filter(r=>r.necessity==='Required').length,
    optional:requirements.filter(r=>r.necessity==='Optional').length, cats:new Set(requirements.map(r=>r.category)).size,
  }),[requirements]);

  const catColor = (cat:string)=>CAT_COLORS[cat]??['rgba(148,148,176,0.1)','#9494b0'];
  const necStyle = (nec:string)=>nec==='Required'?{bg:'rgba(16,185,129,0.1)',color:'#34d399'}:{bg:'rgba(245,158,11,0.1)',color:'#fbbf24'};

  return (
    <>
      <style>{S}</style>
      {toast && (
        <div style={{ position:'fixed', top:'1rem', right:'1rem', zIndex:99999, padding:'0.75rem 1.25rem', borderRadius:11, fontSize:'0.84rem', fontFamily:'Sora,sans-serif', fontWeight:600, display:'flex', alignItems:'center', gap:'0.6rem', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', background:toast.type==='success'?'rgba(16,185,129,0.15)':'rgba(239,68,68,0.15)', border:`1px solid ${toast.type==='success'?'rgba(16,185,129,0.3)':'rgba(239,68,68,0.3)'}`, color:toast.type==='success'?'#6ee7b7':'#fca5a5' }}>
          {toast.msg}
        </div>
      )}

      <div className="adm" style={{ minHeight:'100vh' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'1.75rem', fontWeight:700, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>Requirements</h1>
            <p style={{ fontSize:'0.84rem', color:'#55556e' }}>Manage your business requirements and dependencies</p>
          </div>
          <div style={{ display:'flex', gap:'0.65rem', alignItems:'center' }}>
            <RequirementCSVImport onImportComplete={fetchRequirements} />
            <button className="btn btn-primary" onClick={openNew}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 4v16m8-8H4"/></svg>
              Add Requirement
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'flex', gap:'0.65rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
          {[
            {label:'Total',      val:stats.total,    bg:'rgba(99,102,241,0.12)',  color:'#818cf8'},
            {label:'Required',   val:stats.required, bg:'rgba(16,185,129,0.12)',  color:'#34d399'},
            {label:'Optional',   val:stats.optional, bg:'rgba(245,158,11,0.1)',   color:'#fbbf24'},
            {label:'Categories', val:stats.cats,     bg:'rgba(139,92,246,0.12)',  color:'#a78bfa'},
          ].map(s=>(
            <div key={s.label} className="stat-pill" style={{ background:s.bg, border:`1px solid ${s.color}22` }}>
              <span className="adm-mono" style={{ fontSize:'1.15rem', fontWeight:700, color:s.color }}>{s.val}</span>
              <span style={{ fontSize:'0.75rem', color:s.color, opacity:0.75 }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:'0.65rem', marginBottom:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:1, minWidth:200 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55556e" strokeWidth="2" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Search requirements…" value={search} onChange={e=>setSearch(e.target.value)} className="u-input" />
            {search && <button onClick={()=>setSearch('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#55556e', cursor:'pointer', padding:0 }}>×</button>}
          </div>
          <button className={`btn btn-filter${filtersOpen||activeFilterCount>0?' active':''}`} onClick={()=>setFiltersOpen(!filtersOpen)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            Filters {activeFilterCount>0&&<span style={{ background:'#6366f1', color:'#fff', borderRadius:'100px', fontSize:'0.65rem', fontWeight:700, padding:'0.1rem 0.4rem' }}>{activeFilterCount}</span>}
          </button>
          <select value={groupBy} onChange={e=>setGroupBy(e.target.value as typeof groupBy)} className="u-select">
            <option value="none">No grouping</option>
            <option value="category">Group by Category</option>
            <option value="business">Group by Business</option>
            <option value="necessity">Group by Necessity</option>
          </select>
          <div style={{ display:'flex', border:'1px solid rgba(255,255,255,0.09)', borderRadius:9, overflow:'hidden' }}>
            <button className={`btn-view${viewMode==='table'?' active':''}`} onClick={()=>setViewMode('table')} title="Table">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 10h18M3 6h18M3 14h18M3 18h18"/></svg>
            </button>
            <button className={`btn-view${viewMode==='cards'?' active':''}`} onClick={()=>setViewMode('cards')} title="Cards" style={{ borderLeft:'1px solid rgba(255,255,255,0.09)' }}>
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="filter-panel">
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.65rem' }}>
              <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#9494b0' }}>Filters</span>
              {activeFilterCount>0 && <button onClick={clearFilters} style={{ fontSize:'0.75rem', color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>Clear all</button>}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.65rem' }}>
              <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} className="u-select">
                <option value="">All Categories</option>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterBiz} onChange={e=>setFilterBiz(e.target.value)} className="u-select">
                <option value="">All Businesses</option>
                {businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <select value={filterNec} onChange={e=>setFilterNec(e.target.value)} className="u-select">
                <option value="">Any Necessity</option>
                <option value="Required">Required</option>
                <option value="Optional">Optional</option>
              </select>
            </div>
          </div>
        )}

        {/* Bulk bar */}
        {selectedIds.size>0 && (
          <div className="bulk-bar" style={{ marginBottom:'0.75rem', borderRadius:10, border:'1px solid rgba(99,102,241,0.2)' }}>
            <span>{selectedIds.size} selected</span>
            <button className="btn btn-danger" style={{ padding:'0.3rem 0.75rem', fontSize:'0.76rem' }} onClick={()=>setBulkConfirm(true)}>Delete selected</button>
            <button className="btn btn-ghost" style={{ padding:'0.3rem 0.75rem', fontSize:'0.76rem' }} onClick={()=>setSelectedIds(new Set())}>Clear</button>
          </div>
        )}

        {/* Results count */}
        <div style={{ fontSize:'0.75rem', color:'#55556e', marginBottom:'0.75rem', display:'flex', justifyContent:'space-between' }}>
          <span>Showing <strong style={{ color:'#9494b0' }}>{filtered.length}</strong> of <strong style={{ color:'#9494b0' }}>{requirements.length}</strong> requirements</span>
          {(search||activeFilterCount>0) && <button onClick={clearFilters} style={{ color:'#818cf8', background:'none', border:'none', cursor:'pointer', fontFamily:'Sora,sans-serif', fontSize:'0.75rem' }}>Clear all</button>}
        </div>

        {/* Content */}
        {Object.entries(grouped).map(([groupKey,groupReqs])=>(
          <div key={groupKey} style={{ marginBottom:'1.25rem' }}>
            {groupBy!=='none'&&groupKey&&(
              <div className="group-hd">
                <span className="group-hd-text">{groupKey}</span>
                <span style={{ background:'rgba(255,255,255,0.07)', color:'#9494b0', fontSize:'0.7rem', fontWeight:700, borderRadius:'100px', padding:'0.1rem 0.5rem' }}>{groupReqs.length}</span>
                <div className="group-hd-line"/>
              </div>
            )}

            {viewMode==='table' ? (
              <div style={{ background:'#13131a', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, overflow:'hidden' }}>
                <div className="scroll" style={{ overflowX:'auto' }}>
                  <table className="r-table">
                    <thead>
                      <tr>
                        <th className="no-sort" style={{ paddingLeft:'1.25rem', width:40 }}>
                          <input type="checkbox" checked={selectedIds.size===filtered.length&&filtered.length>0} onChange={toggleSelAll} style={{ accentColor:'#6366f1', cursor:'pointer' }} />
                        </th>
                        {[['name','Name'],['category','Category'],['business','Business'],['necessity','Necessity'],['productCount','Products']].map(([f,l])=>(
                          <th key={f} onClick={()=>handleSort(f as SortField)} style={{ userSelect:'none' }}>
                            <span style={{ display:'inline-flex', alignItems:'center' }}>{l}<SortArrow field={f} sortField={sortField} sortDir={sortDir}/></span>
                          </th>
                        ))}
                        <th className="no-sort" style={{ textAlign:'right', paddingRight:'1.25rem' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupReqs.length===0 ? (
                        <tr><td colSpan={7} style={{ textAlign:'center', padding:'3rem', color:'#3a3a56' }}>No requirements found</td></tr>
                      ) : groupReqs.map(req=>(
                        <tr key={req.id} className={selectedIds.has(req.id)?'sel':''}>
                          <td style={{ paddingLeft:'1.25rem' }}><input type="checkbox" checked={selectedIds.has(req.id)} onChange={()=>toggleSel(req.id)} style={{ accentColor:'#6366f1', cursor:'pointer' }} /></td>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
                              {req.image && <div style={{ position:'relative', width:36, height:36, flexShrink:0 }}><Image src={req.image} alt={req.name} fill style={{ objectFit:'cover', borderRadius:8, border:'1px solid rgba(255,255,255,0.07)' }} sizes="36px"/></div>}
                              <span style={{ fontWeight:600, fontSize:'0.87rem', color:'#f0f0f5' }}>{req.name}</span>
                            </div>
                            {req.description && <div style={{ fontSize:'0.74rem', color:'#55556e', maxWidth:240, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:'0.15rem' }}>{req.description}</div>}
                          </td>
                          <td><span style={{ display:'inline-flex', alignItems:'center', padding:'0.2rem 0.6rem', borderRadius:'100px', fontSize:'0.72rem', fontWeight:700, background:catColor(req.category)[0], color:catColor(req.category)[1] }}>{req.category}</span></td>
                          <td><span style={{ fontSize:'0.83rem', color:'#9494b0' }}>{req.business?.name}</span></td>
                          <td><span style={{ display:'inline-flex', alignItems:'center', padding:'0.2rem 0.6rem', borderRadius:'100px', fontSize:'0.72rem', fontWeight:700, background:necStyle(req.necessity).bg, color:necStyle(req.necessity).color }}>{req.necessity}</span></td>
                          <td><span className="adm-mono" style={{ fontSize:'0.85rem', color:'#9494b0' }}>{req.productCount}</span></td>
                          <td style={{ paddingRight:'1.25rem', textAlign:'right' }}>
                            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.25rem' }}>
                              <button className="btn btn-ghost btn-icon" onClick={()=>openEdit(req)} title="Edit">
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                              <button className="btn btn-danger btn-icon" onClick={()=>setDeleteConfirmId(req.id)} title="Delete">
                                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'0.85rem' }}>
                {groupReqs.map(req=>(
                  <div key={req.id} className={`r-card${selectedIds.has(req.id)?' sel':''}`}>
                    <div style={{ padding:'0.9rem 1rem' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'0.6rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                          <input type="checkbox" checked={selectedIds.has(req.id)} onChange={()=>toggleSel(req.id)} style={{ accentColor:'#6366f1', cursor:'pointer' }} />
                          {req.image && <div style={{ position:'relative', width:32, height:32 }}><Image src={req.image} alt={req.name} fill style={{ objectFit:'cover', borderRadius:7, border:'1px solid rgba(255,255,255,0.07)' }} sizes="32px"/></div>}
                        </div>
                        <div style={{ display:'flex', gap:'0.2rem' }}>
                          <button className="btn btn-ghost btn-icon" onClick={()=>openEdit(req)}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                          <button className="btn btn-danger btn-icon" onClick={()=>setDeleteConfirmId(req.id)}>
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                          </button>
                        </div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#f0f0f5', marginBottom:'0.25rem' }}>{req.name}</div>
                      {req.description && <div style={{ fontSize:'0.74rem', color:'#55556e', lineHeight:1.5, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, marginBottom:'0.6rem' }}>{req.description}</div>}
                      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                        <span style={{ display:'inline-flex', padding:'0.18rem 0.55rem', borderRadius:'100px', fontSize:'0.7rem', fontWeight:700, background:catColor(req.category)[0], color:catColor(req.category)[1] }}>{req.category}</span>
                        <span style={{ display:'inline-flex', padding:'0.18rem 0.55rem', borderRadius:'100px', fontSize:'0.7rem', fontWeight:700, background:necStyle(req.necessity).bg, color:necStyle(req.necessity).color }}>{req.necessity}</span>
                      </div>
                    </div>
                    <div style={{ padding:'0.55rem 1rem', borderTop:'1px solid rgba(255,255,255,0.04)', display:'flex', justifyContent:'space-between', fontSize:'0.72rem', color:'#55556e' }}>
                      <span>{req.business?.name}</span>
                      <span className="adm-mono">{req.productCount} products</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Create/Edit Modal */}
        {isOpen && (
          <div className="modal-overlay" onClick={()=>setIsOpen(false)}>
            <div className="modal-box" onClick={e=>e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                <h2 style={{ fontSize:'1.05rem', fontWeight:700 }}>{editingId?'Edit':'Add'} Requirement</h2>
                <button onClick={()=>setIsOpen(false)} className="btn btn-ghost btn-icon">×</button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.9rem' }}>
                <div><label className="f-label">Name *</label><input type="text" placeholder="Requirement name" className="f-input" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} autoFocus /></div>
                <div><label className="f-label">Description</label><textarea placeholder="Description…" className="f-textarea" rows={2} value={formData.description} onChange={e=>setFormData({...formData,description:e.target.value})} /></div>
                <div><label className="f-label">Image URL</label><input type="text" placeholder="https://…" className="f-input" value={formData.image} onChange={e=>setFormData({...formData,image:e.target.value})} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div><label className="f-label">Category *</label><select className="f-select" value={formData.category} onChange={e=>setFormData({...formData,category:e.target.value})}><option value="">Select…</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="f-label">Business *</label><select className="f-select" value={formData.businessId} onChange={e=>setFormData({...formData,businessId:e.target.value})}><option value="">Select…</option>{businesses.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
                </div>
                <div>
                  <label className="f-label">Necessity *</label>
                  <div style={{ display:'flex', gap:'0.65rem' }}>
                    {(['Required','Optional'] as const).map(v=>(
                      <label key={v} className="nec-opt" style={{ borderColor:formData.necessity===v?(v==='Required'?'rgba(16,185,129,0.5)':'rgba(245,158,11,0.5)'):'rgba(255,255,255,0.07)', background:formData.necessity===v?(v==='Required'?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)'):'transparent', color:formData.necessity===v?(v==='Required'?'#34d399':'#fbbf24'):'#9494b0' }}>
                        <input type="radio" name="nec" value={v} checked={formData.necessity===v} onChange={()=>setFormData({...formData,necessity:v})} style={{ display:'none' }} />
                        {v}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.65rem', marginTop:'0.5rem' }}>
                  <button className="btn btn-ghost" onClick={()=>setIsOpen(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSubmit}>{editingId?'Update':'Create'}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirmId!==null && (
          <div className="modal-overlay" onClick={()=>setDeleteConfirmId(null)}>
            <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
              <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.85rem' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'0.4rem' }}>Delete requirement?</h3>
                <p style={{ fontSize:'0.82rem', color:'#9494b0' }}>This action cannot be undone.</p>
              </div>
              <div style={{ display:'flex', gap:'0.65rem', justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={()=>setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk delete confirm */}
        {bulkConfirm && (
          <div className="modal-overlay" onClick={()=>setBulkConfirm(false)}>
            <div className="modal-box modal-sm" onClick={e=>e.stopPropagation()}>
              <div style={{ textAlign:'center', marginBottom:'1.25rem' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(239,68,68,0.12)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 0.85rem' }}>
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                </div>
                <h3 style={{ fontSize:'1rem', fontWeight:700, marginBottom:'0.4rem' }}>Delete {selectedIds.size} requirements?</h3>
                <p style={{ fontSize:'0.82rem', color:'#9494b0' }}>This action cannot be undone.</p>
              </div>
              <div style={{ display:'flex', gap:'0.65rem', justifyContent:'flex-end' }}>
                <button className="btn btn-ghost" onClick={()=>setBulkConfirm(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleBulkDelete}>Delete {selectedIds.size}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}