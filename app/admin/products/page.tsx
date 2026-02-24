'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';

// ─── Types ───────────────────────────────────────────────────────────────────

type Vendor = {
  id: number;
  name: string;
  website: string;
  logo: string;
};

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  url: string;
  vendorId: number | null;
  vendor: Vendor | null;
};

type SortField = 'name' | 'price' | 'vendor' | 'id';
type SortDir = 'asc' | 'desc';
type ViewMode = 'table' | 'grid';

// ─── Constants ────────────────────────────────────────────────────────────────

const PRICE_RANGES = [
  { label: 'All prices', min: 0, max: Infinity },
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50–$200', min: 50, max: 200 },
  { label: '$200–$1,000', min: 200, max: 1000 },
  { label: '$1,000+', min: 1000, max: Infinity },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  const active = sortField === field;
  return (
    <span className={`inline-flex flex-col ml-1 ${active ? 'text-indigo-500' : 'text-slate-400'}`}>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`mb-0.5 transition-opacity ${active && sortDir === 'asc' ? 'opacity-100' : 'opacity-30'}`}>
        <path d="M4 0L8 5H0L4 0Z" fill="currentColor" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" className={`transition-opacity ${active && sortDir === 'desc' ? 'opacity-100' : 'opacity-30'}`}>
        <path d="M4 5L0 0H8L4 5Z" fill="currentColor" />
      </svg>
    </span>
  );
}

// ─── Product CSV Import ───────────────────────────────────────────────────────

type CSVProduct = {
  name: string;
  description?: string;
  price: number;
  image?: string;
  url?: string;
  vendorId?: number;
  _vendorName?: string; // display only
};

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = ''; let inQuotes = false;
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

  const result: CSVProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const get = (key: string) => values[headers.indexOf(key)]?.trim() ?? '';

    const name = get('name');
    if (!name) throw new Error(`Row ${i + 1}: Missing required field: name`);
    const rawPrice = get('price').replace(/[$,]/g, '');
    const price = parseFloat(rawPrice);
    if (isNaN(price) || price < 0) throw new Error(`Row ${i + 1}: Invalid price "${get('price')}"`);

    result.push({
      name,
      price,
      description: get('description') || undefined,
      image: get('image') || undefined,
      url: get('url') || undefined,
      _vendorName: get('vendor') || undefined,
    });
  }
  return result;
}

