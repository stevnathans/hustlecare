/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductFormModal.tsx (admin)
'use client';

import { useEffect, useRef, useState } from 'react';
import { Product, VendorTuple } from 'types/vendor';
import { RequirementOption } from './shared/RequirementPicker';
import ProductForm, { EMPTY_PRODUCT_FORM, ProductFormValues, BulkTier } from './shared/ProductForm';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  fetchProducts: () => void;
  editingProduct: Product | null;
  vendors: VendorTuple[];
};

export default function ProductFormModal({ open, setOpen, fetchProducts, editingProduct, vendors }: Props) {
  const [form, setForm] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>([]);
  const [requirements, setRequirements] = useState<RequirementOption[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingRequirements(true);
    fetch('/api/requirements')
      .then((r) => r.ok && r.json())
      .then((d) => setRequirements(Array.isArray(d) ? d : []))
      .finally(() => setLoadingRequirements(false));

    if (editingProduct) {
      const p: any = editingProduct;
      setForm({
        ...EMPTY_PRODUCT_FORM,
        name: p.name || '', description: p.description || '', price: p.price != null ? String(p.price) : '',
        priceMin: p.priceMin != null ? String(p.priceMin) : '', priceMax: p.priceMax != null ? String(p.priceMax) : '',
        usePriceRange: !!(p.priceMin || p.priceMax),
        currency: p.currency || 'KES', image: p.image || '', url: p.url || '',
        sku: p.sku || '', stock: p.stock != null ? String(p.stock) : '',
        vendorId: p.vendorId != null ? String(p.vendorId) : '', templateId: p.templateId != null ? String(p.templateId) : '',
        condition: p.condition || 'NEW', usedDurationValue: p.usedDurationValue?.toString() || '', usedDurationUnit: p.usedDurationUnit || 'months', hasReceipt: p.hasReceipt || '',
        brand: p.brand || '', model: p.modelNumber || '', voltage: p.voltage || '', wattage: p.wattage || '', dimensions: p.dimensions || '',
        weight: p.weight?.toString() || '', weightUnit: p.weightUnit || 'kg',
        warrantyType: p.warrantyType || 'NONE', warrantyDurationValue: p.warrantyDurationValue?.toString() || '', warrantyDurationUnit: p.warrantyDurationUnit || 'months',
        deliveryAvailable: !!p.deliveryAvailable, pickupLocation: p.pickupLocation || '', leadTime: p.leadTime || 'IN_STOCK', negotiable: !!p.negotiable,
        bulkPricingEnabled: Array.isArray(p.bulkPricing) && p.bulkPricing.length > 0,
        publishImmediately: p.status === 'ACTIVE',

        // Legal
        validityValue: p.validityValue?.toString() || '',
        validityUnit: p.validityUnit || 'years',
        processingTimeMinDays: p.processingTimeMinDays?.toString() || '',
        processingTimeMaxDays: p.processingTimeMaxDays?.toString() || '',
      });
      setBulkTiers(
        Array.isArray(p.bulkPricing)
          ? p.bulkPricing.map((b: { minQty?: number; price?: number }) => ({
              minQty: b.minQty?.toString() ?? '',
              price: b.price?.toString() ?? '',
            }))
          : []
      );
    } else {
      setForm(EMPTY_PRODUCT_FORM);
      setBulkTiers([]);
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
    if (!form.usePriceRange && (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) < 0)) {
      errs.price = 'Enter a valid price';
    }
    if (!form.vendorId) errs.vendorId = 'Select a vendor';
    if (!form.templateId) errs.templateId = 'Select a requirement';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: form.usePriceRange ? null : Number(form.price),
        priceMin: form.usePriceRange && form.priceMin ? Number(form.priceMin) : null,
        priceMax: form.usePriceRange && form.priceMax ? Number(form.priceMax) : null,
        sku: form.sku || null,
        stock: form.stock ? parseInt(form.stock) : null,
        vendorId: Number(form.vendorId),
        templateId: Number(form.templateId),
        bulkPricing: form.bulkPricingEnabled
          ? bulkTiers
              .filter((t) => t.minQty && t.price)
              .map((t) => ({ minQty: parseInt(t.minQty), price: parseFloat(t.price) }))
          : [],

        // Legal
        validityValue: form.validityValue ? Number(form.validityValue) : null,
        validityUnit: form.validityValue ? form.validityUnit : null,
        processingTimeMinDays: form.processingTimeMinDays ? parseInt(form.processingTimeMinDays) : null,
        processingTimeMaxDays: form.processingTimeMaxDays ? parseInt(form.processingTimeMaxDays) : null,
      };
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
          <ProductForm
            mode="admin"
            theme="dark"
            form={form}
            setForm={setForm}
            errors={errors}
            requirements={requirements}
            loadingRequirements={loadingRequirements}
            vendors={vendors}
            bulkTiers={bulkTiers}
            setBulkTiers={setBulkTiers}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </div>
    </div>
  );
}