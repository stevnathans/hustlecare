/* eslint-disable @typescript-eslint/no-explicit-any */
// components/shared/ProductFormFields.tsx
// Extracted so the admin modal and vendor dashboard form never drift apart
// on which fields exist or how they validate.
'use client';

type Props = {
  form: any;
  setForm: (updater: (f: any) => any) => void;
  errors: Record<string, string>;
};

export default function ProductFormFields({ form, setForm, errors }: Props) {
  return (
    <div className="form-grid">
      <div className="form-group form-full">
        <label className="form-label">Product Name <span className="form-required">*</span></label>
        <input
          className={`form-input ${errors.name ? 'form-input-error' : ''}`}
          value={form.name}
          onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
          placeholder="e.g. HP Pavilion 15 Laptop"
        />
        {errors.name && <div className="form-error">{errors.name}</div>}
      </div>

      <div className="form-group form-full">
        <label className="form-label">Description</label>
        <textarea
          className="form-input form-textarea"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Price <span className="form-required">*</span></label>
        <input
          type="number" min="0" step="0.01"
          className={`form-input ${errors.price ? 'form-input-error' : ''}`}
          value={form.price}
          onChange={(e) => setForm((f: any) => ({ ...f, price: e.target.value }))}
        />
        {errors.price && <div className="form-error">{errors.price}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Currency</label>
        <select className="form-input form-select" value={form.currency} onChange={(e) => setForm((f: any) => ({ ...f, currency: e.target.value }))}>
          {['KES', 'USD', 'UGX', 'TZS', 'NGN'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-group form-full">
        <label className="form-label">Image URL</label>
        <input className="form-input" value={form.image} onChange={(e) => setForm((f: any) => ({ ...f, image: e.target.value }))} placeholder="https://…" />
      </div>

      <div className="form-group form-full">
        <label className="form-label">Product / Buy Link</label>
        <input className="form-input" value={form.url} onChange={(e) => setForm((f: any) => ({ ...f, url: e.target.value }))} placeholder="https://…" />
      </div>

      {/* Condition */}
      <div className="form-group">
        <label className="form-label">Condition</label>
        <div className="grid grid-cols-2 gap-2">
          {(['NEW', 'USED'] as const).map((c) => (
            <button
              key={c} type="button"
              onClick={() => setForm((f: any) => ({ ...f, condition: c }))}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold ${form.condition === c ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}
            >
              {c === 'NEW' ? 'Brand New' : 'Used'}
            </button>
          ))}
        </div>
      </div>

      {form.condition === 'USED' && (
        <>
          <div className="form-group">
            <label className="form-label">Used for</label>
            <div className="flex gap-2">
              <input type="number" min="0" className="form-input" value={form.usedDurationValue} onChange={(e) => setForm((f: any) => ({ ...f, usedDurationValue: e.target.value }))} />
              <select className="form-input" value={form.usedDurationUnit} onChange={(e) => setForm((f: any) => ({ ...f, usedDurationUnit: e.target.value }))}>
                <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Receipt available?</label>
            <select className="form-input" value={form.hasReceipt} onChange={(e) => setForm((f: any) => ({ ...f, hasReceipt: e.target.value }))}>
              <option value="">Select…</option><option value="YES">Yes</option><option value="NO">No</option><option value="UNKNOWN">Not sure</option>
            </select>
          </div>
        </>
      )}

      {/* Specs */}
      <div className="form-group"><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={(e) => setForm((f: any) => ({ ...f, brand: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">Model</label><input className="form-input" value={form.model} onChange={(e) => setForm((f: any) => ({ ...f, model: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">Voltage</label><input className="form-input" value={form.voltage} onChange={(e) => setForm((f: any) => ({ ...f, voltage: e.target.value }))} /></div>
      <div className="form-group"><label className="form-label">Wattage</label><input className="form-input" value={form.wattage} onChange={(e) => setForm((f: any) => ({ ...f, wattage: e.target.value }))} /></div>
      <div className="form-group form-full"><label className="form-label">Dimensions</label><input className="form-input" value={form.dimensions} onChange={(e) => setForm((f: any) => ({ ...f, dimensions: e.target.value }))} /></div>

      <div className="form-group">
        <label className="form-label">Weight</label>
        <div className="flex gap-2">
          <input type="number" min="0" className="form-input" value={form.weight} onChange={(e) => setForm((f: any) => ({ ...f, weight: e.target.value }))} />
          <select className="form-input" value={form.weightUnit} onChange={(e) => setForm((f: any) => ({ ...f, weightUnit: e.target.value }))}>
            <option value="kg">kg</option><option value="g">g</option><option value="lb">lb</option>
          </select>
        </div>
      </div>

      {/* Warranty */}
      <div className="form-group">
        <label className="form-label">Warranty</label>
        <select className="form-input" value={form.warrantyType} onChange={(e) => setForm((f: any) => ({ ...f, warrantyType: e.target.value }))}>
          <option value="NONE">No warranty</option><option value="MANUFACTURER">Manufacturer</option><option value="VENDOR">Vendor-provided</option>
        </select>
      </div>
      {form.warrantyType !== 'NONE' && (
        <div className="form-group">
          <label className="form-label">Warranty duration</label>
          <div className="flex gap-2">
            <input type="number" min="0" className="form-input" value={form.warrantyDurationValue} onChange={(e) => setForm((f: any) => ({ ...f, warrantyDurationValue: e.target.value }))} />
            <select className="form-input" value={form.warrantyDurationUnit} onChange={(e) => setForm((f: any) => ({ ...f, warrantyDurationUnit: e.target.value }))}>
              <option value="days">Days</option><option value="months">Months</option><option value="years">Years</option>
            </select>
          </div>
        </div>
      )}

      {/* Delivery */}
      <div className="form-group form-full">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.deliveryAvailable} onChange={(e) => setForm((f: any) => ({ ...f, deliveryAvailable: e.target.checked }))} />
          Delivery available
        </label>
      </div>
      <div className="form-group"><label className="form-label">Pickup location</label><input className="form-input" value={form.pickupLocation} onChange={(e) => setForm((f: any) => ({ ...f, pickupLocation: e.target.value }))} /></div>
      <div className="form-group">
        <label className="form-label">Lead time</label>
        <select className="form-input" value={form.leadTime} onChange={(e) => setForm((f: any) => ({ ...f, leadTime: e.target.value }))}>
          <option value="IN_STOCK">In stock</option><option value="1_3_DAYS">1–3 days</option><option value="1_WEEK">~1 week</option><option value="2_WEEKS_PLUS">2+ weeks</option>
        </select>
      </div>

      {/* Commercial */}
      <div className="form-group form-full">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.negotiable} onChange={(e) => setForm((f: any) => ({ ...f, negotiable: e.target.checked }))} />
          Price negotiable
        </label>
      </div>
    </div>
  );
}