function ProductCSVImport({ onImportComplete, vendors }: {
  onImportComplete: () => void;
  vendors: [string, string][];
}) {
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

  function openModal() {
    setProducts([]); setErrors([]);
    if (fileRef.current) fileRef.current.value = '';
    setOpen(true);
  }
  function closeModal() {
    setOpen(false); setProducts([]); setErrors([]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function downloadTemplate() {
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
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) { showToast('Please upload a .csv file', 'error'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setErrors([]);
        const parsed = parseProductCSV(ev.target?.result as string);
        // Resolve vendor IDs from names
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
        const message = err instanceof Error ? err.message : 'Failed to parse CSV';
        setErrors([message]);
        setProducts([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
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
  }

  function removeProduct(idx: number) {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  }

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open]);

  return (
    <>
      {/* Trigger button */}
      <button className="btn btn-ghost" onClick={openModal}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Import CSV
      </button>

      {/* Modal */}
      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 740 }} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="modal-header">
              <div>
                <div className="modal-title">Import Products from CSV</div>
                <div className="modal-subtitle">Bulk-add products by uploading a CSV file</div>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="modal-divider" />

            <div className="modal-body">
              {/* Info panel */}
              <div style={{
                background: 'rgba(124,106,247,0.07)',
                border: '1px solid rgba(124,106,247,0.18)',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a89cf7', marginBottom: '0.5rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  CSV Columns
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 2rem' }}>
                  {[
                    ['name', 'required', 'Product name'],
                    ['price', 'required', 'Numeric, e.g. 49.99'],
                    ['description', 'optional', 'Short description'],
                    ['image', 'optional', 'Full image URL'],
                    ['url', 'optional', 'Product page URL'],
                    ['vendor', 'optional', 'Matched by name'],
                  ].map(([col, req, desc]) => (
                    <div key={col} style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', fontSize: '0.78rem', color: '#6b6b8a', lineHeight: 1.8 }}>
                      <span style={{ fontFamily: "'DM Mono', monospace", color: '#a89cf7', fontSize: '0.76rem' }}>{col}</span>
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 100,
                        background: req === 'required' ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.06)',
                        color: req === 'required' ? '#f87171' : '#4a4a66',
                      }}>{req}</span>
                      <span style={{ color: '#4a4a66' }}>— {desc}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={downloadTemplate}
                  style={{ background: 'none', border: 'none', color: '#7c6af7', fontFamily: "'Sora', sans-serif", fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: 0, marginTop: '0.75rem', transition: 'color 0.15s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#a89cf7')}
                  onMouseOut={e => (e.currentTarget.style.color = '#7c6af7')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download template CSV
                </button>
              </div>

              {/* File upload */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.4rem' }}>Upload CSV File</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px dashed rgba(255,255,255,0.12)',
                    borderRadius: 10,
                    padding: '0.65rem 1rem',
                    color: '#9494b0',
                    fontFamily: "'Sora', sans-serif",
                    fontSize: '0.83rem',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Errors */}
              {errors.length > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem',
                }}>
                  {errors.map((e, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: '#f87171', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
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
                    {products.length > 0 && <span style={{ color: '#4a4a66', fontWeight: 400 }}>Hover rows to remove</span>}
                  </div>
                  <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Name', 'Price', 'Vendor', 'URL', ''].map(h => (
                            <th key={h} style={{
                              padding: '0.55rem 0.85rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700,
                              color: '#4a4a66', textTransform: 'uppercase', letterSpacing: '0.07em',
                              borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0f0f14',
                              position: 'sticky', top: 0,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={i} style={{ transition: 'background 0.12s' }}
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
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                  {p._vendorName}
                                </span>
                              ) : <span style={{ color: '#3a3a56' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              {p.url ? (
                                <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#7c6af7', fontSize: '0.76rem', textDecoration: 'none' }}>↗ link</a>
                              ) : <span style={{ color: '#3a3a56' }}>—</span>}
                            </td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                              <button
                                onClick={() => removeProduct(i)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4a4a66', padding: '0.2rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', transition: 'color 0.15s' }}
                                onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
                                onMouseOut={e => (e.currentTarget.style.color = '#4a4a66')}
                                title="Remove"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {products.some(p => p._vendorName && !p.vendorId) && (
                    <div style={{ fontSize: '0.73rem', color: '#fbbf24', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                      Some vendor names could not be matched — those products will be imported without a vendor.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={loading || products.length === 0}
              >
                {loading ? (
                  <>
                    <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/></svg>
                    Importing…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/></svg>
                    Import {products.length} Product{products.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Local toast for the import modal */}
      {toast && (
        <div className={`toast toast-${toast.type}`} style={{ bottom: '5rem' }}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

// ─── Product Form Modal (Dark Theme) ─────────────────────────────────────────

type FormField = { name: string; description: string; price: string; image: string; url: string; vendorId: string };
const EMPTY_FORM: FormField = { name: '', description: '', price: '', image: '', url: '', vendorId: '' };

function ProductFormModal({
  open, setOpen, fetchProducts, editingProduct, vendors,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  fetchProducts: () => void;
  editingProduct: Product | null;
  vendors: [string, string][];
}) {
  const [form, setForm] = useState<FormField>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormField>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setForm({
          name: editingProduct.name || '',
          description: editingProduct.description || '',
          price: editingProduct.price != null ? String(editingProduct.price) : '',
          image: editingProduct.image || '',
          url: editingProduct.url || '',
          vendorId: editingProduct.vendorId != null ? String(editingProduct.vendorId) : '',
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setErrors({});
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [open, editingProduct]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  const validate = (): boolean => {
    const errs: Partial<FormField> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.price.trim()) errs.price = 'Price is required';
    else if (isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Enter a valid price';
    if (form.url && !/^https?:\/\/.+/.test(form.url)) errs.url = 'Must start with http:// or https://';
    if (form.image && !/^https?:\/\/.+/.test(form.image)) errs.image = 'Must start with http:// or https://';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image: form.image.trim() || null,
        url: form.url.trim() || null,
        vendorId: form.vendorId ? Number(form.vendorId) : null,
      };
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      setOpen(false);
      fetchProducts();
    } catch {
      setErrors({ name: 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isEdit = !!editingProduct;

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">{isEdit ? 'Edit Product' : 'New Product'}</div>
            <div className="modal-subtitle">{isEdit ? `Updating "${editingProduct?.name}"` : 'Add a new product to your catalog'}</div>
          </div>
          <button className="modal-close" onClick={() => setOpen(false)} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="modal-divider" />

        {/* Body */}
        <div className="modal-body">
          <div className="form-grid">
            {/* Name */}
            <div className="form-group form-full">
              <label className="form-label">
                Product Name <span className="form-required">*</span>
              </label>
              <input
                ref={firstInputRef}
                type="text"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                placeholder="e.g. Wireless Mechanical Keyboard"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <div className="form-error">{errors.name}</div>}
            </div>

            {/* Price & Vendor */}
            <div className="form-group">
              <label className="form-label">
                Price <span className="form-required">*</span>
              </label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`form-input input-with-prefix ${errors.price ? 'form-input-error' : ''}`}
                  placeholder="0.00"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                />
              </div>
              {errors.price && <div className="form-error">{errors.price}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Vendor</label>
              <select
                className="form-input form-select"
                value={form.vendorId}
                onChange={e => setForm(f => ({ ...f, vendorId: e.target.value }))}
              >
                <option value="">No vendor</option>
                {vendors.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="form-group form-full">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                placeholder="Brief description of the product…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="form-group form-full">
              <label className="form-label">Image URL</label>
              <div className="url-input-wrap">
                <svg className="url-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                </svg>
                <input
                  type="url"
                  className={`form-input input-with-icon ${errors.image ? 'form-input-error' : ''}`}
                  placeholder="https://example.com/image.jpg"
                  value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                />
              </div>
              {errors.image && <div className="form-error">{errors.image}</div>}
              {form.image && !errors.image && (
                <div className="img-preview-wrap">
                  <img src={form.image} alt="preview" className="img-preview" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
              )}
            </div>

            {/* Product URL */}
            <div className="form-group form-full">
              <label className="form-label">Product URL</label>
              <div className="url-input-wrap">
                <svg className="url-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                </svg>
                <input
                  type="url"
                  className={`form-input input-with-icon ${errors.url ? 'form-input-error' : ''}`}
                  placeholder="https://example.com/product"
                  value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                />
              </div>
              {errors.url && <div className="form-error">{errors.url}</div>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round"/>
                </svg>
                Saving…
              </>
            ) : isEdit ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                </svg>
                Save Changes
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4"/>
                </svg>
                Add Product
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({
  total, page, pageSize, onPage, onPageSize,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize: (s: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Page window: show up to 7 pages
  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    const lo = Math.max(2, page - 1);
    const hi = Math.min(totalPages - 1, page + 1);
    for (let i = lo; i <= hi; i++) pages.push(i);
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> products
      </div>

      <div className="pagination-controls">
        <button
          className="pg-btn"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="pg-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pg-btn ${page === p ? 'pg-active' : ''}`}
              onClick={() => onPage(p as number)}
            >
              {p}
            </button>
          )
        )}

        <button
          className="pg-btn"
          disabled={page === totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <div className="pagination-size">
        <span style={{ color: '#4a4a66', fontSize: '0.78rem' }}>Rows per page</span>
        <select
          className="filter-select"
          value={pageSize}
          onChange={e => { onPageSize(Number(e.target.value)); onPage(1); }}
          style={{ padding: '0.3rem 1.8rem 0.3rem 0.65rem', fontSize: '0.78rem' }}
        >
          {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [priceRangeIdx, setPriceRangeIdx] = useState(0);
  const [vendorFilter, setVendorFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setProducts([]);
      showToast('Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [searchTerm, vendorFilter, priceRangeIdx, sortField, sortDir]);

  // Keyboard shortcut: N to open new product modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !modalOpen && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        setEditingProduct(null);
        setModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  const vendors = useMemo(() => {
    const set = new Map<string, string>();
    products.forEach(p => { if (p.vendor) set.set(String(p.vendor.id), p.vendor.name); });
    return Array.from(set.entries());
  }, [products]);

  const priceRange = PRICE_RANGES[priceRangeIdx];

  const filteredAndSorted = useMemo(() => {
    let list = products.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.vendor?.name.toLowerCase().includes(q);
      const matchVendor = !vendorFilter || String(p.vendor?.id) === vendorFilter;
      const matchPrice = p.price >= priceRange.min && p.price < priceRange.max;
      return matchSearch && matchVendor && matchPrice;
    });

    list = [...list].sort((a, b) => {
      let va: string | number, vb: string | number;
      if (sortField === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); }
      else if (sortField === 'price') { va = a.price; vb = b.price; }
      else if (sortField === 'vendor') { va = a.vendor?.name.toLowerCase() ?? ''; vb = b.vendor?.name.toLowerCase() ?? ''; }
      else { va = a.id; vb = b.id; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [products, searchTerm, vendorFilter, priceRange, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAndSorted.slice(start, start + pageSize);
  }, [filteredAndSorted, page, pageSize]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const handleEdit = (product: Product) => { setEditingProduct(product); setModalOpen(true); };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setDeleteConfirmId(null);
      fetchProducts();
      showToast('Product deleted');
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch {
      showToast('Failed to delete product', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.size} products?`)) return;
    await Promise.all(Array.from(selectedIds).map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })));
    setSelectedIds(new Set());
    fetchProducts();
    showToast(`${selectedIds.size} products deleted`);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    const pageIds = paginated.map(p => p.id);
    const allSelected = pageIds.every(id => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(prev => { const n = new Set(prev); pageIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSelectedIds(prev => { const n = new Set(prev); pageIds.forEach(id => n.add(id)); return n; });
    }
  };

  const clearFilters = () => { setSearchTerm(''); setVendorFilter(''); setPriceRangeIdx(0); };
  const hasActiveFilters = searchTerm || vendorFilter || priceRangeIdx !== 0;

  // Export CSV
  const exportCSV = () => {
    const rows = [
      ['ID', 'Name', 'Description', 'Price', 'Vendor', 'URL', 'Image'],
      ...filteredAndSorted.map(p => [
        p.id, p.name, p.description || '', p.price, p.vendor?.name || '', p.url || '', p.image || '',
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'products.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV');
  };

  const allOnPageSelected = paginated.length > 0 && paginated.every(p => selectedIds.has(p.id));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .products-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          background: #0f0f14;
          color: #e2e2ef;
          padding: 2rem;
        }

        .mono { font-family: 'DM Mono', monospace; }

        .glass {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          backdrop-filter: blur(12px);
        }

        /* ── Header ─────────────────────────────────── */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .page-title {
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, #fff 40%, #7c6af7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.1;
        }
        .page-subtitle { color: #6b6b8a; font-size: 0.85rem; margin-top: 0.25rem; }

        .header-actions { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }

        /* ── Stats ──────────────────────────────────── */
        .stats-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .stat-pill {
          background: rgba(124,106,247,0.12);
          border: 1px solid rgba(124,106,247,0.2);
          border-radius: 100px;
          padding: 0.35rem 1rem;
          font-size: 0.78rem;
          color: #a89cf7;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stat-pill strong { color: #e2e2ef; font-size: 0.9rem; }

        /* ── Toolbar ────────────────────────────────── */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          padding: 1rem 1.25rem;
          margin-bottom: 0.5rem;
        }
        .search-wrap { position: relative; flex: 1; min-width: 200px; }
        .search-icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: #6b6b8a; pointer-events: none;
        }
        .search-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.55rem 0.9rem 0.55rem 2.4rem;
          color: #e2e2ef;
          font-family: 'Sora', sans-serif;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input::placeholder { color: #4a4a66; }
        .search-input:focus { border-color: rgba(124,106,247,0.5); box-shadow: 0 0 0 3px rgba(124,106,247,0.1); }

        /* Clear search button inside input */
        .search-clear {
          position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
          background: none; border: none; color: #4a4a66; cursor: pointer; padding: 2px;
          border-radius: 4px; display: flex; align-items: center; justify-content: center;
          transition: color 0.15s;
        }
        .search-clear:hover { color: #a89cf7; }

        .filter-select {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.55rem 2rem 0.55rem 0.85rem;
          color: #e2e2ef;
          font-family: 'Sora', sans-serif;
          font-size: 0.82rem;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236b6b8a' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.6rem center;
          transition: border-color 0.2s;
        }
        .filter-select:focus { border-color: rgba(124,106,247,0.5); }
        .filter-select option { background: #1a1a26; }

        /* ── Buttons ────────────────────────────────── */
        .btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.55rem 1.1rem;
          border-radius: 10px;
          font-family: 'Sora', sans-serif;
          font-size: 0.83rem; font-weight: 600;
          cursor: pointer; border: none;
          transition: all 0.18s; white-space: nowrap;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; pointer-events: none; }
        .btn-primary {
          background: linear-gradient(135deg, #7c6af7, #5a47e0);
          color: #fff;
          box-shadow: 0 4px 16px rgba(124,106,247,0.3);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,106,247,0.45); }
        .btn-ghost {
          background: rgba(255,255,255,0.06);
          color: #b0b0cc;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); color: #e2e2ef; }
        .btn-danger { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.25); }
        .btn-danger:hover { background: rgba(239,68,68,0.25); }
        .btn-icon { padding: 0.5rem; border-radius: 8px; }
        .btn-active { background: rgba(124,106,247,0.2); color: #a89cf7; border-color: rgba(124,106,247,0.4); }

        .filter-tag {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: rgba(124,106,247,0.1); border: 1px solid rgba(124,106,247,0.2);
          border-radius: 100px; padding: 0.28rem 0.75rem;
          font-size: 0.75rem; color: #a89cf7; cursor: pointer; transition: all 0.15s;
        }
        .filter-tag:hover { background: rgba(124,106,247,0.2); }

        /* ── Bulk bar ───────────────────────────────── */
        .bulk-bar {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.7rem 1.25rem;
          border-bottom: 1px solid rgba(124,106,247,0.15);
          background: rgba(124,106,247,0.06);
          font-size: 0.83rem; color: #a89cf7;
          animation: slideDown 0.2s ease;
        }

        /* ── Table ──────────────────────────────────── */
        .products-table { width: 100%; border-collapse: collapse; }
        .products-table th {
          padding: 0.65rem 1rem;
          text-align: left;
          font-size: 0.72rem; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: #4a4a66;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          white-space: nowrap; user-select: none;
        }
        .products-table th.sortable { cursor: pointer; transition: color 0.15s; }
        .products-table th.sortable:hover { color: #a89cf7; }
        .products-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .products-table tbody tr { transition: background 0.15s; }
        .products-table tbody tr:hover { background: rgba(255,255,255,0.03); }
        .products-table tbody tr.selected { background: rgba(124,106,247,0.06); }
        .products-table tbody tr:last-child td { border-bottom: none; }

        .cb { width: 16px; height: 16px; accent-color: #7c6af7; cursor: pointer; }

        .prod-img {
          width: 48px; height: 48px; border-radius: 10px; overflow: hidden;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); flex-shrink: 0;
        }
        .prod-img-placeholder {
          width: 48px; height: 48px; border-radius: 10px;
          background: rgba(255,255,255,0.04); border: 1px dashed rgba(255,255,255,0.1);
          display: flex; align-items: center; justify-content: center; color: #3a3a56; flex-shrink: 0;
        }

        .vendor-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 100px; padding: 0.2rem 0.6rem 0.2rem 0.3rem;
          font-size: 0.78rem; color: #b0b0cc; transition: all 0.15s;
          text-decoration: none; max-width: 150px; overflow: hidden;
        }
        .vendor-badge:hover { border-color: rgba(124,106,247,0.4); color: #a89cf7; }
        .vendor-logo {
          width: 18px; height: 18px; border-radius: 50%; object-fit: cover;
          border: 1px solid rgba(255,255,255,0.1); flex-shrink: 0;
        }

        .price-tag { font-family: 'DM Mono', monospace; font-size: 0.88rem; color: #a4f4b0; font-weight: 500; }

        .url-link {
          display: inline-flex; align-items: center; gap: 0.3rem;
          color: #7c6af7; font-size: 0.8rem; text-decoration: none; transition: color 0.15s;
        }
        .url-link:hover { color: #a89cf7; }

        .action-btn {
          background: none; border: none; cursor: pointer;
          padding: 0.35rem 0.6rem; border-radius: 7px;
          font-size: 0.78rem; font-family: 'Sora', sans-serif; font-weight: 600; transition: all 0.15s;
        }
        .action-edit { color: #7c6af7; }
        .action-edit:hover { background: rgba(124,106,247,0.15); }
        .action-delete { color: #f87171; }
        .action-delete:hover { background: rgba(239,68,68,0.12); }

        /* ── Empty state ────────────────────────────── */
        .empty-state { text-align: center; padding: 4rem 2rem; color: #3a3a56; }
        .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
        .empty-state p { font-size: 0.9rem; margin-top: 0.4rem; color: #4a4a66; }

        /* ── Grid view ──────────────────────────────── */
        .grid-view {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem; padding: 1.25rem;
        }
        .product-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; overflow: hidden; transition: all 0.2s; position: relative; cursor: pointer;
        }
        .product-card:hover { border-color: rgba(124,106,247,0.3); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
        .product-card.selected { border-color: rgba(124,106,247,0.5); background: rgba(124,106,247,0.06); }
        .card-img { width: 100%; aspect-ratio: 16/9; object-fit: cover; background: rgba(255,255,255,0.04); }
        .card-img-placeholder {
          width: 100%; aspect-ratio: 16/9;
          display: flex; align-items: center; justify-content: center;
          background: rgba(255,255,255,0.03); color: #2a2a3e; font-size: 2rem;
        }
        .card-body { padding: 1rem; }
        .card-name { font-size: 0.92rem; font-weight: 600; color: #e2e2ef; margin-bottom: 0.35rem; line-height: 1.3; }
        .card-desc { font-size: 0.75rem; color: #5a5a7a; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 1rem; border-top: 1px solid rgba(255,255,255,0.05); }
        .card-cb { position: absolute; top: 0.6rem; left: 0.6rem; }
        .card-actions { position: absolute; top: 0.5rem; right: 0.5rem; display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.15s; }
        .product-card:hover .card-actions { opacity: 1; }
        .card-action-btn { width: 28px; height: 28px; border-radius: 7px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; font-size: 0.75rem; transition: all 0.15s; }
        .card-action-edit { background: rgba(124,106,247,0.8); color: #fff; }
        .card-action-edit:hover { background: #7c6af7; }
        .card-action-del { background: rgba(239,68,68,0.8); color: #fff; }
        .card-action-del:hover { background: #ef4444; }

        /* ── Pagination ─────────────────────────────── */
        .pagination-bar {
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
          gap: 0.75rem; padding: 0.85rem 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .pagination-info { font-size: 0.79rem; color: #4a4a66; }
        .pagination-info strong { color: #8080a8; }
        .pagination-controls { display: flex; align-items: center; gap: 0.25rem; }
        .pagination-size { display: flex; align-items: center; gap: 0.5rem; }
        .pg-btn {
          min-width: 32px; height: 32px; padding: 0 0.35rem;
          border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: #8080a8; font-family: 'DM Mono', monospace; font-size: 0.8rem;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .pg-btn:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: #e2e2ef; border-color: rgba(255,255,255,0.15); }
        .pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .pg-btn.pg-active { background: rgba(124,106,247,0.2); color: #a89cf7; border-color: rgba(124,106,247,0.4); }
        .pg-ellipsis { padding: 0 0.3rem; color: #3a3a56; font-size: 0.85rem; }

        /* ── Skeleton ───────────────────────────────── */
        .skeleton-row td { padding: 0.85rem 1rem; }
        .skel {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 6px; height: 14px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .skel-avatar { width: 48px; height: 48px; border-radius: 10px; }

        /* ── Toast ──────────────────────────────────── */
        .toast {
          position: fixed; bottom: 1.5rem; right: 1.5rem;
          padding: 0.75rem 1.25rem; border-radius: 12px;
          font-size: 0.84rem; font-family: 'Sora', sans-serif;
          z-index: 9999; animation: toastIn 0.25s ease; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .toast-success { background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #6ee7b7; }
        .toast-error { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #fca5a5; }
        @keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        /* ── Confirm dialog ─────────────────────────── */
        .confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 9998; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.15s ease; }
        .confirm-box { background: #1a1a26; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 1.75rem; max-width: 380px; width: 90%; box-shadow: 0 24px 80px rgba(0,0,0,0.6); }
        .confirm-title { font-size: 1.05rem; font-weight: 600; margin-bottom: 0.5rem; }
        .confirm-sub { font-size: 0.84rem; color: #6b6b8a; margin-bottom: 1.5rem; }
        .confirm-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

        /* ── Modal (dark theme) ─────────────────────── */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7);
          backdrop-filter: blur(6px);
          z-index: 9000; display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          animation: fadeIn 0.18s ease;
        }
        .modal-box {
          background: #13131f;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          width: 100%; max-width: 560px;
          box-shadow: 0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,106,247,0.1) inset;
          animation: modalIn 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
          display: flex; flex-direction: column;
          max-height: 92vh;
          overflow: hidden;
        }
        @keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: none; } }

        .modal-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 1.5rem 1.75rem 1.25rem;
          gap: 1rem;
        }
        .modal-title {
          font-size: 1.2rem; font-weight: 700; letter-spacing: -0.02em; color: #f0f0ff;
        }
        .modal-subtitle { font-size: 0.8rem; color: #5a5a7a; margin-top: 0.2rem; }
        .modal-close {
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; color: #6b6b8a; cursor: pointer; padding: 0.4rem;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s; flex-shrink: 0;
        }
        .modal-close:hover { background: rgba(255,255,255,0.1); color: #e2e2ef; }

        .modal-divider { height: 1px; background: rgba(255,255,255,0.07); margin: 0; }

        .modal-body { padding: 1.5rem 1.75rem; overflow-y: auto; flex: 1; }
        .modal-body::-webkit-scrollbar { width: 4px; }
        .modal-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.1rem; }
        .form-full { grid-column: 1 / -1; }

        .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
        .form-label {
          font-size: 0.76rem; font-weight: 600; color: #6b6b8a; letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .form-required { color: #f87171; }

        .form-input {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 0.65rem 0.9rem;
          color: #e2e2ef;
          font-family: 'Sora', sans-serif; font-size: 0.87rem;
          outline: none; width: 100%;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .form-input::placeholder { color: #3a3a58; }
        .form-input:focus {
          border-color: rgba(124,106,247,0.6);
          box-shadow: 0 0 0 3px rgba(124,106,247,0.12);
          background: rgba(255,255,255,0.07);
        }
        .form-input-error { border-color: rgba(239,68,68,0.5) !important; }
        .form-input-error:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }
        .form-error { font-size: 0.74rem; color: #f87171; margin-top: 0.1rem; }

        .form-textarea { resize: vertical; min-height: 80px; font-family: 'Sora', sans-serif; }
        .form-select { cursor: pointer; }
        .form-select option { background: #1a1a26; }

        .input-prefix-wrap { position: relative; }
        .input-prefix {
          position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
          color: #6b6b8a; font-family: 'DM Mono', monospace; font-size: 0.85rem; pointer-events: none;
        }
        .input-with-prefix { padding-left: 1.75rem !important; font-family: 'DM Mono', monospace !important; }

        .url-input-wrap { position: relative; }
        .url-icon {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          color: #5a5a7a; pointer-events: none;
        }
        .input-with-icon { padding-left: 2.2rem !important; }

        .img-preview-wrap { margin-top: 0.6rem; border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); max-height: 100px; }
        .img-preview { width: 100%; height: 100px; object-fit: cover; display: block; }

        .modal-footer {
          display: flex; justify-content: flex-end; gap: 0.75rem;
          padding: 1.1rem 1.75rem;
          border-top: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
        }

        /* Spinner */
        .spin { animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Shortcut hint */
        .shortcut-hint {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; color: #3a3a56; font-family: 'DM Mono', monospace;
        }
        .kbd {
          background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 4px; padding: 0.1rem 0.35rem; font-size: 0.68rem; color: #5a5a7a;
        }

        .divider { width: 1px; height: 24px; background: rgba(255,255,255,0.08); flex-shrink: 0; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      <div className="products-root">
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>

          {/* Page header */}
          <div className="page-header">
            <div>
              <div className="page-title">Product Catalog</div>
              <div className="page-subtitle mono">
                {isLoading ? 'Loading…' : `${filteredAndSorted.length} of ${products.length} products`}
              </div>
            </div>
            <div className="header-actions">
              <span className="shortcut-hint">
                <span className="kbd">N</span> new
              </span>
              <ProductCSVImport onImportComplete={fetchProducts} vendors={vendors} />
              <button className="btn btn-ghost" onClick={exportCSV} title="Export filtered products as CSV">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export CSV
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setEditingProduct(null); setModalOpen(true); }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                New Product
              </button>
            </div>
          </div>

          {/* Stats */}
          {!isLoading && (
            <div className="stats-row">
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                Total <strong>{products.length}</strong>
              </div>
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                Vendors <strong>{vendors.length}</strong>
              </div>
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
                Avg price <strong className="mono">
                  ${products.length ? Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / products.length).toLocaleString() : 0}
                </strong>
              </div>
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                Max price <strong className="mono">
                  ${products.length ? Math.max(...products.map(p => p.price || 0)).toLocaleString() : 0}
                </strong>
              </div>
              {hasActiveFilters && (
                <div className="stat-pill">Filtered to <strong>{filteredAndSorted.length}</strong></div>
              )}
            </div>
          )}

          {/* Main panel */}
          <div className="glass" style={{ overflow: 'hidden' }}>
            {/* Toolbar */}
            <div className="toolbar">
              <div className="search-wrap">
                <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search name, description, vendor…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {searchTerm && (
                  <button className="search-clear" onClick={() => setSearchTerm('')}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  </button>
                )}
              </div>

              <div className="divider" />

              <select value={vendorFilter} onChange={e => setVendorFilter(e.target.value)} className="filter-select">
                <option value="">All vendors</option>
                {vendors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>

              <select value={priceRangeIdx} onChange={e => setPriceRangeIdx(Number(e.target.value))} className="filter-select">
                {PRICE_RANGES.map((r, i) => <option key={i} value={i}>{r.label}</option>)}
              </select>

              {hasActiveFilters && (
                <button className="filter-tag" onClick={clearFilters}>Clear filters ×</button>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button className={`btn btn-ghost btn-icon ${viewMode === 'table' ? 'btn-active' : ''}`} onClick={() => setViewMode('table')} title="Table view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/></svg>
                </button>
                <button className={`btn btn-ghost btn-icon ${viewMode === 'grid' ? 'btn-active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
              </div>
            </div>

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="bulk-bar">
                <span>{selectedIds.size} selected</span>
                <button className="btn btn-danger" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={handleBulkDelete}>
                  Delete selected
                </button>
                <button className="btn btn-ghost" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem' }} onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </button>
              </div>
            )}

            {/* TABLE VIEW */}
            {viewMode === 'table' && (
              <div style={{ overflowX: 'auto' }}>
                <table className="products-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40, paddingLeft: '1.25rem' }}>
                        <input
                          type="checkbox" className="cb"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAll}
                          style={{ display: paginated.length ? 'block' : 'none' }}
                        />
                      </th>
                      <th style={{ width: 60 }}>Image</th>
                      <th className="sortable" onClick={() => handleSort('name')}>Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} /></th>
                      <th>Description</th>
                      <th className="sortable" onClick={() => handleSort('vendor')}>Vendor <SortIcon field="vendor" sortField={sortField} sortDir={sortDir} /></th>
                      <th className="sortable" onClick={() => handleSort('price')}>Price <SortIcon field="price" sortField={sortField} sortDir={sortDir} /></th>
                      <th>Link</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i} className="skeleton-row">
                          <td><div className="skel" style={{ width: 16, height: 16, borderRadius: 4 }} /></td>
                          <td><div className="skel skel-avatar" /></td>
                          <td><div className="skel" style={{ width: '70%' }} /></td>
                          <td><div className="skel" style={{ width: '90%' }} /></td>
                          <td><div className="skel" style={{ width: '50%' }} /></td>
                          <td><div className="skel" style={{ width: 60 }} /></td>
                          <td><div className="skel" style={{ width: 40 }} /></td>
                          <td><div className="skel" style={{ width: 80 }} /></td>
                        </tr>
                      ))
                    ) : paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">
                            <div className="empty-icon">📦</div>
                            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>No products found</div>
                            <p>{hasActiveFilters ? 'Try clearing your filters' : 'Add your first product to get started'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginated.map(product => (
                        <tr key={product.id} className={selectedIds.has(product.id) ? 'selected' : ''}>
                          <td style={{ paddingLeft: '1.25rem' }}>
                            <input type="checkbox" className="cb" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} />
                          </td>
                          <td>
                            {product.image ? (
                              <div className="prod-img">
                                <Image src={product.image} alt={product.name} width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div className="prod-img-placeholder">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                              </div>
                            )}
                          </td>
                          <td><span style={{ fontWeight: 600, color: '#e2e2ef', fontSize: '0.88rem' }}>{product.name}</span></td>
                          <td>
                            <span style={{ color: '#5a5a7a', fontSize: '0.8rem', display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {product.description || '—'}
                            </span>
                          </td>
                          <td>
                            {product.vendor ? (
                              product.vendor.website ? (
                                <a href={product.vendor.website} target="_blank" rel="noopener noreferrer" className="vendor-badge">
                                  {product.vendor.logo && <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                                </a>
                              ) : (
                                <span className="vendor-badge" style={{ cursor: 'default' }}>
                                  {product.vendor.logo && <Image src={product.vendor.logo} alt={product.vendor.name} width={18} height={18} className="vendor-logo" />}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.vendor.name}</span>
                                </span>
                              )
                            ) : <span style={{ color: '#3a3a56' }}>—</span>}
                          </td>
                          <td><span className="price-tag">${product.price?.toLocaleString() ?? '—'}</span></td>
                          <td>
                            {product.url ? (
                              <a href={product.url} target="_blank" rel="noopener noreferrer" className="url-link">
                                Visit
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                              </a>
                            ) : <span style={{ color: '#3a3a56' }}>—</span>}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <button className="action-btn action-edit" onClick={() => handleEdit(product)}>Edit</button>
                              <button className="action-btn action-delete" onClick={() => setDeleteConfirmId(product.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid-view">
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                      <div className="skel" style={{ width: '100%', height: 130, borderRadius: 0 }} />
                      <div style={{ padding: '1rem' }}>
                        <div className="skel" style={{ width: '70%', marginBottom: 8 }} />
                        <div className="skel" style={{ width: '90%', height: 10 }} />
                      </div>
                    </div>
                  ))
                ) : paginated.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1/-1' }}>
                    <div className="empty-icon">📦</div>
                    <div style={{ fontSize: '1rem', fontWeight: 600, color: '#6b6b8a' }}>No products found</div>
                    <p>{hasActiveFilters ? 'Try clearing your filters' : 'Add your first product to get started'}</p>
                  </div>
                ) : (
                  paginated.map(product => (
                    <div key={product.id} className={`product-card ${selectedIds.has(product.id) ? 'selected' : ''}`}>
                      <div className="card-cb">
                        <input type="checkbox" className="cb" checked={selectedIds.has(product.id)} onChange={() => toggleSelect(product.id)} />
                      </div>
                      <div className="card-actions">
                        <button className="card-action-btn card-action-edit" onClick={() => handleEdit(product)} title="Edit">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="card-action-btn card-action-del" onClick={() => setDeleteConfirmId(product.id)} title="Delete">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                      {product.image ? (
                        <Image src={product.image} alt={product.name} width={300} height={160} className="card-img" style={{ display: 'block', width: '100%', height: 130, objectFit: 'cover' }} />
                      ) : (
                        <div className="card-img-placeholder">📦</div>
                      )}
                      <div className="card-body">
                        <div className="card-name">{product.name}</div>
                        <div className="card-desc">{product.description || <span style={{ color: '#3a3a56' }}>No description</span>}</div>
                      </div>
                      <div className="card-footer">
                        <span className="price-tag">${product.price?.toLocaleString() ?? '—'}</span>
                        {product.vendor && (
                          <span style={{ fontSize: '0.73rem', color: '#5a5a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100 }}>
                            {product.vendor.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pagination */}
            {!isLoading && filteredAndSorted.length > 0 && (
              <Pagination
                total={filteredAndSorted.length}
                page={page}
                pageSize={pageSize}
                onPage={setPage}
                onPageSize={setPageSize}
              />
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirmId !== null && (
        <div className="confirm-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="confirm-box" onClick={e => e.stopPropagation()}>
            <div className="confirm-title" style={{ color: '#e2e2ef' }}>Delete product?</div>
            <div className="confirm-sub">This action cannot be undone. The product will be permanently removed.</div>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirmId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className={`toast toast-${toast.type}`}>{toast.msg}</div>}

      {/* Product Form Modal */}
      <ProductFormModal
        open={modalOpen}
        setOpen={setModalOpen}
        fetchProducts={fetchProducts}
        editingProduct={editingProduct}
        vendors={vendors}
      />
    </>
  );
}