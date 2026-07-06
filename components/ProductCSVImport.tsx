// components/ProductCSVImport.tsx (vendor) — full rewrite
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type CSVProduct = { name: string; description?: string; price: number; image?: string; url?: string };
type Requirement = { id: number; name: string; category: string; necessity: string };

function parseCSVLine(line: string): string[] {
  const result: string[] = []; let current = ''; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else current += ch;
  }
  result.push(current);
  return result;
}

function parseProductCSV(text: string): CSVProduct[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));
  if (!headers.includes('name')) throw new Error('Missing required column: name');
  if (!headers.includes('price')) throw new Error('Missing required column: price');

  return lines.slice(1).map((line, i) => {
    const values = parseCSVLine(line);
    const get = (key: string) => values[headers.indexOf(key)]?.trim() ?? '';
    const name = get('name');
    if (!name) throw new Error(`Row ${i + 2}: Missing name`);
    const price = parseFloat(get('price').replace(/[$,]/g, ''));
    if (isNaN(price) || price < 0) throw new Error(`Row ${i + 2}: Invalid price`);
    return { name, price, description: get('description') || undefined, image: get('image') || undefined, url: get('url') || undefined };
  });
}

const MAX_ROWS = 100;

export default function ProductCSVImport({ onImportComplete }: { onImportComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CSVProduct[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [assignLater, setAssignLater] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [rowErrors, setRowErrors] = useState<{ row: number; error: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchRequirements = useCallback(async () => {
    const res = await fetch('/api/requirements');
    if (res.ok) setRequirements(await res.json());
  }, []);

  const openModal = () => {
    setProducts([]); setErrors([]); setRowErrors([]); setTemplateId(''); setAssignLater(false);
    if (fileRef.current) fileRef.current.value = '';
    fetchRequirements();
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setProducts([]); setErrors([]); setRowErrors([]); };

  const downloadTemplate = () => {
    const rows = ['name,description,price,image,url', 'Wireless Keyboard,Compact mechanical keyboard,89.99,https://example.com/kb.jpg,https://example.com/product'].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }));
    a.download = 'products-template.csv';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setErrors([]); setRowErrors([]);
        const parsed = parseProductCSV(ev.target?.result as string);
        if (parsed.length > MAX_ROWS) throw new Error(`CSV has ${parsed.length} rows — limit is ${MAX_ROWS} per import.`);
        setProducts(parsed);
        showToast(`${parsed.length} products ready`);
      } catch (err) {
        setErrors([err instanceof Error ? err.message : 'Failed to parse CSV']);
        setProducts([]);
      }
    };
    reader.readAsText(file);
  };

  const canSubmit = products.length > 0 && (assignLater || !!templateId);

  const handleImport = async () => {
    if (!canSubmit) return;
    setLoading(true); setErrors([]); setRowErrors([]);
    try {
      const res = await fetch('/api/vendors/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: assignLater ? null : Number(templateId), products }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.rowErrors) setRowErrors(data.rowErrors);
        else setErrors([data.error || 'Import failed.']);
        return;
      }
      showToast(`${data.imported} products submitted for review`);
      onImportComplete();
      closeModal();
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
      <button className="btn btn-ghost" onClick={openModal}>Import CSV</button>

      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 740 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Import Products from CSV</div>
                <div className="modal-subtitle">All imported products are submitted for review — none go live automatically.</div>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">

              {/* Requirement assignment — applies to the whole batch */}
              <div style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" checked={assignLater} onChange={(e) => setAssignLater(e.target.checked)} />
                  Skip requirement assignment — I&apos;ll assign these products individually later
                </label>
                {!assignLater && (
                  <select className="form-input form-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
                    <option value="">Select requirement for all products in this batch…</option>
                    {requirements.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
                  </select>
                )}
                <p style={{ fontSize: '0.72rem', color: '#6b6b8a', marginTop: '0.5rem' }}>
                  All products in one CSV must belong to the same requirement. Import separately for different requirements.
                </p>
              </div>

              <button onClick={downloadTemplate} style={{ background: 'none', border: 'none', color: '#7c6af7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: '1rem' }}>
                Download template CSV
              </button>

              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange}
                style={{ width: '100%', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem' }} />

              {errors.length > 0 && errors.map((e, i) => (
                <div key={i} style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{e}</div>
              ))}
              {rowErrors.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', maxHeight: 150, overflowY: 'auto' }}>
                  {rowErrors.map((re, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: '#f87171' }}>Row {re.row}: {re.error}</div>
                  ))}
                </div>
              )}

              {products.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '0.5rem' }}>{products.length} product{products.length !== 1 ? 's' : ''} ready</p>
                  <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr><th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th><th style={{ textAlign: 'left', padding: '0.5rem' }}>Price</th></tr></thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={i}><td style={{ padding: '0.5rem' }}>{p.name}</td><td style={{ padding: '0.5rem' }}>${p.price.toLocaleString()}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={loading || !canSubmit}>
                {loading ? 'Submitting…' : `Submit ${products.length || ''} Product${products.length !== 1 ? 's' : ''} for Review`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`} style={{ bottom: '5rem' }}>{toast.msg}</div>}
    </>
  );
}