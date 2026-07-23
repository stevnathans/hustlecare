/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductCSVImport.tsx (admin)
//
// Admin-only bulk product upload. Vendors don't have CSV import — keeping
// bulk creation admin-gated avoids spammy/duplicate/miscategorized listings
// landing on the marketplace without a human in the loop, same reasoning as
// the existing "products go to PENDING_REVIEW unless publishImmediately" gate.
//
// Vendor + Requirement are picked once for the whole batch (same pattern as
// the previous version) since in practice one CSV = one vendor's product
// links. Legal-only fields (validity/processing time) only apply, and are
// only shown/parsed, when the selected Requirement's category is "Legal" —
// mirrors ProductForm.tsx's isLegalRequirement gating.

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { VendorTuple } from 'types/vendor';

type Condition = 'NEW' | 'USED';
type HasReceipt = '' | 'YES' | 'NO' | 'UNKNOWN';
type DurationUnit = 'days' | 'months' | 'years';
type WeightUnit = 'kg' | 'g' | 'lb';
type WarrantyType = 'NONE' | 'MANUFACTURER' | 'VENDOR';
type LeadTime = 'IN_STOCK' | '1_3_DAYS' | '1_WEEK' | '2_WEEKS_PLUS';

type BulkTier = { minQty: number; price: number };

type CSVProduct = {
  name: string;
  description?: string;

  price?: number;
  priceMin?: number;
  priceMax?: number;
  usePriceRange: boolean;
  currency: string;

  image?: string;
  url?: string;
  sku?: string;
  stock?: number;

  condition: Condition;
  usedDurationValue?: number;
  usedDurationUnit: DurationUnit;
  hasReceipt: HasReceipt;

  brand?: string;
  model?: string;
  voltage?: string;
  wattage?: string;
  dimensions?: string;
  weight?: number;
  weightUnit: WeightUnit;

  warrantyType: WarrantyType;
  warrantyDurationValue?: number;
  warrantyDurationUnit: DurationUnit;

  deliveryAvailable: boolean;
  pickupLocation?: string;
  leadTime: LeadTime;

  negotiable: boolean;
  bulkPricing: BulkTier[];

  publishImmediately: boolean;

  // Legal — only populated/sent when the batch requirement is category "Legal"
  validityValue?: number;
  validityUnit?: DurationUnit;
  processingTimeMinDays?: number;
  processingTimeMaxDays?: number;
};

type Requirement = { id: number; name: string; category: string; necessity: string };

const CONDITION_VALUES: Condition[] = ['NEW', 'USED'];
const HAS_RECEIPT_VALUES: HasReceipt[] = ['', 'YES', 'NO', 'UNKNOWN'];
const DURATION_UNIT_VALUES: DurationUnit[] = ['days', 'months', 'years'];
const WEIGHT_UNIT_VALUES: WeightUnit[] = ['kg', 'g', 'lb'];
const WARRANTY_TYPE_VALUES: WarrantyType[] = ['NONE', 'MANUFACTURER', 'VENDOR'];
const LEAD_TIME_VALUES: LeadTime[] = ['IN_STOCK', '1_3_DAYS', '1_WEEK', '2_WEEKS_PLUS'];

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

function parseBool(raw: string, field: string, row: number, fallback = false): boolean {
  const v = raw.trim().toLowerCase();
  if (v === '') return fallback;
  if (['true', 'yes', '1'].includes(v)) return true;
  if (['false', 'no', '0'].includes(v)) return false;
  throw new Error(`Row ${row}: Invalid ${field} "${raw}" — use true/false or yes/no`);
}

function parseOptionalNumber(raw: string, field: string, row: number, opts?: { min?: number }): number | undefined {
  const v = raw.trim();
  if (v === '') return undefined;
  const n = parseFloat(v.replace(/[$,]/g, ''));
  if (isNaN(n) || (opts?.min !== undefined && n < opts.min)) throw new Error(`Row ${row}: Invalid ${field} "${raw}"`);
  return n;
}

function parseOptionalInt(raw: string, field: string, row: number, opts?: { min?: number }): number | undefined {
  const v = raw.trim();
  if (v === '') return undefined;
  const n = parseInt(v, 10);
  if (isNaN(n) || (opts?.min !== undefined && n < opts.min)) throw new Error(`Row ${row}: Invalid ${field} "${raw}"`);
  return n;
}

