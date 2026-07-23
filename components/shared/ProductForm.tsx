/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// components/shared/ProductForm.tsx
//
// The full "Add / Edit Product" field set, shared between:
//   - app/vendor/dashboard/products/new/page.tsx  (mode="vendor", theme="light")
//   - components/ProductFormModal.tsx (admin)      (mode="admin",  theme="dark")
//
// Only the surrounding chrome differs between the two (vendor = full page with
// sidebar + sticky mobile bar, admin = compact modal) — that chrome stays in
// each caller. Every field, section, and its layout lives here so the two
// forms can't drift apart again.
//
// Legal Details section: admin-only, and only shown when the selected
// requirement's category is "Legal". Deliberately has NO county field —
// county availability for a Legal product comes from its Vendor
// (Vendor.servesAllCounties / Vendor.counties), not from the product
// itself, so admins just pick the right vendor and validity/processing
// time here.

import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  Tag, Package, DollarSign, Layers, ShieldCheck, Truck, Cpu, Percent, Plus, Trash2, MapPin, Clock, Search, FileText
} from 'lucide-react';
import RequirementPicker, { RequirementOption } from './RequirementPicker';

export type ProductFormTheme = 'light' | 'dark';
export type ProductFormMode = 'vendor' | 'admin';

export type BulkTier = { minQty: string; price: string };

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  priceMin: string;
  priceMax: string;
  usePriceRange: boolean;
  currency: string;
  image: string;
  url: string;
  sku: string;
  stock: string;
  vendorId: string;
  templateId: string;

  condition: 'NEW' | 'USED';
  usedDurationValue: string;
  usedDurationUnit: 'days' | 'months' | 'years';
  hasReceipt: '' | 'YES' | 'NO' | 'UNKNOWN';

  brand: string;
  model: string;
  voltage: string;
  wattage: string;
  dimensions: string;
  weight: string;
  weightUnit: 'kg' | 'g' | 'lb';

  warrantyType: 'NONE' | 'MANUFACTURER' | 'VENDOR';
  warrantyDurationValue: string;
  warrantyDurationUnit: 'days' | 'months' | 'years';

  deliveryAvailable: boolean;
  pickupLocation: string;
  leadTime: 'IN_STOCK' | '1_3_DAYS' | '1_WEEK' | '2_WEEKS_PLUS';

  negotiable: boolean;
  bulkPricingEnabled: boolean;
  publishImmediately: boolean;

  // Legal (admin only, Legal-category requirements only)
  validityValue: string;
  validityUnit: 'days' | 'months' | 'years';
  processingTimeMinDays: string;
  processingTimeMaxDays: string;
};

/** Spread this into your initial state on both sides so every field always has a value. */
export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: '', description: '', price: '', priceMin: '', priceMax: '', usePriceRange: false,
  currency: 'KES', image: '', url: '', sku: '', stock: '', vendorId: '', templateId: '',
  condition: 'NEW', usedDurationValue: '', usedDurationUnit: 'months', hasReceipt: '',
  brand: '', model: '', voltage: '', wattage: '', dimensions: '', weight: '', weightUnit: 'kg',
  warrantyType: 'NONE', warrantyDurationValue: '', warrantyDurationUnit: 'months',
  deliveryAvailable: false, pickupLocation: '', leadTime: 'IN_STOCK',
  negotiable: false, bulkPricingEnabled: false, publishImmediately: false,
  validityValue: '', validityUnit: 'years', processingTimeMinDays: '', processingTimeMaxDays: '',
};

type Props = {
  mode: ProductFormMode;
  theme: ProductFormTheme;
  form: ProductFormValues;
  setForm: (updater: (f: ProductFormValues) => ProductFormValues) => void;
  errors: Record<string, string>;
  requirements: RequirementOption[];
  loadingRequirements?: boolean;
  /** admin only */
  vendors?: [string, string][];
  /** vendor only */
  bulkTiers?: BulkTier[];
  setBulkTiers?: (updater: (t: BulkTier[]) => BulkTier[]) => void;
};

