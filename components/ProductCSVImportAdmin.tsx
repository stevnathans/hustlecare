/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductCSVImportAdmin.tsx
'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import {
  VALID_LEAD_TIMES, VALID_DURATION_UNITS, VALID_WEIGHT_UNITS, VALID_RECEIPT_STATUSES,
  VALID_WARRANTY_TYPES, VALID_CONDITIONS, MAX_CSV_IMPORT_ROWS,
} from '@/lib/product-validation';
import { VendorTuple } from 'types/vendor';

type Requirement = { id: number; name: string; category: string; necessity: string };

// Row shape sent straight to /api/admin/products/import — field names match
// what mapProductCreateFields() in lib/product-validation.ts reads (note:
// "model", not "modelNumber" — that rename happens server-side).
type CSVProduct = {
  name: string;
  description?: string;
  price?: number;
  priceMin?: number;
  priceMax?: number;
  currency: string;
  image?: string;
  url?: string;
  sku?: string;
  stock?: number;

  condition: string;
  usedDurationValue?: number;
  usedDurationUnit?: string;
  hasReceipt?: string;

  brand?: string;
  model?: string;
  voltage?: string;
  wattage?: string;
  dimensions?: string;
  weight?: number;
  weightUnit?: string;

  warrantyType: string;
  warrantyDurationValue?: number;
  warrantyDurationUnit?: string;

  deliveryAvailable: boolean;
  pickupLocation?: string;
  leadTime: string;

  negotiable: boolean;

  validityValue?: number;
  validityUnit?: string;
  processingTimeMinDays?: number;
  processingTimeMaxDays?: number;
};

// Every CSV data line becomes exactly one of these — parsing never aborts
// the whole file on a single bad row. Keyed by a stable id (not array
// position) so removing a row doesn't reshuffle the others.
type RowResult =
  | { key: number; row: number; status: 'ok'; product: CSVProduct }
  | { key: number; row: number; status: 'error'; error: string };

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

function parseBool(raw: string, field: string): boolean {
  const v = raw.trim().toLowerCase();
  if (v === '') return false;
  if (['true', 'yes', '1'].includes(v)) return true;
  if (['false', 'no', '0'].includes(v)) return false;
  throw new Error(`Invalid ${field} "${raw}" — use true/false or yes/no`);
}

function parseOptionalNumber(raw: string, field: string, opts?: { min?: number }): number | undefined {
  const v = raw.trim();
  if (v === '') return undefined;
  const n = parseFloat(v.replace(/[$,]/g, ''));
  if (isNaN(n) || (opts?.min !== undefined && n < opts.min)) throw new Error(`Invalid ${field} "${raw}"`);
  return n;
}

function parseOptionalInt(raw: string, field: string, opts?: { min?: number }): number | undefined {
  const v = raw.trim();
  if (v === '') return undefined;
  const n = parseInt(v, 10);
  if (isNaN(n) || (opts?.min !== undefined && n < opts.min)) throw new Error(`Invalid ${field} "${raw}"`);
  return n;
}

/** Validates against the SAME allowed-value lists the server uses, so a row that
 *  passes here is guaranteed to pass lib/product-validation's validateProductEnums too. */
function parseEnum(raw: string, allowed: readonly string[], fallback: string, field: string): string {
  const v = raw.trim();
  if (v === '') return fallback;
  const match = allowed.find((a) => a.toLowerCase() === v.toLowerCase());
  if (!match) throw new Error(`Invalid ${field} "${raw}" — must be one of ${allowed.join(', ')}`);
  return match;
}

/** Parses one data line into a product. Throws a single Error with a plain-English
 *  message on the first problem found in THIS row — the caller catches it per-row
 *  so one bad row never blocks the rest of the file. */