function parseEnum<T extends string>(raw: string, allowed: readonly T[], fallback: T, field: string, row: number): T {
  const v = raw.trim();
  if (v === '') return fallback;
  const match = allowed.find((a) => a.toLowerCase() === v.toLowerCase());
  if (!match) throw new Error(`Row ${row}: Invalid ${field} "${raw}" — must be one of ${allowed.filter(Boolean).join(', ')}`);
  return match;
}

/** "10:4500|25:4200|50:3900" -> [{minQty:10,price:4500}, ...] */
function parseBulkPricing(raw: string, row: number): BulkTier[] {
  const v = raw.trim();
  if (v === '') return [];
  return v.split('|').map((chunk) => {
    const [qtyRaw, priceRaw] = chunk.split(':').map((s) => s.trim());
    const minQty = parseInt(qtyRaw, 10);
    const price = parseFloat((priceRaw || '').replace(/[$,]/g, ''));
    if (!qtyRaw || !priceRaw || isNaN(minQty) || isNaN(price) || minQty < 1 || price < 0) {
      throw new Error(`Row ${row}: Invalid bulkpricing entry "${chunk}" — use minQty:price, e.g. 10:4500`);
    }
    return { minQty, price };
  });
}

function parseProductCSV(text: string, isLegalCategory: boolean, publishDefault: boolean): CSVProduct[] {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row');
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s+/g, ''));
  if (!headers.includes('name')) throw new Error('Missing required column: name');

  return lines.slice(1).map((line, i) => {
    const row = i + 2;
    const values = parseCSVLine(line);
    const get = (key: string) => values[headers.indexOf(key)]?.trim() ?? '';

    const name = get('name');
    if (!name) throw new Error(`Row ${row}: Missing name`);

    // Price: either a flat price, or a min/max range. At least one form is required.
    const priceRaw = get('price');
    const priceMin = parseOptionalNumber(get('pricemin'), 'pricemin', row, { min: 0 });
    const priceMax = parseOptionalNumber(get('pricemax'), 'pricemax', row, { min: 0 });
    let price: number | undefined;
    let usePriceRange = false;
    if (priceRaw.trim() !== '') {
      price = parseOptionalNumber(priceRaw, 'price', row, { min: 0 });
    } else if (priceMin !== undefined && priceMax !== undefined) {
      usePriceRange = true;
    } else {
      throw new Error(`Row ${row}: Provide either price, or both pricemin and pricemax`);
    }

    const condition = parseEnum(get('condition'), CONDITION_VALUES, 'NEW', 'condition', row);

    return {
      name,
      description: get('description') || undefined,

      price,
      priceMin: usePriceRange ? priceMin : undefined,
      priceMax: usePriceRange ? priceMax : undefined,
      usePriceRange,
      currency: get('currency') || 'KES',

      image: get('image') || undefined,
      url: get('url') || undefined,
      sku: get('sku') || undefined,
      stock: parseOptionalInt(get('stock'), 'stock', row, { min: 0 }),

      condition,
      usedDurationValue: condition === 'USED' ? parseOptionalNumber(get('usedduration'), 'usedduration', row, { min: 0 }) : undefined,
      usedDurationUnit: parseEnum(get('useddurationunit'), DURATION_UNIT_VALUES, 'months', 'useddurationunit', row),
      hasReceipt: parseEnum(get('hasreceipt'), HAS_RECEIPT_VALUES, '', 'hasreceipt', row),

      brand: get('brand') || undefined,
      model: get('model') || undefined,
      voltage: get('voltage') || undefined,
      wattage: get('wattage') || undefined,
      dimensions: get('dimensions') || undefined,
      weight: parseOptionalNumber(get('weight'), 'weight', row, { min: 0 }),
      weightUnit: parseEnum(get('weightunit'), WEIGHT_UNIT_VALUES, 'kg', 'weightunit', row),

      warrantyType: parseEnum(get('warrantytype'), WARRANTY_TYPE_VALUES, 'NONE', 'warrantytype', row),
      warrantyDurationValue: parseOptionalNumber(get('warrantyduration'), 'warrantyduration', row, { min: 0 }),
      warrantyDurationUnit: parseEnum(get('warrantydurationunit'), DURATION_UNIT_VALUES, 'months', 'warrantydurationunit', row),

      deliveryAvailable: parseBool(get('deliveryavailable'), 'deliveryavailable', row),
      pickupLocation: get('pickuplocation') || undefined,
      leadTime: parseEnum(get('leadtime'), LEAD_TIME_VALUES, 'IN_STOCK', 'leadtime', row),

      negotiable: parseBool(get('negotiable'), 'negotiable', row),
      bulkPricing: parseBulkPricing(get('bulkpricing'), row),

      publishImmediately: parseBool(get('publish'), 'publish', row, publishDefault),

      validityValue: isLegalCategory ? parseOptionalNumber(get('validityvalue'), 'validityvalue', row, { min: 0 }) : undefined,
      validityUnit: isLegalCategory ? parseEnum(get('validityunit'), DURATION_UNIT_VALUES, 'years', 'validityunit', row) : undefined,
      processingTimeMinDays: isLegalCategory ? parseOptionalInt(get('processingtimemin'), 'processingtimemin', row, { min: 0 }) : undefined,
      processingTimeMaxDays: isLegalCategory ? parseOptionalInt(get('processingtimemax'), 'processingtimemax', row, { min: 0 }) : undefined,
    };
  });
}

