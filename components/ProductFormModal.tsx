'use client';

import { useEffect, useRef, useState } from 'react';
import { Product, VendorTuple } from 'types/vendor';

type FormField = {
  name: string;
  description: string;
  price: string;
  image: string;
  url: string;
  vendorId: string;
};

const EMPTY_FORM: FormField = { name: '', description: '', price: '', image: '', url: '', vendorId: '' };

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  fetchProducts: () => void;
  editingProduct: Product | null;
  vendors: VendorTuple[];
};

export default function ProductFormModal({ open, setOpen, fetchProducts, editingProduct, vendors }: Props) {
  const [form, setForm] = useState<FormField>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<FormField>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, editingProduct]);

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

        <div className="modal-divider" />

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Product Name <span className="form-required">*</span></label>
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

            <div className="form-group">
              <label className="form-label">Price <span className="form-required">*</span></label>
              <div className="input-prefix-wrap">
                <span className="input-prefix">$</span>
                <input
                  type="number" min="0" step="0.01"
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
                {vendors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
            </div>

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

            <div className="form-group form-full">
              <label className="form-label">Image URL</label>
              <div className="url-input-wrap">
                <svg className="url-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
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

            <div className="form-group form-full">
              <label className="form-label">Product URL</label>
              <div className="url-input-wrap">
                <svg className="url-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
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

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
                </svg>
                Saving…
              </>
            ) : isEdit ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
                </svg>
                Save Changes
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v16m8-8H4" />
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