function parseProductRow(headers: string[], line: string): CSVProduct {
  const values = parseCSVLine(line);
  const get = (key: string) => values[headers.indexOf(key)]?.trim() ?? '';

  const name = get('name');
  if (!name) throw new Error('Missing name');

  const condition = parseEnum(get('condition'), VALID_CONDITIONS, 'NEW', 'condition');
  const warrantyType = parseEnum(get('warrantytype'), VALID_WARRANTY_TYPES, 'NONE', 'warrantytype');
  const weightRaw = get('weight');

  return {
    name,
    description: get('description') || undefined,

    price: parseOptionalNumber(get('price'), 'price', { min: 0 }),
    priceMin: parseOptionalNumber(get('pricemin'), 'pricemin', { min: 0 }),
    priceMax: parseOptionalNumber(get('pricemax'), 'pricemax', { min: 0 }),
    currency: get('currency') || 'KES',

    image: get('image') || undefined,
    url: get('url') || undefined,
    sku: get('sku') || undefined,
    stock: parseOptionalInt(get('stock'), 'stock', { min: 0 }),

    condition,
    usedDurationValue: condition === 'USED' ? parseOptionalNumber(get('usedduration'), 'usedduration', { min: 0 }) : undefined,
    usedDurationUnit: condition === 'USED' ? parseEnum(get('useddurationunit'), VALID_DURATION_UNITS, 'months', 'useddurationunit') : undefined,
    hasReceipt: condition === 'USED' ? (parseEnum(get('hasreceipt'), [...VALID_RECEIPT_STATUSES, ''], '', 'hasreceipt') || undefined) : undefined,

    brand: get('brand') || undefined,
    model: get('model') || undefined,
    voltage: get('voltage') || undefined,
    wattage: get('wattage') || undefined,
    dimensions: get('dimensions') || undefined,
    weight: parseOptionalNumber(weightRaw, 'weight', { min: 0 }),
    weightUnit: weightRaw.trim() !== '' ? parseEnum(get('weightunit'), VALID_WEIGHT_UNITS, 'kg', 'weightunit') : undefined,

    warrantyType,
    warrantyDurationValue: warrantyType !== 'NONE' ? parseOptionalNumber(get('warrantyduration'), 'warrantyduration', { min: 0 }) : undefined,
    warrantyDurationUnit: warrantyType !== 'NONE' ? parseEnum(get('warrantydurationunit'), VALID_DURATION_UNITS, 'months', 'warrantydurationunit') : undefined,

    deliveryAvailable: parseBool(get('deliveryavailable'), 'deliveryavailable'),
    pickupLocation: get('pickuplocation') || undefined,
    leadTime: parseEnum(get('leadtime'), VALID_LEAD_TIMES, 'IN_STOCK', 'leadtime'),

    negotiable: parseBool(get('negotiable'), 'negotiable'),

    validityValue: parseOptionalNumber(get('validityvalue'), 'validityvalue', { min: 0 }),
    validityUnit: get('validityvalue').trim() !== '' ? parseEnum(get('validityunit'), VALID_DURATION_UNITS, 'years', 'validityunit') : undefined,
    processingTimeMinDays: parseOptionalInt(get('processingtimemindays'), 'processingtimemindays', { min: 0 }),
    processingTimeMaxDays: parseOptionalInt(get('processingtimemaxdays'), 'processingtimemaxdays', { min: 0 }),
  };
}

/** Parses the whole file. Only throws for file-level problems (no header row,
 *  missing "name" column entirely, too many rows) — anything wrong with an
 *  individual row is captured as a per-row error instead of aborting. */
function parseProductCSV(text: string): RowResult[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));
  if (!headers.includes('name')) throw new Error('Missing required column: name');

  const dataLines = lines.slice(1);
  if (dataLines.length > MAX_CSV_IMPORT_ROWS) {
    throw new Error(`CSV has ${dataLines.length} rows — limit is ${MAX_CSV_IMPORT_ROWS} per import.`);
  }

  return dataLines.map((line, i) => {
    const row = i + 2;
    try {
      const product = parseProductRow(headers, line);
      return { key: i, row, status: 'ok', product } as const;
    } catch (err) {
      return { key: i, row, status: 'error', error: err instanceof Error ? err.message : 'Failed to parse row' } as const;
    }
  });
}

const TEMPLATE_HEADERS = [
  'name', 'description', 'price', 'pricemin', 'pricemax', 'currency', 'image', 'url', 'sku', 'stock',
  'condition', 'usedduration', 'useddurationunit', 'hasreceipt',
  'brand', 'model', 'voltage', 'wattage', 'dimensions', 'weight', 'weightunit',
  'warrantytype', 'warrantyduration', 'warrantydurationunit',
  'deliveryavailable', 'pickuplocation', 'leadtime', 'negotiable',
  'validityvalue', 'validityunit', 'processingtimemindays', 'processingtimemaxdays',
];

// ─── Searchable dropdown — button reveals a panel with a search box, then the
//     filtered list underneath. Same interaction pattern as the Vendor picker
//     in components/shared/ProductForm.tsx, reused here for both Vendor and
//     Requirement so a long list doesn't mean scrolling a native <select>. ───

type DropdownOption = { id: string; label: string; sublabel?: string };

