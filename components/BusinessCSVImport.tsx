/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useRef } from "react";
import { Upload, X, Download } from "lucide-react";
import { toast } from "react-hot-toast";

type CSVBusiness = {
  name: string;
  description?: string;
  image?: string;
  slug: string;
  published: boolean;
  categoryName?: string;
};

type BusinessCSVImportProps = {
  onImportComplete: () => void;
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');

  .bci-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    z-index: 9999; display: flex; align-items: center; justify-content: center;
    padding: 1rem; backdrop-filter: blur(4px); overflow-y: auto;
  }
  .bci-box {
    background: #1a1a24; border: 1px solid rgba(255,255,255,0.09);
    border-radius: 16px; padding: 1.75rem; width: 100%; max-width: 780px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6); margin: auto;
    font-family: 'Sora', sans-serif; color: #f0f0f5;
  }
  .bci-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.25rem; }

  .bci-info {
    background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2);
    border-radius: 11px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;
  }
  .bci-info-title { font-size: 0.8rem; font-weight: 700; color: #a5b4fc; margin-bottom: 0.5rem; }
  .bci-info li { font-size: 0.78rem; color: #9494b0; line-height: 1.75; }
  .bci-info li strong { color: #c7d2fe; }

  .bci-label { display: block; font-size: 0.76rem; font-weight: 600; color: #9494b0; margin-bottom: 0.4rem; }

  .bci-file-wrap { margin-bottom: 1.25rem; }
  .bci-file-input {
    width: 100%; background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.12);
    border-radius: 9px; padding: 0.65rem 1rem; color: #9494b0;
    font-family: 'Sora', sans-serif; font-size: 0.83rem;
    transition: border-color 0.2s; box-sizing: border-box; cursor: pointer;
  }
  .bci-file-input::file-selector-button {
    background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3);
    color: #a78bfa; border-radius: 7px; padding: 0.3rem 0.85rem;
    font-family: 'Sora', sans-serif; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; margin-right: 0.75rem; transition: all 0.15s;
  }
  .bci-file-input::file-selector-button:hover { background: rgba(139,92,246,0.25); }

  /* preview table */
  .bci-preview-hd { font-size: 0.8rem; font-weight: 700; color: #9494b0; margin-bottom: 0.5rem; }
  .bci-table-wrap {
    max-height: 240px; overflow-y: auto;
    border: 1px solid rgba(255,255,255,0.07); border-radius: 10px;
  }
  .bci-table-wrap::-webkit-scrollbar { width: 4px; }
  .bci-table-wrap::-webkit-scrollbar-track { background: transparent; }
  .bci-table-wrap::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  .bci-table { width: 100%; border-collapse: collapse; }
  .bci-table th {
    padding: 0.55rem 0.85rem; text-align: left; font-size: 0.68rem; font-weight: 700;
    color: #55556e; text-transform: uppercase; letter-spacing: 0.07em;
    border-bottom: 1px solid rgba(255,255,255,0.06); background: #13131a;
    position: sticky; top: 0;
  }
  .bci-table td {
    padding: 0.7rem 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 0.82rem; vertical-align: middle;
  }
  .bci-table tbody tr:hover { background: rgba(255,255,255,0.025); }
  .bci-table tbody tr:last-child td { border-bottom: none; }

  /* badges */
  .pub-badge  { display: inline-flex; padding: 0.18rem 0.55rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; background: rgba(16,185,129,0.12); color: #34d399; }
  .dft-badge  { display: inline-flex; padding: 0.18rem 0.55rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; background: rgba(255,255,255,0.07); color: #9494b0; }
  .cat-badge  { display: inline-flex; padding: 0.18rem 0.55rem; border-radius: 100px; font-size: 0.7rem; font-weight: 700; background: rgba(139,92,246,0.12); color: #a78bfa; }
  .slug-code  { font-family: 'DM Mono', monospace; font-size: 0.76rem; color: #9494b0; background: rgba(255,255,255,0.05); padding: 0.15rem 0.45rem; border-radius: 5px; }

  /* buttons */
  .bci-btn { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.55rem 1.1rem; border-radius: 9px; font-family: 'Sora', sans-serif; font-size: 0.83rem; font-weight: 600; cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap; }
  .bci-btn-primary { background: linear-gradient(135deg,#7c3aed,#6d28d9); color: #fff; box-shadow: 0 4px 14px rgba(124,58,237,0.3); }
  .bci-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(124,58,237,0.4); }
  .bci-btn-primary:disabled { opacity: 0.45; transform: none; cursor: not-allowed; }
  .bci-btn-ghost { background: rgba(255,255,255,0.06); color: #9494b0; border: 1px solid rgba(255,255,255,0.09); }
  .bci-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #f0f0f5; }
  .bci-btn-link { background: none; border: none; color: #a5b4fc; font-family: 'Sora', sans-serif; font-size: 0.78rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0; transition: color 0.15s; margin-top: 0.6rem; }
  .bci-btn-link:hover { color: #c7d2fe; }
  .bci-btn-icon { background: none; border: none; padding: 0.25rem; cursor: pointer; color: #55556e; transition: color 0.15s; }
  .bci-btn-icon:hover { color: #f87171; }

  /* trigger */
  .bci-trigger {
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.5rem 1rem; border-radius: 9px; font-family: 'Sora', sans-serif;
    font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
    background: rgba(139,92,246,0.15); color: #a78bfa;
    border: 1px solid rgba(139,92,246,0.25);
  }
  .bci-trigger:hover { background: rgba(139,92,246,0.25); color: #c4b5fd; }
`;

export default function BusinessCSVImport({ onImportComplete }: BusinessCSVImportProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [businesses,  setBusinesses]  = useState<CSVBusiness[]>([]);
  const [loading,     setLoading]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch==='"') { if (inQuotes && line[i+1]==='"') { current+='"'; i++; } else { inQuotes=!inQuotes; } }
      else if (ch===',' && !inQuotes) { result.push(current); current=''; }
      else { current+=ch; }
    }
    result.push(current);
    return result;
  }

  function parseCSV(text: string): CSVBusiness[] {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    if (!headers.includes('name')) throw new Error('Missing required column: name');

    const result: CSVBusiness[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const biz: any = {};
      headers.forEach((h, idx) => {
        const v = values[idx]?.trim() || '';
        if (h==='name')                           { biz.name = v; }
        else if (h==='slug')                      { biz.slug = v || undefined; }
        else if (h==='description'||h==='image')  { biz[h] = v || undefined; }
        else if (h==='published')                 { biz.published = ['true','yes','1'].includes(v.toLowerCase()); }
        else if (h==='category')                  { biz.categoryName = v || undefined; }
      });
      if (!biz.hasOwnProperty('published')) biz.published = true;
      if (!biz.slug && biz.name) biz.slug = generateSlug(biz.name);
      if (!biz.name) throw new Error(`Row ${i+1}: Missing required field: name`);
      result.push(biz);
    }
    return result;
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a CSV file'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseCSV(ev.target?.result as string);
        setBusinesses(parsed);
        toast.success(`${parsed.length} businesses loaded`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse CSV');
        setBusinesses([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!businesses.length) { toast.error('No businesses to import'); return; }
    setLoading(true);
    let ok = 0, fail = 0;
    try {
      for (const biz of businesses) {
        const res = await fetch('/api/admin/businesses', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(biz) });
        if (res.ok) { ok++; } else { fail++; const d=await res.json().catch(()=>({})); console.error(`Failed: ${biz.name}`, d.error); }
      }
      if (ok > 0)   { toast.success(`Imported ${ok} businesses!`); onImportComplete(); closeModal(); }
      if (fail > 0) { toast.error(`Failed to import ${fail} businesses`); }
    } catch { toast.error('Import failed'); }
    finally { setLoading(false); }
  }

  function downloadTemplate() {
    const tpl = ['name,description,image,published,category','Example Business,This is a description,https://example.com/img.jpg,true,Retail','Another Business,Another description,,false,Technology','Third Business,No image or category,,,'].join('\n');
    Object.assign(document.createElement('a'), { href:URL.createObjectURL(new Blob([tpl],{type:'text/csv'})), download:'business-template.csv' }).click();
    toast.success('Template downloaded!');
  }

  function openModal()  { setBusinesses([]); if(fileInputRef.current) fileInputRef.current.value=''; setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setBusinesses([]); if(fileInputRef.current) fileInputRef.current.value=''; }
  function removeBusiness(idx: number) { setBusinesses(businesses.filter((_,i)=>i!==idx)); }

  return (
    <>
      <style>{S}</style>
      <button onClick={openModal} className="bci-trigger">
        <Upload size={14} />
        Import CSV
      </button>

      {isModalOpen && (
        <div className="bci-overlay" onClick={closeModal}>
          <div className="bci-box" onClick={e => e.stopPropagation()}>
            <div className="bci-title">Import Businesses from CSV</div>

            {/* Info */}
            <div className="bci-info">
              <div className="bci-info-title">CSV Format — columns:</div>
              <ul style={{ paddingLeft:'1.1rem', margin:0 }}>
                <li><strong>name</strong> (required) — Business name</li>
                <li><strong>description</strong> (optional) — Business description</li>
                <li><strong>image</strong> (optional) — Image URL</li>
                <li><strong>published</strong> (optional) — true/false or yes/no (default: true)</li>
                <li><strong>slug</strong> (optional) — Custom URL slug (auto-generated if omitted)</li>
                <li><strong>category</strong> (optional) — Matched by name; new ones are created automatically</li>
              </ul>
              <button onClick={downloadTemplate} className="bci-btn-link">
                <Download size={13} /> Download Template CSV
              </button>
            </div>

            {/* File upload */}
            <div className="bci-file-wrap">
              <label className="bci-label">Upload CSV File</label>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="bci-file-input" />
            </div>

            {/* Preview */}
            {businesses.length > 0 && (
              <div style={{ marginBottom:'1.25rem' }}>
                <div className="bci-preview-hd">Preview — {businesses.length} businesses</div>
                <div className="bci-table-wrap">
                  <table className="bci-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Slug</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th style={{ textAlign:'right' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businesses.map((biz, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:600, color:'#f0f0f5' }}>{biz.name}</td>
                          <td><span className="slug-code">{biz.slug}</span></td>
                          <td>{biz.categoryName ? <span className="cat-badge">{biz.categoryName}</span> : <span style={{ color:'#3a3a56' }}>—</span>}</td>
                          <td><span className={biz.published?'pub-badge':'dft-badge'}>{biz.published?'Published':'Draft'}</span></td>
                          <td style={{ textAlign:'right' }}>
                            <button onClick={()=>removeBusiness(i)} className="bci-btn-icon" title="Remove"><X size={14}/></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'0.65rem' }}>
              <button onClick={closeModal} className="bci-btn bci-btn-ghost">Cancel</button>
              <button onClick={handleImport} disabled={loading || businesses.length===0} className="bci-btn bci-btn-primary">
                {loading ? 'Importing…' : `Import ${businesses.length} Business${businesses.length!==1?'es':''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}