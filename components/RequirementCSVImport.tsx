/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState, useRef, useEffect } from "react";
import { Upload, X, Download } from "lucide-react";
import { toast } from "react-hot-toast";

type CSVRequirement = {
  name: string;
  description?: string;
  image?: string;
  category: string;
  necessity: 'Required' | 'Optional';
};

type Business = { id: number; name: string; published: boolean; };

type RequirementCSVImportProps = { onImportComplete: () => void; };

const CATEGORIES = ['Equipment', 'Software', 'Documents', 'Legal', 'Branding', 'Operating Expenses'];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .rci-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .rci-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; padding:1.75rem; width:100%; max-width:860px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; font-family:'Sora',sans-serif; color:#f0f0f5; }
  .rci-title { font-size:1.1rem; font-weight:700; margin-bottom:1.25rem; }
  .rci-info { background:rgba(99,102,241,0.08); border:1px solid rgba(99,102,241,0.2); border-radius:11px; padding:1rem 1.25rem; margin-bottom:1.25rem; }
  .rci-info-title { font-size:0.8rem; font-weight:700; color:#a5b4fc; margin-bottom:0.5rem; }
  .rci-info li { font-size:0.78rem; color:#9494b0; line-height:1.7; }
  .rci-info li strong { color:#c7d2fe; }
  .rci-label { display:block; font-size:0.76rem; font-weight:600; color:#9494b0; margin-bottom:0.4rem; }
  .rci-select { width:100%; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:9px; padding:0.6rem 0.85rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; transition:border-color 0.2s; box-sizing:border-box; cursor:pointer; }
  .rci-select:focus { border-color:rgba(99,102,241,0.5); }
  .rci-select option { background:#1a1a24; }
  .rci-hint { font-size:0.72rem; color:#55556e; margin-top:0.35rem; }
  .rci-file-wrap { margin-bottom:1.25rem; }
  .rci-file-input { width:100%; background:rgba(255,255,255,0.04); border:1px dashed rgba(255,255,255,0.12); border-radius:9px; padding:0.65rem 1rem; color:#9494b0; font-family:'Sora',sans-serif; font-size:0.83rem; transition:border-color 0.2s; box-sizing:border-box; cursor:pointer; }
  .rci-file-input::file-selector-button { background:rgba(139,92,246,0.15); border:1px solid rgba(139,92,246,0.3); color:#a78bfa; border-radius:7px; padding:0.3rem 0.85rem; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; margin-right:0.75rem; transition:all 0.15s; }
  .rci-file-input::file-selector-button:hover { background:rgba(139,92,246,0.25); }
  .rci-preview-hd { font-size:0.8rem; font-weight:700; color:#9494b0; margin-bottom:0.5rem; }
  .rci-table-wrap { max-height:280px; overflow-y:auto; border:1px solid rgba(255,255,255,0.07); border-radius:10px; }
  .rci-table-wrap::-webkit-scrollbar { width:4px; }
  .rci-table-wrap::-webkit-scrollbar-track { background:transparent; }
  .rci-table-wrap::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
  .rci-table { width:100%; border-collapse:collapse; }
  .rci-table th { padding:0.55rem 0.85rem; text-align:left; font-size:0.68rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.07em; border-bottom:1px solid rgba(255,255,255,0.06); background:#13131a; position:sticky; top:0; }
  .rci-table td { padding:0.7rem 0.85rem; border-bottom:1px solid rgba(255,255,255,0.04); font-size:0.82rem; vertical-align:middle; }
  .rci-table tbody tr:hover { background:rgba(255,255,255,0.025); }
  .rci-table tbody tr:last-child td { border-bottom:none; }
  .cat-badge { display:inline-flex; padding:0.18rem 0.55rem; border-radius:100px; font-size:0.7rem; font-weight:700; background:rgba(99,102,241,0.12); color:#818cf8; }
  .nec-req { display:inline-flex; padding:0.18rem 0.55rem; border-radius:100px; font-size:0.7rem; font-weight:700; background:rgba(16,185,129,0.12); color:#34d399; }
  .nec-opt { display:inline-flex; padding:0.18rem 0.55rem; border-radius:100px; font-size:0.7rem; font-weight:700; background:rgba(245,158,11,0.1); color:#fbbf24; }
  .rci-btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.83rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .rci-btn-primary { background:linear-gradient(135deg,#7c3aed,#6d28d9); color:#fff; box-shadow:0 4px 14px rgba(124,58,237,0.3); }
  .rci-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(124,58,237,0.4); }
  .rci-btn-primary:disabled { opacity:0.45; transform:none; cursor:not-allowed; }
  .rci-btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .rci-btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .rci-btn-link { background:none; border:none; color:#a5b4fc; font-family:'Sora',sans-serif; font-size:0.78rem; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; padding:0; transition:color 0.15s; margin-top:0.6rem; }
  .rci-btn-link:hover { color:#c7d2fe; }
  .rci-btn-icon { background:none; border:none; padding:0.25rem; cursor:pointer; color:#55556e; transition:color 0.15s; }
  .rci-btn-icon:hover { color:#f87171; }
  .rci-trigger { display:inline-flex; align-items:center; gap:0.5rem; padding:0.55rem 1.1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.83rem; font-weight:600; cursor:pointer; border:none; transition:all 0.15s; background:rgba(139,92,246,0.15); color:#a78bfa; border:1px solid rgba(139,92,246,0.25); }
  .rci-trigger:hover { background:rgba(139,92,246,0.25); color:#c4b5fd; }
  .optional-toggle { display:flex; align-items:center; gap:0.6rem; padding:0.75rem 1rem; border-radius:9px; background:rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15); cursor:pointer; font-size:0.82rem; color:#9494b0; transition:all 0.15s; }
  .optional-toggle:hover { background:rgba(99,102,241,0.1); }
`;

export default function RequirementCSVImport({ onImportComplete }: RequirementCSVImportProps) {
  const [isModalOpen,      setIsModalOpen]      = useState(false);
  const [requirements,     setRequirements]     = useState<CSVRequirement[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [businesses,       setBusinesses]       = useState<Business[]>([]);
  // Optional: auto-link to a business after importing to library
  const [linkToBusiness,   setLinkToBusiness]   = useState(false);
  const [selectedBizId,    setSelectedBizId]    = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) fetchBusinesses();
  }, [isModalOpen]);

  async function fetchBusinesses() {
    try {
      const res = await fetch('/api/admin/businesses');
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data);
        if (data.length > 0) setSelectedBizId(data[0].id);
      }
    } catch { toast.error('Failed to load businesses'); }
  }

  function parseCSV(text: string): CSVRequirement[] {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const missing = ['name', 'category', 'necessity'].filter(h => !headers.includes(h));
    if (missing.length > 0) throw new Error(`Missing required columns: ${missing.join(', ')}`);

    const result: CSVRequirement[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const req: any = {};
      headers.forEach((h, idx) => {
        const v = values[idx] || '';
        if (h === 'name') req.name = v;
        else if (h === 'description' || h === 'image') req[h] = v || undefined;
        else if (h === 'category') {
          if (!CATEGORIES.includes(v)) throw new Error(`Row ${i + 1}: Invalid category "${v}". Must be one of: ${CATEGORIES.join(', ')}`);
          req.category = v;
        } else if (h === 'necessity') {
          const lv = v.toLowerCase();
          if (lv === 'required' || lv === 'req') req.necessity = 'Required';
          else if (lv === 'optional' || lv === 'opt') req.necessity = 'Optional';
          else throw new Error(`Row ${i + 1}: Invalid necessity "${v}". Must be "Required" or "Optional"`);
        }
      });
      if (!req.name)      throw new Error(`Row ${i + 1}: Missing required field: name`);
      if (!req.category)  throw new Error(`Row ${i + 1}: Missing required field: category`);
      if (!req.necessity) throw new Error(`Row ${i + 1}: Missing required field: necessity`);
      result.push(req);
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
        setRequirements(parsed);
        toast.success(`${parsed.length} requirements loaded`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to parse CSV');
        setRequirements([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!requirements.length) { toast.error('No requirements to import'); return; }
    setLoading(true);
    let ok = 0, fail = 0;
    const createdTemplateIds: number[] = [];

    try {
      // Step 1: Import all to the library
      for (const req of requirements) {
        const body: any = { ...req };
        // If linking is enabled, pass businessId so the API creates the link in one shot
        if (linkToBusiness && selectedBizId) body.businessId = selectedBizId;

        const res = await fetch('/api/requirements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          ok++;
          const d = await res.json();
          if (d.id) createdTemplateIds.push(d.id);
        } else {
          fail++;
        }
      }

      const parts = [];
      if (ok > 0) parts.push(`${ok} requirement${ok !== 1 ? 's' : ''} added to library`);
      if (linkToBusiness && selectedBizId && ok > 0) {
        const biz = businesses.find(b => b.id === selectedBizId);
        if (biz) parts.push(`linked to ${biz.name}`);
      }
      if (fail > 0) parts.push(`${fail} failed`);

      if (ok > 0) { toast.success(parts.join(' · ')); onImportComplete(); closeModal(); }
      if (fail > 0) toast.error(`${fail} requirement(s) failed to import`);
    } catch { toast.error('Import failed'); }
    finally { setLoading(false); }
  }

  function downloadTemplate() {
    const tpl = `name,category,necessity,description,image\nPoint of Sale System,Equipment,Required,You need a POS system to process sales at [businessName].,\nAccounting Software,Software,Required,Track all income and expenses for [businessName].,\nBusiness License,Legal,Required,A business license is required to legally operate [businessName].,\nLogo Design,Branding,Optional,A professional logo helps establish [businessName]'s brand identity.,`;
    Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([tpl], { type: 'text/csv' })), download: 'requirement-template.csv' }).click();
    toast.success('Template downloaded!');
  }

  function openModal()  { setRequirements([]); if (fileInputRef.current) fileInputRef.current.value = ''; setLinkToBusiness(false); setIsModalOpen(true); }
  function closeModal() { setIsModalOpen(false); setRequirements([]); if (fileInputRef.current) fileInputRef.current.value = ''; }
  function removeRequirement(idx: number) { setRequirements(requirements.filter((_, i) => i !== idx)); }

  return (
    <>
      <style>{S}</style>
      <button onClick={openModal} className="rci-trigger">
        <Upload size={14} />
        Import CSV
      </button>

      {isModalOpen && (
        <div className="rci-overlay" onClick={closeModal}>
          <div className="rci-box" onClick={e => e.stopPropagation()}>
            <div className="rci-title">Import Requirements to Library</div>

            {/* Info */}
            <div className="rci-info">
              <div className="rci-info-title">CSV Format — required columns:</div>
              <ul style={{ paddingLeft: '1.1rem', margin: 0 }}>
                <li><strong>name</strong> — Requirement name</li>
                <li><strong>category</strong> — One of: {CATEGORIES.join(', ')}</li>
                <li><strong>necessity</strong> — "Required" or "Optional"</li>
                <li><strong>description</strong> (optional) — Use <strong>[businessName]</strong> as a token for personalisation</li>
                <li><strong>image</strong> (optional) — Image URL</li>
              </ul>
              <button onClick={downloadTemplate} className="rci-btn-link">
                <Download size={13} /> Download Template CSV
              </button>
            </div>

            {/* File upload */}
            <div className="rci-file-wrap">
              <label className="rci-label">Upload CSV File</label>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="rci-file-input" />
            </div>

            {/* Optional: link to business */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="optional-toggle" onClick={() => setLinkToBusiness(!linkToBusiness)}>
                <input type="checkbox" checked={linkToBusiness} onChange={() => setLinkToBusiness(!linkToBusiness)} style={{ accentColor: '#6366f1', cursor: 'pointer' }} />
                <span style={{ fontWeight: 600, color: linkToBusiness ? '#a5b4fc' : '#9494b0' }}>Also link to a business after importing</span>
                <span style={{ fontSize: '0.72rem', color: '#55556e', marginLeft: 'auto' }}>optional</span>
              </label>
              {linkToBusiness && (
                <div style={{ marginTop: '0.65rem' }}>
                  <label className="rci-label">Select Business</label>
                  <select
                    value={selectedBizId ?? ''}
                    onChange={e => setSelectedBizId(Number(e.target.value))}
                    className="rci-select"
                  >
                    <option value="">— Select a business —</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}{!b.published ? ' (draft)' : ''}</option>)}
                  </select>
                  <div className="rci-hint">Requirements will be added to the library AND linked to this business.</div>
                </div>
              )}
            </div>

            {/* Preview */}
            {requirements.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div className="rci-preview-hd">Preview — {requirements.length} requirements</div>
                <div className="rci-table-wrap">
                  <table className="rci-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Necessity</th>
                        <th style={{ textAlign: 'right' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map((req, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#f0f0f5' }}>{req.name}</td>
                          <td><span className="cat-badge">{req.category}</span></td>
                          <td><span className={req.necessity === 'Required' ? 'nec-req' : 'nec-opt'}>{req.necessity}</span></td>
                          <td style={{ textAlign: 'right' }}>
                            <button onClick={() => removeRequirement(i)} className="rci-btn-icon" title="Remove"><X size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button onClick={closeModal} className="rci-btn rci-btn-ghost">Cancel</button>
              <button onClick={handleImport} disabled={loading || requirements.length === 0} className="rci-btn rci-btn-primary">
                {loading ? 'Importing…' : `Import ${requirements.length} to Library${linkToBusiness && selectedBizId ? ' + Link' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}