const MAX_ROWS = 100;

const BASE_HEADERS = [
  'name', 'description', 'price', 'pricemin', 'pricemax', 'currency', 'image', 'url', 'sku', 'stock',
  'condition', 'usedduration', 'useddurationunit', 'hasreceipt',
  'brand', 'model', 'voltage', 'wattage', 'dimensions', 'weight', 'weightunit',
  'warrantytype', 'warrantyduration', 'warrantydurationunit',
  'deliveryavailable', 'pickuplocation', 'leadtime',
  'negotiable', 'bulkpricing', 'publish',
];
const LEGAL_HEADERS = ['validityvalue', 'validityunit', 'processingtimemin', 'processingtimemax'];

type Props = {
  onImportComplete: () => void;
  vendors: VendorTuple[];
};

export default function ProductCSVImport({ onImportComplete, vendors }: Props) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<CSVProduct[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [vendorId, setVendorId] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('');
  const [assignLater, setAssignLater] = useState(false);
  const [publishDefault, setPublishDefault] = useState(false);
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
    setProducts([]); setErrors([]); setRowErrors([]); setVendorId(''); setTemplateId(''); setAssignLater(false); setPublishDefault(false);
    if (fileRef.current) fileRef.current.value = '';
    fetchRequirements();
    setOpen(true);
  };
  const closeModal = () => { setOpen(false); setProducts([]); setErrors([]); setRowErrors([]); };

  const selectedRequirement = requirements.find((r) => r.id.toString() === templateId);
  const isLegalCategory = selectedRequirement?.category === 'Legal';

  const downloadTemplate = () => {
    const headers = isLegalCategory ? [...BASE_HEADERS, ...LEGAL_HEADERS] : BASE_HEADERS;
    const minimalRow: Record<string, string> = {
      name: 'Wireless Keyboard', description: 'Compact mechanical keyboard', price: '4500',
      currency: 'KES', image: 'https://example.com/kb.jpg', url: 'https://example.com/product', condition: 'NEW',
    };
    const fullRow: Record<string, string> = {
      name: 'Industrial Generator', description: 'Diesel-powered backup generator',
      pricemin: '250000', pricemax: '320000', currency: 'KES',
      image: 'https://example.com/gen.jpg', url: 'https://example.com/product', sku: 'GEN-450', stock: '5',
      condition: 'USED', usedduration: '8', useddurationunit: 'months', hasreceipt: 'YES',
      brand: 'CumminsPower', model: 'CP-450X', voltage: '415V', wattage: '450kW', dimensions: '180 x 90 x 150 cm',
      weight: '620', weightunit: 'kg',
      warrantytype: 'MANUFACTURER', warrantyduration: '12', warrantydurationunit: 'months',
      deliveryavailable: 'true', pickuplocation: 'Industrial Area, Nairobi', leadtime: '1_WEEK',
      negotiable: 'true', bulkpricing: '5:315000|10:305000', publish: 'false',
      ...(isLegalCategory ? { validityvalue: '1', validityunit: 'years', processingtimemin: '3', processingtimemax: '5' } : {}),
    };
    const toRow = (obj: Record<string, string>) => headers.map((h) => obj[h] ?? '').join(',');
    const rows = [headers.join(','), toRow(minimalRow), toRow(fullRow)].join('\n');
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
        const parsed = parseProductCSV(ev.target?.result as string, isLegalCategory, publishDefault);
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

  const canSubmit = products.length > 0 && !!vendorId && (assignLater || !!templateId);

  const handleImport = async () => {
    if (!canSubmit) return;
    setLoading(true); setErrors([]); setRowErrors([]);
    try {
      const res = await fetch('/api/admin/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: Number(vendorId),
          templateId: assignLater ? null : Number(templateId),
          products,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.rowErrors) setRowErrors(data.rowErrors);
        else setErrors([data.error || 'Import failed.']);
        return;
      }
      showToast(`${data.imported} products created`);
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

  const formatPrice = (p: CSVProduct) =>
    p.usePriceRange ? `${p.priceMin?.toLocaleString()}–${p.priceMax?.toLocaleString()}` : p.price?.toLocaleString() ?? '—';

  return (
    <>
      <button className="btn btn-ghost" onClick={openModal}>Import CSV</button>

      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 780 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <div className="modal-title">Bulk Import Products</div>
                <div className="modal-subtitle">Admin-only. All products in a batch share one vendor and one requirement.</div>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <div className="modal-divider" />
            <div className="modal-body">

              <div style={{ background: 'rgba(124,106,247,0.06)', border: '1px solid rgba(124,106,247,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem' }}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Vendor <span style={{ color: '#f87171' }}>*</span></label>
                    <select className="form-input form-select" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                      <option value="">Select vendor…</option>
                      {vendors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">Requirement</label>
                    <select className="form-input form-select" value={templateId} onChange={(e) => setTemplateId(e.target.value)} disabled={assignLater}>
                      <option value="">Select requirement…</option>
                      {requirements.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
                    </select>
                  </div>
                </div>

                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={assignLater} onChange={(e) => setAssignLater(e.target.checked)} />
                  Skip requirement assignment — I&apos;ll assign these products individually later
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={publishDefault} onChange={(e) => setPublishDefault(e.target.checked)} />
                  Publish immediately by default (skip review — can be overridden per row with a &quot;publish&quot; column)
                </label>

                {isLegalCategory && (
                  <p style={{ fontSize: '0.72rem', color: '#a89cf7', marginTop: '0.5rem' }}>
                    This requirement is in the Legal category — the CSV template will include validity/processing-time columns.
                  </p>
                )}
                <p style={{ fontSize: '0.72rem', color: '#6b6b8a', marginTop: '0.5rem' }}>
                  All products in one CSV must belong to the same vendor and requirement. Import separately for different vendors or requirements.
                </p>
              </div>

              <button onClick={downloadTemplate} style={{ background: 'none', border: 'none', color: '#7c6af7', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', marginBottom: '0.5rem' }}>
                Download template CSV
              </button>
              <p style={{ fontSize: '0.72rem', color: '#6b6b8a', marginBottom: '1rem' }}>
                Only <strong>name</strong> is required, plus either <strong>price</strong> or both <strong>pricemin</strong>/<strong>pricemax</strong>.
                Every other column is optional and can be left blank — the template includes one minimal example row and one fully filled-in example row.
              </p>

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
                  <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Price ({products[0]?.currency})</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Condition</th>
                          <th style={{ textAlign: 'left', padding: '0.5rem' }}>Publish</th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((p, i) => (
                          <tr key={i}>
                            <td style={{ padding: '0.5rem' }}>{p.name}</td>
                            <td style={{ padding: '0.5rem' }}>{formatPrice(p)}</td>
                            <td style={{ padding: '0.5rem' }}>{p.condition === 'USED' ? 'Used' : 'Brand New'}</td>
                            <td style={{ padding: '0.5rem' }}>{p.publishImmediately ? 'Yes' : 'No'}</td>
                          </tr>
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
                {loading ? 'Importing…' : `Import ${products.length || ''} Product${products.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast toast-${toast.type}`} style={{ bottom: '5rem' }}>{toast.msg}</div>}
    </>
  );
}