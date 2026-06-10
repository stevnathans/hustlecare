'use client';

import { useEffect, useRef, useState } from 'react';
import { VendorTuple } from 'types/vendor';

type CSVProduct = {
  name: string;
  description?: string;
  price: number;
  image?: string;
  url?: string;
  vendorId?: number;
  _vendorName?: string;
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseProductCSV(text: string): CSVProduct[] {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
  if (!headers.includes('name')) throw new Error('Missing required column: name');
  if (!headers.includes('price')) throw new Error('Missing required column: price');

  return lines.slice(1).map((line, i) => {
    const values = parseCSVLine(line);
    const get = (key: string) => values[headers.indexOf(key)]?.trim() ?? '';
    const name = get('name');
    if (!name) throw new Error(`Row ${i + 2}: Missing required field: name`);
    const rawPrice = get('price').replace(/[$,]/g, '');
    const price = parseFloat(rawPrice);
    if (isNaN(price) || price < 0) throw new Error(`Row ${i + 2}: Invalid price "${get('price')}"`);
    return {
      name, price,
      description: get('description') || undefined,
      image: get('image') || undefined,
      url: get('url') || undefined,
      _vendorName: get('vendor') || undefined,
    };
  });
}

type Props = {
  onImportComplete: () => void;
  vendors: VendorTuple[];
};

export default function ProductCSVImport({ onImportComplete, vendors }: Props) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CSVProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openModal = () => {
    setProducts([]); setErrors([]);
    if (fileRef.current) fileRef.current.value = '';
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false); setProducts([]); setErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const downloadTemplate = () => {
    const rows = [
      'name,description,price,image,url,vendor',
      'Wireless Keyboard,Compact mechanical keyboard,89.99,https://example.com/kb.jpg,https://example.com/product,Logitech',
      'Standing Desk,Adjustable height desk,599,,,',
      'USB-C Hub,7-in-1 hub for laptops,49.95,https://example.com/hub.jpg,,Anker',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'products-template.csv';
    a.click();
    showToast('Template downloaded');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { showToast('Please upload a .csv file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setErrors([]);
        const parsed = parseProductCSV(ev.target?.result as string);
        const resolved = parsed.map(p => {
          if (p._vendorName) {
            const match = vendors.find(([, name]) => name.toLowerCase() === p._vendorName!.toLowerCase());
            if (match) return { ...p, vendorId: Number(match[0]) };
          }
          return p;
        });
        setProducts(resolved);
        showToast(`${resolved.length} products ready to import`);
      } catch (err: unknown) {
        setErrors([err instanceof Error ? err.message : 'Failed to parse CSV']);
        setProducts([]);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!products.length) return;
    setLoading(true);
    let ok = 0; let fail = 0; const failedNames: string[] = [];
    try {
      for (const p of products) {
        const { _vendorName, ...payload } = p;
        void _vendorName;
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) { ok++; } else { fail++; failedNames.push(p.name); }
      }
      if (ok > 0) { showToast(`${ok} product${ok !== 1 ? 's' : ''} imported!`); onImportComplete(); }
      if (fail > 0) {
        setErrors([`Failed to import ${fail} product${fail !== 1 ? 's' : ''}: ${failedNames.slice(0, 3).join(', ')}${failedNames.length > 3 ? '…' : ''}`]);
      }
      if (ok > 0 && fail === 0) closeModal();
    } catch {
      setErrors(['Import failed. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  return (
    <>
      <button className="btn btn-ghost" onClick={openModal}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Import CSV
      </button>

      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 740 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Import Products from CSV</div>
                <div className="modal-subtitle">Bulk-add products by uploading a CSV file</div>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-divider" />

            <div className="modal-body">
              {/* Column reference */}
              <div style={{ background: 'rgba(124,106,247,0.07)', border: '1px solid rgba(124,106,247,0.18)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a89cf7', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>CSV Columns</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 2rem' }}>
                  {([
                    ['name', 'required', 'Product name'],
                    ['price', 'required', 'Numeric, e.g. 49.99'],
                    ['description', 'optional', 'Short description'],
                    ['image', 'optional', 'Full image URL'],
                    ['url', 'optional', 'Product page URL'],
                    ['vendor', 'optional', 'Matched by name'],
                  ] as const).map(([col, req, desc]) => (
                    <div key={col} style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', fontSize: '0.78rem', color: '#6b6b8a', lineHeight: 1.8 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: '#a89cf7', fontSize: '0.76rem' }}>{col}</span>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 100, background: req === 'required' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)', color: req === 'required' ? '#f87171' : '#4a4a66' }}>{req}</span>
                      <span style={{ color: '#4a4a66' }}>— {desc}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={downloadTemplate}
                  style={{ background: 'none', border: 'none', color: '#7c6af7', fontFamily: "'Sora', sans-serif", fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: 0, marginTop: '0.75rem' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#a89cf7')}
                  onMouseOut={e => (e.currentTarget.style.color = '#7c6af7')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download template CSV
                </button>
              </div>

              {/* File input */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem' }}>Upload CSV File</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: 10, padding: '0.65rem 1rem', color: '#9494b0', fontFamily: "'Sora', sans-serif", fontSize: '0.83rem', cursor: 'pointer', boxSizing: 'border-box' }}
                />
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
                  {errors.map((e, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {e}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview table */}
              {products.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b6b8a', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Preview — <span style={{ color: '#a89cf7' }}>{products.length}</span> product{products.length !== 1 ? 's' : ''}</span>
                    <span style={{ color: '#4a4a66', fontWeight: 400 }}>Hover rows to remove</span>
                  </div>
                  <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Name', 'Price', 'Vendor', 'URL', ''].map(h => (
                            <th key={h} style={{ padding: '0.55rem 0.85rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: '#4a4a66', textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f0f14', position: 'sticky', top: 0 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={i}
                            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
                            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.83rem', fontWeight: 600, color: '#e2e2ef', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              {p.name}
                              {p.description && <div style={{ fontWeight: 400, fontSize: '0.72rem', color: '#4a4a66', marginTop: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{p.description}</div>}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.83rem', color: '#a4f4b0' }}>${p.price.toLocaleString()}</span>
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              {p.vendorId ? (
                                <span style={{ display: 'inline-flex', padding: '0.15rem 0.55rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(124,106,247,0.12)', color: '#a89cf7' }}>
                                  {vendors.find(([id]) => Number(id) === p.vendorId)?.[1] ?? p._vendorName}
                                </span>
                              ) : p._vendorName ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.55rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }} title="Vendor not found — will be left unassigned">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                  {p._vendorName}
                                </span>
                              ) : <span style={{ color: '#3a3a56' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7c6af7', fontSize: '0.76rem', textDecoration: 'none' }}>↗ link</a> : <span style={{ color: '#3a3a56' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <button
                                onClick={() => setProducts(prev => prev.filter((_, idx) => idx !== i))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a66', padding: '0.2rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center' }}
                                onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
                                onMouseOut={e => (e.currentTarget.style.color = '#4a4a66')}
                                title="Remove"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {products.some(p => p._vendorName && !p.vendorId) && (
                    <div style={{ fontSize: '0.73rem', color: '#fbbf24', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
                      Some vendor names could not be matched — those products will be imported without a vendor.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={loading || products.length === 0}>
                {loading ? (
                  <>
                    <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" /></svg>
                    Importing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" /></svg>
                    Import {products.length} Product{products.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast toast-${toast.type}`} style={{ bottom: '5rem' }}>{toast.msg}</div>
      )}
    </>
  );
}