function SearchableDropdown({
  label, required, value, onChange, options, placeholder, loading,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (id: string) => void;
  options: DropdownOption[];
  placeholder: string;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) { setOpen(false); setSearch(''); }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find((o) => o.id === value);
  const q = search.trim().toLowerCase();
  const filtered = q === '' ? options : options.filter(
    (o) => o.label.toLowerCase().includes(q) || o.sublabel?.toLowerCase().includes(q)
  );

  return (
    <div ref={wrapRef} className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
      <label className="form-label">{label} {required && <span className="form-required">*</span>}</label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="form-input"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', cursor: 'pointer', backgroundColor: '#1e1e2f', color: '#e2e2ef', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : (loading ? 'Loading…' : placeholder)}
        </span>
        <span style={{ color: '#6b6b8a', fontSize: '0.65rem', flexShrink: 0, marginLeft: '0.5rem' }}>▼</span>
      </button>

      {open && (
        <div
          className="absolute z-50 w-full mt-1 border rounded-lg shadow-xl"
          style={{ position: 'absolute', zIndex: 50, width: '100%', marginTop: '0.3rem', backgroundColor: '#1e1e2f', borderColor: 'rgba(255,255,255,0.15)' }}
        >
          <div className="p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                <Search size={12} />
              </span>
              <input
                autoFocus
                type="text"
                placeholder="Type to search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded border outline-none focus:border-emerald-500"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#e2e2ef', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); setSearch(''); }}
              className="w-full px-3 py-2 text-left text-xs rounded hover:bg-emerald-500 hover:text-white transition-colors text-gray-400"
            >
              Clear selection
            </button>

            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-500 italic">No matches</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onChange(o.id); setOpen(false); setSearch(''); }}
                  className="w-full px-3 py-2 text-left text-xs rounded transition-colors"
                  style={{ backgroundColor: value === o.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', color: '#e2e2ef' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = value === o.id ? 'rgba(16, 185, 129, 0.15)' : 'transparent'; }}
                >
                  {o.label}
                  {o.sublabel && <span style={{ color: '#6b6b8a' }}> ({o.sublabel})</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type Props = {
  onImportComplete: () => void;
  vendors: VendorTuple[];
};

export default function ProductCSVImportAdmin({ onImportComplete, vendors }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<RowResult[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(false);
  const [vendorId, setVendorId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [assignLater, setAssignLater] = useState(false);
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const [submitRowErrors, setSubmitRowErrors] = useState<{ row: number; error: string }[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const fetchRequirements = useCallback(async () => {
    setRequirementsLoading(true);
    try {
      const res = await fetch('/api/requirements');
      if (res.ok) setRequirements(await res.json());
    } finally {
      setRequirementsLoading(false);
    }
  }, []);

  const openModal = () => {
    setRows([]); setFileError(null); setSubmitErrors([]); setSubmitRowErrors([]);
    setVendorId(''); setTemplateId(''); setAssignLater(false); setPublishImmediately(false);
    if (fileRef.current) fileRef.current.value = '';
    fetchRequirements();
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setRows([]); setFileError(null); setSubmitErrors([]); setSubmitRowErrors([]); };

  const vendorOptions: DropdownOption[] = useMemo(() => vendors.map(([id, name]) => ({ id, label: name })), [vendors]);
  const requirementOptions: DropdownOption[] = useMemo(
    () => requirements.map((r) => ({ id: String(r.id), label: r.name, sublabel: r.category })),
    [requirements]
  );

  const selectedRequirement = requirements.find((r) => r.id.toString() === templateId);
  const isLegalBatch = selectedRequirement?.category === 'Legal';

  const okRows = useMemo(() => rows.filter((r): r is Extract<RowResult, { status: 'ok' }> => r.status === 'ok'), [rows]);
  const errorRows = useMemo(() => rows.filter((r): r is Extract<RowResult, { status: 'error' }> => r.status === 'error'), [rows]);

  // Non-blocking heads-up for accidentally duplicated rows (easy mistake when
  // compiling a batch of links via an AI extraction pass) — doesn't stop
  // import, just flags it in the preview.
  const duplicateNameKeys = useMemo(() => {
    const counts = new Map<string, number>();
    okRows.forEach((r) => {
      const k = r.product.name.trim().toLowerCase();
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    const dupeKeys = new Set<number>();
    okRows.forEach((r) => {
      if ((counts.get(r.product.name.trim().toLowerCase()) || 0) > 1) dupeKeys.add(r.key);
    });
    return dupeKeys;
  }, [okRows]);

  const downloadTemplate = () => {
    const minimalRow = ['Wireless Keyboard', 'Compact mechanical keyboard', '4500', '', '', 'KES', 'https://example.com/kb.jpg', 'https://example.com/product', '', ''];
    const fullRow = [
      'Industrial Generator', 'Diesel-powered backup generator', '', '250000', '320000', 'KES',
      'https://example.com/gen.jpg', 'https://example.com/product', 'GEN-450', '5',
      'USED', '8', 'months', 'YES',
      'CumminsPower', 'CP-450X', '415V', '450kW', '180 x 90 x 150 cm', '620', 'kg',
      'MANUFACTURER', '12', 'months',
      'true', 'Industrial Area, Nairobi', '1_WEEK', 'true',
      '', '', '', '',
    ];
    const pad = (row: string[]) => TEMPLATE_HEADERS.map((_, i) => row[i] ?? '');
    const rowsCsv = [TEMPLATE_HEADERS.join(','), pad(minimalRow).join(','), pad(fullRow).join(',')].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([rowsCsv], { type: 'text/csv' }));
    a.download = 'products-template.csv';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setFileError(null); setSubmitErrors([]); setSubmitRowErrors([]);
        const parsed = parseProductCSV(ev.target?.result as string);
        setRows(parsed);
        const ok = parsed.filter((r) => r.status === 'ok').length;
        const bad = parsed.length - ok;
        showToast(bad > 0 ? `${ok} rows ready, ${bad} need attention` : `${ok} products ready`, bad > 0 ? 'error' : 'success');
      } catch (err) {
        setFileError(err instanceof Error ? err.message : 'Failed to parse CSV');
        setRows([]);
      }
    };
    reader.readAsText(file);
  };

  const removeRow = (key: number) => setRows((r) => r.filter((row) => row.key !== key));
  const removeAllErrorRows = () => setRows((r) => r.filter((row) => row.status !== 'error'));

  const canSubmit = okRows.length > 0 && errorRows.length === 0 && !!vendorId && (assignLater || !!templateId);

  const handleImport = async () => {
    if (!canSubmit) return;
    setLoading(true); setSubmitErrors([]); setSubmitRowErrors([]);
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: Number(vendorId),
          templateId: assignLater ? null : Number(templateId),
          publishImmediately,
          products: okRows.map((r) => r.product),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.rowErrors) setSubmitRowErrors(data.rowErrors);
        else setSubmitErrors([data.error || 'Import failed.']);
        return;
      }
      showToast(`${data.imported} products imported${publishImmediately ? ' and published' : ' — pending review'}`);
      onImportComplete();
      closeModal();
    } catch {
      setSubmitErrors(['Import failed. Please try again.']);
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

  const formatPrice = (p: CSVProduct) => {
    if (p.priceMin != null && p.priceMax != null) return `${p.priceMin.toLocaleString()}–${p.priceMax.toLocaleString()}`;
    if (p.price != null) return p.price.toLocaleString();
    return '—';
  };

  return (
    <>
      <button className="btn btn-ghost" onClick={openModal}>Import CSV</button>

      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Import Products from CSV</div>
                <div className="modal-subtitle">Admin bulk import — every product in the batch shares one vendor.</div>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">

              {/* Vendor — required, applies to the whole batch. Searchable: typing filters the list. */}
              <div style={{ marginBottom: '1rem' }}>
                <SearchableDropdown
                  label="Vendor"
                  required
                  value={vendorId}
                  onChange={setVendorId}
                  options={vendorOptions}
                  placeholder="Select vendor for this batch…"
                />
              </div>

              {/* Requirement assignment — applies to the whole batch. Searchable, same reason: can be a long list. */}
              <div style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
                <label className="flex items-center gap-2 text-sm mb-2">
                  <input type="checkbox" checked={assignLater} onChange={(e) => setAssignLater(e.target.checked)} />
                  Skip requirement assignment — I&apos;ll assign these products individually later
                </label>
                {!assignLater && (
                  <SearchableDropdown
                    label="Requirement"
                    value={templateId}
                    onChange={setTemplateId}
                    options={requirementOptions}
                    placeholder="Select requirement for all products in this batch…"
                    loading={requirementsLoading}
                  />
                )}
                <p style={{ fontSize: '0.72rem', color: '#6b6b8a', marginTop: '0.5rem' }}>
                  All products in one CSV must belong to the same requirement. Import separately for different requirements.
                  {isLegalBatch && ' This is a Legal requirement — fill in validityvalue/validityunit and processingtimemindays/processingtimemaxdays columns if applicable.'}
                </p>
              </div>

              <label className="flex items-center gap-2 text-sm mb-4" style={{ cursor: 'pointer' }}>
                <input type="checkbox" checked={publishImmediately} onChange={(e) => setPublishImmediately(e.target.checked)} />
                Publish immediately (skip review — admin-authored content)
              </label>

              <button onClick={downloadTemplate} style={{ background: 'none', border: 'none', color: '#7c6af7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: '0.5rem' }}>
                Download template CSV
              </button>
              <p style={{ fontSize: '0.72rem', color: '#6b6b8a', marginBottom: '1rem' }}>
                Only <strong>name</strong> is required. Every other column — including price — is optional and can be left blank
                if you plan to fill it in manually afterwards. The template includes one minimal example row and one fully filled-in example row.
                Bulk pricing tiers aren&apos;t supported via CSV yet — add those individually after import if needed.
              </p>

              <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange}
                style={{ width: '100%', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 10, padding: '0.65rem 1rem', marginBottom: '1rem' }} />

              {fileError && (
                <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{fileError}</div>
              )}
              {submitErrors.length > 0 && submitErrors.map((e, i) => (
                <div key={i} style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{e}</div>
              ))}
              {submitRowErrors.length > 0 && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '0.75rem', marginBottom: '1rem', maxHeight: 150, overflowY: 'auto' }}>
                  {submitRowErrors.map((re, i) => (
                    <div key={i} style={{ fontSize: '0.78rem', color: '#f87171' }}>Row {re.row}: {re.error}</div>
                  ))}
                </div>
              )}

              {rows.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, margin: 0 }}>
                      {okRows.length} ready
                      {errorRows.length > 0 && <span style={{ color: '#f87171' }}> · {errorRows.length} need attention</span>}
                      {duplicateNameKeys.size > 0 && <span style={{ color: '#fbbf24' }}> · {duplicateNameKeys.size} possible duplicate name{duplicateNameKeys.size !== 1 ? 's' : ''}</span>}
                    </p>
                    {errorRows.length > 0 && (
                      <button
                        onClick={removeAllErrorRows}
                        style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '0.74rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Remove all error rows
                      </button>
                    )}
                  </div>
                  {okRows.some((r) => r.product.price == null && r.product.priceMin == null) && (
                    <p style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: 0, marginBottom: '0.6rem' }}>
                      Some rows have no price set — that&apos;s fine to fill in later, just flagging so it&apos;s not accidental.
                    </p>
                  )}

                  <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.5rem', width: 46 }}>Row</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Price</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Condition</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Stock</th>
                          <th style={{ textAlign: 'right', padding: '0.5rem', width: 40 }}>Remove</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          if (r.status === 'error') {
                            return (
                              <tr key={r.key} style={{ background: 'rgba(239,68,68,0.06)' }}>
                                <td style={{ padding: '0.5rem', color: '#6b6b8a', fontSize: '0.75rem' }}>{r.row}</td>
                                <td colSpan={4} style={{ padding: '0.5rem', color: '#f87171', fontSize: '0.8rem' }}>{r.error}</td>
                                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                  <button onClick={() => removeRow(r.key)} title="Remove row" style={{ background: 'none', border: 'none', color: '#6b6b8a', cursor: 'pointer', display: 'inline-flex' }}>
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          }
                          const p = r.product;
                          const isDupe = duplicateNameKeys.has(r.key);
                          return (
                            <tr key={r.key}>
                              <td style={{ padding: '0.5rem', color: '#6b6b8a', fontSize: '0.75rem' }}>{r.row}</td>
                              <td style={{ padding: '0.5rem' }}>
                                {p.name}
                                {isDupe && <span style={{ marginLeft: '0.4rem', fontSize: '0.68rem', color: '#fbbf24' }}>⚠ duplicate name</span>}
                              </td>
                              <td style={{ padding: '0.5rem' }}>{formatPrice(p)} {p.currency}</td>
                              <td style={{ padding: '0.5rem' }}>{p.condition === 'USED' ? 'Used' : 'Brand New'}</td>
                              <td style={{ padding: '0.5rem' }}>{p.stock ?? 'Unlimited'}</td>
                              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                                <button onClick={() => removeRow(r.key)} title="Remove row" style={{ background: 'none', border: 'none', color: '#6b6b8a', cursor: 'pointer', display: 'inline-flex' }}>
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={closeModal} disabled={loading}>Cancel</button>
              <button className="btn btn-primary" onClick={handleImport} disabled={loading || !canSubmit} title={errorRows.length > 0 ? 'Remove or fix all error rows first' : undefined}>
                {loading ? 'Importing…' : `Import ${okRows.length || ''} Product${okRows.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`} style={{ bottom: '5rem' }}>{toast.msg}</div>}
    </>
  );
}