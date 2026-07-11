/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductFormModal.tsx (admin) 
'use client';

import React from 'react';

import { useEffect, useRef, useState } from 'react';
import { Product, VendorTuple } from 'types/vendor';
import ProductFormFields from './shared/ProductFormFields';

const EMPTY_FORM = {
  name: '', description: '', price: '', currency: 'KES', image: '', url: '', vendorId: '', templateId: '',
  condition: 'NEW', usedDurationValue: '', usedDurationUnit: 'months', hasReceipt: '',
  brand: '', model: '', voltage: '', wattage: '', dimensions: '', weight: '', weightUnit: 'kg',
  warrantyType: 'NONE', warrantyDurationValue: '', warrantyDurationUnit: 'months',
  deliveryAvailable: false, pickupLocation: '', leadTime: 'IN_STOCK', negotiable: false,
  publishImmediately: false,
};

type Requirement = { id: number; name: string; category: string };

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  fetchProducts: () => void;
  editingProduct: Product | null;
  vendors: VendorTuple[];
};

export default function ProductFormModal({ open, setOpen, fetchProducts, editingProduct, vendors }: Props) {
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetch('/api/requirements').then((r) => r.ok && r.json()).then((d) => setRequirements(Array.isArray(d) ? d : []));

    if (editingProduct) {
      const p: any = editingProduct;
      setForm({
        name: p.name || '', description: p.description || '', price: p.price != null ? String(p.price) : '',
        currency: p.currency || 'KES', image: p.image || '', url: p.url || '',
        vendorId: p.vendorId != null ? String(p.vendorId) : '', templateId: p.templateId != null ? String(p.templateId) : '',
        condition: p.condition || 'NEW', usedDurationValue: p.usedDurationValue?.toString() || '', usedDurationUnit: p.usedDurationUnit || 'months', hasReceipt: p.hasReceipt || '',
        brand: p.brand || '', model: p.modelNumber || '', voltage: p.voltage || '', wattage: p.wattage || '', dimensions: p.dimensions || '',
        weight: p.weight?.toString() || '', weightUnit: p.weightUnit || 'kg',
        warrantyType: p.warrantyType || 'NONE', warrantyDurationValue: p.warrantyDurationValue?.toString() || '', warrantyDurationUnit: p.warrantyDurationUnit || 'months',
        deliveryAvailable: !!p.deliveryAvailable, pickupLocation: p.pickupLocation || '', leadTime: p.leadTime || 'IN_STOCK', negotiable: !!p.negotiable,
        publishImmediately: p.status === 'ACTIVE',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [open, editingProduct]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    if (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) < 0) errs.price = 'Enter a valid price';
    if (!form.vendorId) errs.vendorId = 'Select a vendor';
    if (!form.templateId) errs.templateId = 'Select a requirement';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), vendorId: Number(form.vendorId), templateId: Number(form.templateId) };
      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setOpen(false);
      fetchProducts();
    } catch (e) {
      setErrors({ name: e instanceof Error ? e.message : 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  const isEdit = !!editingProduct;

  return (
    <div className="modal-overlay" onClick={() => setOpen(false)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{isEdit ? 'Edit Product' : 'New Product'}</div>
            <div className="modal-subtitle">Admin-managed product — requires a vendor and requirement</div>
          </div>
          <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="modal-divider" />
        <div className="modal-body">
          <div className="form-grid" style={{ marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Vendor <span className="form-required">*</span></label>
              <select className={`form-input form-select ${errors.vendorId ? 'form-input-error' : ''}`} value={form.vendorId} onChange={(e) => setForm((f: any) => ({ ...f, vendorId: e.target.value }))}>
                <option value="">Select vendor…</option>
                {vendors.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
              {errors.vendorId && <div className="form-error">{errors.vendorId}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Requirement <span className="form-required">*</span></label>
              <select className={`form-input form-select ${errors.templateId ? 'form-input-error' : ''}`} value={form.templateId} onChange={(e) => setForm((f: any) => ({ ...f, templateId: e.target.value }))}>
                <option value="">Select requirement…</option>
                {requirements.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.category})</option>)}
              </select>
              {errors.templateId && <div className="form-error">{errors.templateId}</div>}
            </div>
          </div>

          <ProductFormFields form={form} setForm={setForm} errors={errors} />

          <div className="form-group form-full" style={{ marginTop: '1rem' }}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.publishImmediately} onChange={(e) => setForm((f: any) => ({ ...f, publishImmediately: e.target.checked }))} />
              Publish immediately (skip review — admin-authored content)
            </label>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </div>
    </div>
  );
}