'use client';
// app/vendor/dashboard/products/new/page.tsx
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Save, Send, Loader2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { AppealModal, VendorAppealData } from '@/components/vendors/SuspensionNotice';
import { RequirementOption } from '@/components/shared/RequirementPicker';
import ProductForm, { EMPTY_PRODUCT_FORM, ProductFormValues, BulkTier } from '@/components/shared/ProductForm';

type ProductFormPageProps = { productId?: number };

export default function NewProductPage() {
  return <ProductFormPage />;
}

export function ProductFormPage({ productId }: ProductFormPageProps) {
  const router    = useRouter();
  const isEditing = !!productId;

  const [templates,       setTemplates]       = useState<RequirementOption[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingTemplates,setLoadingTemplates] = useState(true);
  const [loadingProduct,  setLoadingProduct]  = useState(isEditing);
  const [checkingAccess,  setCheckingAccess]  = useState(!isEditing);
  const [error,           setError]           = useState('');
  const [saved,           setSaved]           = useState(false);
  const [suspendedVendor, setSuspendedVendor] = useState<VendorAppealData | null>(null);
  const [bulkTiers,       setBulkTiers]       = useState<BulkTier[]>([]);

  const [form, setForm] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/requirements');
      if (res.ok) setTemplates(await res.json());
    } finally { setLoadingTemplates(false); }
  }, []);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendors/products/${productId}`);
      if (!res.ok) { router.push('/vendor/dashboard/products'); return; }
      const p = await res.json();
      setForm({
        ...EMPTY_PRODUCT_FORM,
        name: p.name ?? '', description: p.description ?? '',
        price: p.price?.toString() ?? '', priceMin: p.priceMin?.toString() ?? '', priceMax: p.priceMax?.toString() ?? '',
        currency: p.currency ?? 'KES', image: p.image ?? '', url: p.url ?? '',
        sku: p.sku ?? '', stock: p.stock?.toString() ?? '',
        templateId: p.templateId?.toString() ?? '',
        usePriceRange: !!(p.priceMin || p.priceMax),

        condition: p.condition ?? 'NEW',
        usedDurationValue: p.usedDurationValue?.toString() ?? '',
        usedDurationUnit: p.usedDurationUnit ?? 'months',
        hasReceipt: p.hasReceipt ?? '',

        brand: p.brand ?? '',
        model: p.model ?? '',
        voltage: p.voltage ?? '',
        wattage: p.wattage ?? '',
        dimensions: p.dimensions ?? '',
        weight: p.weight?.toString() ?? '',
        weightUnit: p.weightUnit ?? 'kg',

        warrantyType: p.warrantyType ?? 'NONE',
        warrantyDurationValue: p.warrantyDurationValue?.toString() ?? '',
        warrantyDurationUnit: p.warrantyDurationUnit ?? 'months',

        deliveryAvailable: !!p.deliveryAvailable,
        pickupLocation: p.pickupLocation ?? '',
        leadTime: p.leadTime ?? 'IN_STOCK',

        negotiable: !!p.negotiable,
        bulkPricingEnabled: Array.isArray(p.bulkPricing) && p.bulkPricing.length > 0,
      });
      setBulkTiers(
        Array.isArray(p.bulkPricing)
          ? p.bulkPricing.map((b: { minQty?: number; price?: number }) => ({
              minQty: b.minQty?.toString() ?? '',
              price: b.price?.toString() ?? '',
            }))
          : []
      );
    } catch { router.push('/vendor/dashboard/products'); }
    finally { setLoadingProduct(false); }
  }, [productId, router]);

  useEffect(() => {
    if (!isEditing) {
      fetch('/api/vendors/profile')
        .then(r => r.ok ? r.json() : null)
        .then(p => {
          if (p?.status === 'SUSPENDED') {
            setSuspendedVendor(p as VendorAppealData);
          }
          setCheckingAccess(false);
        })
        .catch(() => setCheckingAccess(false));
    }
    fetchTemplates();
    if (isEditing) fetchProduct();
  }, [fetchTemplates, fetchProduct, isEditing, router]);

  async function handleSave(submitForReview: boolean) {
    setError('');
    setLoading(true);
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        price:    form.usePriceRange ? null : (form.price    ? parseFloat(form.price)    : null),
        priceMin: form.usePriceRange ? (form.priceMin ? parseFloat(form.priceMin) : null) : null,
        priceMax: form.usePriceRange ? (form.priceMax ? parseFloat(form.priceMax) : null) : null,
        currency: form.currency,
        image:    form.image || null,
        url:      form.url   || null,
        sku:      form.sku   || null,
        stock:    form.stock ? parseInt(form.stock) : null,
        templateId: form.templateId ? parseInt(form.templateId) : null,
        submitForReview,

        // Condition
        condition: form.condition,
        usedDurationValue: form.condition === 'USED' && form.usedDurationValue
          ? parseFloat(form.usedDurationValue) : null,
        usedDurationUnit: form.condition === 'USED' ? form.usedDurationUnit : null,
        hasReceipt: form.condition === 'USED' ? (form.hasReceipt || null) : null,

        // Specs
        brand: form.brand || null,
        model: form.model || null,
        voltage: form.voltage || null,
        wattage: form.wattage || null,
        dimensions: form.dimensions || null,
        weight: form.weight ? parseFloat(form.weight) : null,
        weightUnit: form.weight ? form.weightUnit : null,

        // Warranty
        warrantyType: form.warrantyType,
        warrantyDurationValue: form.warrantyType !== 'NONE' && form.warrantyDurationValue
          ? parseFloat(form.warrantyDurationValue) : null,
        warrantyDurationUnit: form.warrantyType !== 'NONE' ? form.warrantyDurationUnit : null,

        // Delivery / logistics
        deliveryAvailable: form.deliveryAvailable,
        pickupLocation: form.pickupLocation || null,
        leadTime: form.leadTime,

        // Commercial terms
        negotiable: form.negotiable,
        bulkPricing: form.bulkPricingEnabled
          ? bulkTiers
              .filter(t => t.minQty && t.price)
              .map(t => ({ minQty: parseInt(t.minQty), price: parseFloat(t.price) }))
          : [],
      };
      const url    = isEditing ? `/api/vendors/products/${productId}` : '/api/vendors/products';
      const method = isEditing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) {
        if (data.code === 'VENDOR_SUSPENDED') {
          const profRes = await fetch('/api/vendors/profile');
          if (profRes.ok) setSuspendedVendor(await profRes.json());
          return;
        }
        throw new Error(data.error);
      }
      setSaved(true);
      setTimeout(() => router.push('/vendor/dashboard/products'), 800);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setLoading(false); }
  }

  const canSubmit = !loading && !!form.name && !!form.templateId;

  if (checkingAccess || loadingProduct) {
    return (
      <div className="flex h-56 items-center justify-center">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] pb-20 text-gray-900">
      {suspendedVendor && (
        <AppealModal
          vendor={suspendedVendor}
          context="addProduct"
          onClose={() => {
            if (isEditing) {
              setSuspendedVendor(null);
            } else {
              router.push('/vendor/dashboard/products');
            }
          }}
          onSubmitted={(update) => setSuspendedVendor(v => v ? { ...v, ...update } : v)}
        />
      )}

      {/* Header */}
      <div className="mb-7">
        <Link
          href="/vendor/dashboard/products"
          className="mb-2.5 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-emerald-600"
        >
          <ChevronLeft size={14} /> Back to Products
        </Link>
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          {isEditing
            ? 'Update your product. Changes require re-submission for review.'
            : 'Add a product to a requirement so entrepreneurs can find and buy it.'}
        </p>
      </div>

      {/* Banners */}
      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}
      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <CheckCircle2 size={14} className="flex-shrink-0" /> Saved — redirecting…
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          <ProductForm
            mode="vendor"
            theme="light"
            form={form}
            setForm={setForm}
            errors={{}}
            requirements={templates}
            loadingRequirements={loadingTemplates}
            bulkTiers={bulkTiers}
            setBulkTiers={setBulkTiers}
          />

          {/* How it works */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
            <h3 className="mb-1.5 text-sm font-bold text-indigo-600">How tagging works</h3>
            <p className="m-0 text-xs leading-relaxed text-gray-500">
              Once approved, your product is automatically shown to every entrepreneur starting a business that includes the requirement you selected.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="hidden flex-col gap-4 lg:flex">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3.5 text-sm font-bold text-gray-900">Publish</h2>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit for Review
              </button>
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={loading || !form.name}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
              >
                <Save size={14} /> Save as Draft
              </button>
            </div>
            <div className="mt-3.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-gray-600">
              <Info size={13} className="mt-0.5 flex-shrink-0 text-amber-500" />
              <span>Products are reviewed by the Hustlecare team before going live — usually within 1–2 business days.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky mobile publish bar */}
      <div className="fixed inset-x-0 z-20 flex gap-2.5 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-lg lg:hidden"
        style={{ bottom: 'calc(var(--vd-bottom-nav-h, 64px) + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={loading || !form.name}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 disabled:opacity-50"
        >
          <Save size={14} /> Draft
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={!canSubmit}
          className="flex flex-[2] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-40"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          Submit for Review
        </button>
      </div>
    </div>
  );
}