export default function ProductForm({
  mode, theme, form, setForm, errors, requirements, loadingRequirements = false,
  vendors = [], bulkTiers = [], setBulkTiers,
}: Props) {
  const t = tokens(theme);

  const [vendorSearch, setVendorSearch] = useState('');
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);

  // Which requirement is selected, and is it Legal? Drives the Legal
  // Details section below — admin-only, so vendors never see it.
  const selectedRequirement = requirements.find((r) => r.id.toString() === form.templateId);
  const isLegalRequirement = mode === 'admin' && selectedRequirement?.category === 'Legal';

  const addBulkTier    = () => setBulkTiers?.(rows => [...rows, { minQty: '', price: '' }]);
  const updateBulkTier = (i: number, key: keyof BulkTier, value: string) =>
    setBulkTiers?.(rows => rows.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const removeBulkTier = (i: number) => setBulkTiers?.(rows => rows.filter((_, idx) => idx !== i));

  const filteredVendors = vendors.filter(([, name]) =>
    name.toLowerCase().includes(vendorSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4" style={theme === 'dark' ? { colorScheme: 'dark' } : undefined}>

      {/* Vendor + Requirement — admin only (vendor already knows who they are) */}
      {mode === 'admin' && (
        <Section theme={theme} title="Vendor & Requirement" icon={<Tag size={14} />}>
          <div className={t.twoCol}>
            <div className="relative">
              <label className={t.label}>Vendor <span className={t.required}>*</span></label>

              <button
                type="button"
                onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                className={`${t.input} flex items-center justify-between text-left`}
                style={theme === 'dark' ? { backgroundColor: '#1e1e2f', color: '#e2e2ef', border: '1px solid rgba(255,255,255,0.15)' } : undefined}
              >
                <span>
                  {form.vendorId
                    ? (vendors.find(([id]) => id === form.vendorId)?.[1] || 'Select vendor…')
                    : 'Select vendor…'}
                </span>
                <span className="text-gray-400 pointer-events-none text-[10px]">▼</span>
              </button>

              {isVendorDropdownOpen && (
                <div
                  className="absolute z-50 w-full mt-1 border rounded-lg shadow-xl"
                  style={{
                    backgroundColor: theme === 'dark' ? '#1e1e2f' : '#ffffff',
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.15)' : '#e5e7eb',
                  }}
                >
                  <div className="p-2 border-b" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#f3f4f6' }}>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-gray-400">
                        <Search size={12} />
                      </span>
                      <input
                        type="text"
                        placeholder="Type to filter..."
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 text-xs rounded border outline-none focus:border-emerald-500"
                        style={{
                          backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                          color: theme === 'dark' ? '#e2e2ef' : '#111827',
                          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#d1d5db'
                        }}
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForm((f) => ({ ...f, vendorId: '' }));
                        setIsVendorDropdownOpen(false);
                        setVendorSearch('');
                      }}
                      className="w-full px-3 py-2 text-left text-xs rounded hover:bg-emerald-500 hover:text-white transition-colors text-gray-400"
                    >
                      Clear selection
                    </button>

                    {filteredVendors.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-gray-500 italic">No vendors found</div>
                    ) : (
                      filteredVendors.map(([id, name]) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, vendorId: id }));
                            setIsVendorDropdownOpen(false);
                            setVendorSearch('');
                          }}
                          className="w-full px-3 py-2 text-left text-xs rounded transition-colors"
                          style={{
                            backgroundColor: form.vendorId === id ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                            color: theme === 'dark' ? '#e2e2ef' : '#111827'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = form.vendorId === id ? 'rgba(16, 185, 129, 0.15)' : 'transparent'; }}
                        >
                          {name}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
              {errors.vendorId && <div className={t.error}>{errors.vendorId}</div>}
            </div>

            <div>
              <RequirementPicker
                requirements={requirements}
                loading={loadingRequirements}
                value={form.templateId}
                onChange={(id) => setForm((f) => ({ ...f, templateId: id }))}
                error={errors.templateId}
                label="Requirement"
                variant={theme}
                showSelectedDetail={false}
              />
            </div>
          </div>
        </Section>
      )}

      {/* Requirement — vendor only */}
      {mode === 'vendor' && (
        <Section theme={theme} title="Requirement" icon={<Tag size={14} />} subtitle="Which business requirement does this product fulfil?">
          <RequirementPicker
            requirements={requirements}
            loading={loadingRequirements}
            value={form.templateId}
            onChange={(id) => setForm((f) => ({ ...f, templateId: id }))}
            label="Select Requirement"
            variant={theme}
          />
        </Section>
      )}

      {/* Legal Details — admin only, only when the selected requirement is Legal.
          No county field here on purpose — see file header comment. */}
      {isLegalRequirement && (
        <Section theme={theme} title="Legal Details" icon={<FileText size={14} />} subtitle="Validity and processing time shown on the product card for this permit/licence/certificate.">
          <div className={t.twoCol}>
            <div>
              <label className={t.label}>Validity period</label>
              <div className="flex gap-2">
                <input
                  type="number" min="0" className={t.input} placeholder="e.g. 1"
                  value={form.validityValue}
                  onChange={(e) => setForm((f) => ({ ...f, validityValue: e.target.value }))}
                />
                <select
                  className={`${t.input} max-w-[110px]`}
                  value={form.validityUnit}
                  onChange={(e) => setForm((f) => ({ ...f, validityUnit: e.target.value as any }))}
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
            <div>
              <label className={t.label}>Processing time (days)</label>
              <div className="flex gap-2">
                <input
                  type="number" min="0" className={t.input} placeholder="Min e.g. 3"
                  value={form.processingTimeMinDays}
                  onChange={(e) => setForm((f) => ({ ...f, processingTimeMinDays: e.target.value }))}
                />
                <input
                  type="number" min="0" className={t.input} placeholder="Max e.g. 5"
                  value={form.processingTimeMaxDays}
                  onChange={(e) => setForm((f) => ({ ...f, processingTimeMaxDays: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            County availability for this product is set on the Vendor above (which counties they serve), not here.
          </div>
        </Section>
      )}

      {/* Details */}
      <Section theme={theme} title="Product Details" icon={<Package size={14} />}>
        <div className="flex flex-col gap-4">
          <div>
            <label className={t.label}>Product Name <span className={t.required}>*</span></label>
            <input
              className={`${t.input} ${errors.name ? t.inputError : ''}`}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. HP Pavilion 15 Laptop"
            />
            {errors.name && <div className={t.error}>{errors.name}</div>}
          </div>
          <div>
            <label className={t.label}>Description</label>
            <textarea
              className={`${t.input} resize-y leading-relaxed`}
              rows={mode === 'vendor' ? 4 : 3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Specs, features, and why entrepreneurs should choose this product…"
            />
          </div>
          <div className={t.twoCol}>
            <div>
              <label className={t.label}>Product Image URL</label>
              <input className={t.input} value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://…" />
            </div>
            <div>
              <label className={t.label}>Product / Buy Link</label>
              <input className={t.input} value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
            </div>
          </div>
        </div>
      </Section>

      {/* Condition */}
      <Section theme={theme} title="Condition" icon={<ShieldCheck size={14} />}>
        <label className={t.label}>Condition</label>
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(['NEW', 'USED'] as const).map((c) => (
            <button
              key={c} type="button"
              onClick={() => setForm((f) => ({ ...f, condition: c }))}
              className={t.toggleBtn(form.condition === c)}
            >
              {c === 'NEW' ? 'Brand New' : 'Used'}
            </button>
          ))}
        </div>
        {form.condition === 'USED' && (
          <div className={t.twoCol}>
            <div>
              <label className={t.label}>How long has it been used?</label>
              <div className="flex gap-2">
                <input
                  type="number" min="0" className={t.input} placeholder="e.g. 8"
                  value={form.usedDurationValue}
                  onChange={(e) => setForm((f) => ({ ...f, usedDurationValue: e.target.value }))}
                />
                <select
                  className={`${t.input} max-w-[110px]`}
                  value={form.usedDurationUnit}
                  onChange={(e) => setForm((f) => ({ ...f, usedDurationUnit: e.target.value as any }))}
                >
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
            <div>
              <label className={t.label}>Receipt available?</label>
              <select
                className={t.input}
                value={form.hasReceipt}
                onChange={(e) => setForm((f) => ({ ...f, hasReceipt: e.target.value as any }))}
              >
                <option value="">Select…</option>
                <option value="YES">Yes, original receipt available</option>
                <option value="NO">No receipt</option>
                <option value="UNKNOWN">Not sure</option>
              </select>
            </div>
          </div>
        )}
      </Section>

      {/* Specifications */}
      <Section theme={theme} title="Specifications" icon={<Cpu size={14} />}>
        <div className={`${t.twoCol} mb-3`}>
          <div>
            <label className={t.label}>Brand / Manufacturer</label>
            <input className={t.input} placeholder="Optional" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          </div>
          <div>
            <label className={t.label}>Model</label>
            <input className={t.input} placeholder="Optional" value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} />
          </div>
        </div>
        <div className={`${t.twoCol} mb-3`}>
          <div>
            <label className={t.label}>Power requirements</label>
            <div className="flex gap-2">
              <input className={t.input} placeholder="Voltage (e.g. 220V)" value={form.voltage} onChange={(e) => setForm((f) => ({ ...f, voltage: e.target.value }))} />
              <input className={t.input} placeholder="Wattage (e.g. 1500W)" value={form.wattage} onChange={(e) => setForm((f) => ({ ...f, wattage: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className={t.label}>Dimensions (L x W x H)</label>
            <input className={t.input} placeholder="e.g. 60 x 45 x 90 cm" value={form.dimensions} onChange={(e) => setForm((f) => ({ ...f, dimensions: e.target.value }))} />
          </div>
        </div>
        <div>
          <label className={t.label}>Weight</label>
          <div className="flex max-w-xs gap-2">
            <input type="number" min="0" className={t.input} placeholder="Optional" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
            <select className={`${t.input} max-w-[90px]`} value={form.weightUnit} onChange={(e) => setForm((f) => ({ ...f, weightUnit: e.target.value as any }))}>
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="lb">lb</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section theme={theme} title="Pricing" icon={<DollarSign size={14} />}>
        <div className={t.twoCol}>
          <div>
            <label className={t.label}>Currency</label>
            <select className={t.input} value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}>
              {['KES', 'USD', 'UGX', 'TZS', 'NGN', 'ZAR', 'GHS'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className={`${t.label} mb-0`}>Price {!form.usePriceRange && <span className={t.required}>*</span>}</label>
              <label className={t.inlineCheckboxSmall}>
                <input type="checkbox" checked={form.usePriceRange} onChange={(e) => setForm((f) => ({ ...f, usePriceRange: e.target.checked }))} />
                Use range
              </label>
            </div>
            <div className="mt-1.5">
              {!form.usePriceRange ? (
                <>
                  <input
                    type="number" className={`${t.input} ${errors.price ? t.inputError : ''}`} placeholder="0.00"
                    value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  />
                  {errors.price && <div className={t.error}>{errors.price}</div>}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-gray-400">Min</div>
                    <input type="number" className={t.input} placeholder="0.00" value={form.priceMin} onChange={(e) => setForm((f) => ({ ...f, priceMin: e.target.value }))} />
                  </div>
                  <div>
                    <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-wider text-gray-400">Max</div>
                    <input type="number" className={t.input} placeholder="0.00" value={form.priceMax} onChange={(e) => setForm((f) => ({ ...f, priceMax: e.target.value }))} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={t.subSection}>
          <div className="mb-3 flex items-center gap-2">
            <Percent size={13} className={t.mutedIcon} />
            <span className={t.subLabel}>Commercial Terms</span>
          </div>

          <label className={t.inlineCheckbox}>
            <input type="checkbox" checked={form.negotiable} onChange={(e) => setForm((f) => ({ ...f, negotiable: e.target.checked }))} />
            Price is negotiable
          </label>

          <label className={t.inlineCheckbox}>
            <input type="checkbox" checked={form.bulkPricingEnabled} onChange={(e) => setForm((f) => ({ ...f, bulkPricingEnabled: e.target.checked }))} />
            Offer bulk / wholesale pricing
          </label>

          {form.bulkPricingEnabled && (
            <div className={t.tierBox}>
              {bulkTiers.length === 0 && (
                <p className="mb-2 text-xs text-gray-400">Add pricing tiers based on quantity ordered.</p>
              )}
              <div className="flex flex-col gap-2">
                {bulkTiers.map((tier, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={t.input} type="number" min="1" placeholder="Min qty" value={tier.minQty} onChange={(e) => updateBulkTier(i, 'minQty', e.target.value)} />
                    <input className={t.input} type="number" min="0" placeholder={`Price per unit (${form.currency})`} value={tier.price} onChange={(e) => updateBulkTier(i, 'price', e.target.value)} />
                    <button
                      type="button"
                      onClick={() => removeBulkTier(i)}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addBulkTier} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700">
                <Plus size={13} /> Add tier
              </button>
            </div>
          )}
        </div>
      </Section>

      {/* Warranty */}
      <Section theme={theme} title="Warranty" icon={<ShieldCheck size={14} />}>
        <label className={t.label}>Warranty type</label>
        <select className={`${t.input} mb-3`} value={form.warrantyType} onChange={(e) => setForm((f) => ({ ...f, warrantyType: e.target.value as any }))}>
          <option value="NONE">No warranty</option>
          <option value="MANUFACTURER">Manufacturer warranty</option>
          <option value="VENDOR">Vendor-provided warranty</option>
        </select>
        {form.warrantyType !== 'NONE' && (
          <div>
            <label className={t.label}>Warranty duration</label>
            <div className="flex max-w-xs gap-2">
              <input type="number" min="0" className={t.input} placeholder="e.g. 12" value={form.warrantyDurationValue} onChange={(e) => setForm((f) => ({ ...f, warrantyDurationValue: e.target.value }))} />
              <select className={`${t.input} max-w-[110px]`} value={form.warrantyDurationUnit} onChange={(e) => setForm((f) => ({ ...f, warrantyDurationUnit: e.target.value as any }))}>
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
        )}
      </Section>

      {/* Delivery & Logistics */}
      <Section theme={theme} title="Delivery & Logistics" icon={<Truck size={14} />}>
        <label className={t.inlineCheckbox}>
          <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => setForm((f) => ({ ...f, deliveryAvailable: e.target.checked }))} />
          Delivery available
        </label>
        <div className={`${t.twoCol} mt-1`}>
          <div>
            <label className={t.label}><span className="inline-flex items-center gap-1"><MapPin size={11} /> Pickup location</span></label>
            <input className={t.input} placeholder="e.g. Industrial Area, Nairobi" value={form.pickupLocation} onChange={(e) => setForm((f) => ({ ...f, pickupLocation: e.target.value }))} />
          </div>
          <div>
            <label className={t.label}><span className="inline-flex items-center gap-1"><Clock size={11} /> Lead time</span></label>
            <select className={t.input} value={form.leadTime} onChange={(e) => setForm((f) => ({ ...f, leadTime: e.target.value as any }))}>
              <option value="IN_STOCK">In stock — ships immediately</option>
              <option value="1_3_DAYS">1–3 days</option>
              <option value="1_WEEK">About 1 week</option>
              <option value="2_WEEKS_PLUS">2+ weeks</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Inventory */}
      <Section theme={theme} title="Inventory" icon={<Layers size={13} />}>
        <div className={t.twoCol}>
          <div>
            <label className={t.label}>SKU</label>
            <input className={t.input} placeholder="Optional" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
          </div>
          <div>
            <label className={t.label}>Stock</label>
            <input type="number" className={t.input} placeholder="Unlimited" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
          </div>
        </div>
        <span className="mt-2 block text-xs text-gray-400">Leave stock blank for unlimited / untracked.</span>
      </Section>

      {/* Publish immediately — admin only */}
      {mode === 'admin' && (
        <label className={t.inlineCheckbox}>
          <input type="checkbox" checked={form.publishImmediately} onChange={(e) => setForm((f) => ({ ...f, publishImmediately: e.target.checked }))} />
          Publish immediately (skip review — admin-authored content)
        </label>
      )}
    </div>
  );
}

/* ── Section wrapper — white card for the vendor (light) form, dark panel for admin ── */
function Section({
  theme, title, icon, subtitle, children,
}: { theme: ProductFormTheme; title: string; icon: ReactNode; subtitle?: string; children: ReactNode }) {
  if (theme === 'light') {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">{icon}</span>
            <h2 className="text-sm font-bold text-gray-900">{title}</h2>
          </div>
          {subtitle && <p className="mt-1 text-xs leading-relaxed text-gray-500">{subtitle}</p>}
        </div>
        {children}
      </div>
    );
  }
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '1rem 1.1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
        <span style={{ color: '#a89cf7', display: 'flex' }}>{icon}</span>
        <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#e2e2ef', margin: 0 }}>{title}</h3>
      </div>
      {subtitle && <p style={{ fontSize: '0.75rem', color: '#6b6b8a', marginTop: '-0.4rem', marginBottom: '0.75rem' }}>{subtitle}</p>}
      {children}
    </div>
  );
}

/* ── Theme tokens — swap Tailwind (vendor) for the admin's existing form-* / dark classes ── */
function tokens(theme: ProductFormTheme) {
  if (theme === 'light') {
    return {
      twoCol: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
      label: 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500',
      required: 'text-red-500',
      input:
        'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100',
      inputError: 'border-red-400',
      error: 'mt-1 text-xs text-red-500',
      toggleBtn: (active: boolean) =>
        `rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
          active ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
        }`,
      subSection: 'mt-4 border-t border-gray-100 pt-4',
      subLabel: 'text-xs font-bold uppercase tracking-wider text-gray-500',
      mutedIcon: 'text-gray-400',
      inlineCheckbox: 'mb-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700',
      inlineCheckboxSmall: 'flex cursor-pointer items-center gap-1.5 text-xs font-normal normal-case tracking-normal text-gray-500',
      tierBox: 'rounded-xl border border-gray-100 bg-gray-50 p-3',
    };
  }
  return {
    twoCol: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
    label: 'form-label',
    required: 'form-required',
    input: 'form-input',
    inputError: 'form-input-error',
    error: 'form-error',
    toggleBtn: (active: boolean) =>
      `rounded-lg border px-3 py-2 text-sm font-semibold ${active ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-600 text-gray-400'}`,
    subSection: 'mt-4',
    subLabel: 'text-xs font-bold uppercase tracking-wider',
    mutedIcon: '',
    inlineCheckbox: 'mb-3 flex cursor-pointer items-center gap-2 text-sm',
    inlineCheckboxSmall: 'flex cursor-pointer items-center gap-1.5 text-xs',
    tierBox: 'rounded-xl border border-white/10 bg-white/[0.03] p-3',
  };
}