/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ProductFormModal.tsx (admin)
// NOTE: components/shared/ProductForm.tsx also needs a one-line type fix —
// see the accompanying message for the exact change.
'use client';

import { useEffect, useRef, useState } from 'react';
import { Product, VendorTuple } from 'types/vendor';
import { RequirementOption } from './shared/RequirementPicker';
import ProductForm, {
  EMPTY_PRODUCT_FORM, ProductFormValues, BulkTier, SoftwarePackageRow, BillingPeriodValue, MARKET_CURRENCY,
} from './shared/ProductForm';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  fetchProducts: () => void;
  editingProduct: Product | null;
  vendors: VendorTuple[];
};

// Currencies offered in the Pricing section's currency dropdown — kept in
// sync with the <select> in ProductForm.tsx. Used to sanity-check a
// currency pulled from a fetched product page before we auto-fill it;
// an unrecognized value (e.g. a site using a currency code we don't
// support) is dropped rather than silently setting an invalid currency.
const SUPPORTED_CURRENCIES = ['KES', 'USD', 'UGX', 'TZS', 'NGN', 'ZAR', 'GHS'];

// Recently-used vendor/requirement — persisted client-side only (a per-
// browser convenience default, not a real setting), so admins batch-adding
// several products from the same vendor/requirement don't re-pick every
// time. Only ever applied when opening the blank form for a brand-new
// product — never touches an existing product being edited.
const LAST_VENDOR_KEY = 'admin_products_last_vendor_id';
const LAST_REQUIREMENT_KEY = 'admin_products_last_requirement_id';

// Common words that carry no signal for matching a product name/description
// against a requirement name — excluding them keeps a shared "the"/"for"
// from counting as a match.
const STOPWORDS = new Set(['the', 'for', 'and', 'of', 'a', 'an', 'in', 'to', 'with', 'on', 'by', 'or']);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Suggests the best-matching requirement for a fetched product's name +
// description, by significant-word overlap against each requirement's name.
// Deliberately conservative: requires at least half of the REQUIREMENT's
// own significant words to appear in the product text, so a single generic
// shared word (e.g. "certificate") can't trigger a wrong pick on its own.
// Returns null rather than a low-confidence guess when nothing clears that
// bar — this only ever pre-fills a blank field, so a missed suggestion just
// leaves the admin to pick manually, same as today.
function suggestRequirement(requirements: RequirementOption[], text: string): RequirementOption | null {
  const textWords = new Set(significantWords(text));
  if (textWords.size === 0) return null;

  let best: RequirementOption | null = null;
  let bestScore = 0;
  for (const req of requirements) {
    const reqWords = significantWords(req.name);
    if (reqWords.length === 0) continue;
    const matches = reqWords.filter((w) => textWords.has(w)).length;
    const score = matches / reqWords.length;
    if (matches > 0 && score > bestScore) {
      bestScore = score;
      best = req;
    }
  }
  return bestScore >= 0.5 ? best : null;
}

// Strips protocol/www/path so a vendor's stored website and a product
// link can be compared on hostname alone (e.g. "https://www.acme.com/"
// vs "https://acme.com/shop/widget?ref=123" should both normalize to
// "acme.com"). Returns null for anything unparseable rather than
// throwing — a bad vendor.website value should just fail to match, not
// break the fetch.
function normalizeHost(raw: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw.match(/^https?:\/\//i) ? raw : `https://${raw}`);
    return url.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return null;
  }
}

export default function ProductFormModal({ open, setOpen, fetchProducts, editingProduct, vendors }: Props) {
  const [form, setForm] = useState<ProductFormValues>(EMPTY_PRODUCT_FORM);
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>([]);
  const [packages, setPackages] = useState<SoftwarePackageRow[]>([]);
  const [requirements, setRequirements] = useState<RequirementOption[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  // "Fetch details" (generic OG / schema.org scraper) state — admin-only,
  // wired into ProductForm's Buy Link field.
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [fetchMetadataError, setFetchMetadataError] = useState<string | null>(null);
  const [fetchMetadataNotice, setFetchMetadataNotice] = useState<string | null>(null);

  const isShellProduct = !!editingProduct?.isFeeScheduleShell;

  // Same lookup ProductForm does internally — needed here too because
  // validation and payload-building both need to know whether the
  // selected requirement is Software, and ProductForm doesn't expose that
  // back up to us.
  const selectedRequirement = requirements.find((r) => r.id.toString() === form.templateId);
  const isSoftwareRequirement = selectedRequirement?.category === 'Software';

  // If the admin filled in package rows, then switched the requirement to
  // something other than Software (or cleared it), those rows would
  // silently be dropped on save — isSoftwareRequirement just becomes
  // false and the payload stops sending them. Surface that instead of
  // letting it happen quietly.
  const hasOrphanedPackageData = !isSoftwareRequirement && packages.some((pkg) => pkg.name.trim() || pkg.price.trim());

  useEffect(() => {
    if (!open) return;
    setLoadingRequirements(true);
    fetch('/api/requirements')
      .then((r) => r.ok && r.json())
      .then((d) => {
        const list: RequirementOption[] = Array.isArray(d) ? d : [];
        setRequirements(list);

        // Recently-used requirement default — new product only, and only
        // if that requirement still exists (it may have been deprecated
        // since the last time it was picked) and the form hasn't already
        // gotten a templateId from somewhere else (e.g. the admin already
        // clicked into the picker before this fetch resolved).
        if (!editingProduct) {
          const lastTemplateId = localStorage.getItem(LAST_REQUIREMENT_KEY);
          if (lastTemplateId && list.some((r) => String(r.id) === lastTemplateId)) {
            setForm((f) => (f.templateId ? f : { ...f, templateId: lastTemplateId }));
          }
        }
      })
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

        validityValue: p.validityValue?.toString() || '',
        validityUnit: p.validityUnit || 'years',
        processingTimeMinDays: p.processingTimeMinDays?.toString() || '',
        processingTimeMaxDays: p.processingTimeMaxDays?.toString() || '',

        softwarePackagesEnabled: Array.isArray(p.packages) && p.packages.length > 0,
        billingPeriod: (p.billingPeriod as BillingPeriodValue) || 'MONTHLY',
      });
      setBulkTiers(
        Array.isArray(p.bulkPricing)
          ? p.bulkPricing.map((b: { minQty?: number; price?: number }) => ({
              minQty: b.minQty?.toString() ?? '',
              price: b.price?.toString() ?? '',
            }))
          : []
      );
      setPackages(
        Array.isArray(p.packages)
          ? p.packages
              .slice()
              .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
              .map((pkg: any) => ({
                name: pkg.name || '',
                description: pkg.description || '',
                price: pkg.price != null ? String(pkg.price) : '',
                billingPeriod: (pkg.billingPeriod as BillingPeriodValue) || 'MONTHLY',
                features: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
                isPopular: !!pkg.isPopular,
              }))
          : []
      );
    } else {
      // Recently-used vendor default — only if that vendor is still in the
      // active list (it may have been deleted/suspended since last pick).
      const lastVendorId = localStorage.getItem(LAST_VENDOR_KEY);
      const vendorStillExists = !!lastVendorId && vendors.some(([id]) => id === lastVendorId);
      setForm({ ...EMPTY_PRODUCT_FORM, vendorId: vendorStillExists ? lastVendorId! : '' });
      setBulkTiers([]);
      setPackages([]);
    }
    setErrors({});
    setFetchMetadataError(null);
    setFetchMetadataNotice(null);
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [open, editingProduct, vendors]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Product name is required';

    // Shell products (county-fee requirements) have no price/vendor/
    // requirement to validate — their price lives in LegalFeeSchedule,
    // and their vendor/requirement links are fixed at creation. Requiring
    // a price here is exactly what previously blocked editing them.
    if (!isShellProduct) {
      const priceIsDerivedFromPackages = isSoftwareRequirement && form.softwarePackagesEnabled;

      // Skip the flat-price check entirely when packages own the price —
      // Product.price gets computed server-side from the packages below.
      if (!priceIsDerivedFromPackages && !form.usePriceRange && (!form.price.trim() || isNaN(Number(form.price)) || Number(form.price) < 0)) {
        errs.price = 'Enter a valid price';
      }
      if (!form.vendorId) errs.vendorId = 'Select a vendor';
      if (!form.templateId) errs.templateId = 'Select a requirement';

      if (priceIsDerivedFromPackages) {
        const validPackages = packages.filter((pkg) => pkg.name.trim() && pkg.price.trim() && !isNaN(Number(pkg.price)));
        if (validPackages.length === 0) {
          errs.name = errs.name || 'Add at least one package with a name and price, or turn off "multiple packages"';
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const priceIsDerivedFromPackages = isSoftwareRequirement && form.softwarePackagesEnabled;

      // Shell products: only send the fields that are actually editable
      // for them (name, description, image, url). Deliberately omit
      // price/priceMin/priceMax/vendorId/templateId/condition/warranty/
      // delivery/legal fields — sending them as e.g. price: 0 would give
      // the shell product a real, non-null price, which would make it
      // start showing up as a normal $0 product everywhere the app
      // filters on "price is not null".
      const payload = isShellProduct
        ? {
            name: form.name,
            description: form.description,
            image: form.image,
            url: form.url,
          }
        : {
            ...form,
            // Price is server-derived (lowest monthly-equivalent) when
            // packages are enabled — omit it so the API's own
            // calculation is what actually gets stored, never a stale
            // client value.
            price: priceIsDerivedFromPackages ? undefined : (form.usePriceRange ? null : Number(form.price)),
            priceMin: !priceIsDerivedFromPackages && form.usePriceRange && form.priceMin ? Number(form.priceMin) : null,
            priceMax: !priceIsDerivedFromPackages && form.usePriceRange && form.priceMax ? Number(form.priceMax) : null,
            sku: form.sku || null,
            stock: form.stock ? parseInt(form.stock) : null,
            vendorId: Number(form.vendorId),
            templateId: Number(form.templateId),
            bulkPricing: form.bulkPricingEnabled
              ? bulkTiers
                  .filter((t) => t.minQty && t.price)
                  .map((t) => ({ minQty: parseInt(t.minQty), price: parseFloat(t.price) }))
              : [],

            validityValue: form.validityValue ? Number(form.validityValue) : null,
            validityUnit: form.validityValue ? form.validityUnit : null,
            processingTimeMinDays: form.processingTimeMinDays ? parseInt(form.processingTimeMinDays) : null,
            processingTimeMaxDays: form.processingTimeMaxDays ? parseInt(form.processingTimeMaxDays) : null,

            // Simple-case billing cadence ONLY ever applies to Software
            // products with no packages. Deliberately gated on
            // isSoftwareRequirement here, not just priceIsDerivedFromPackages —
            // form.billingPeriod defaults to 'MONTHLY' in EMPTY_PRODUCT_FORM
            // and that field is never shown/editable for non-Software
            // requirements, so falling through to form.billingPeriod for
            // e.g. an Equipment product would silently persist a stale
            // "MONTHLY" value and make the product card render a bogus
            // "/mo" suffix. This was the root cause of that bug — do not
            // relax this back to `priceIsDerivedFromPackages ? null : form.billingPeriod`.
            billingPeriod: isSoftwareRequirement
              ? (priceIsDerivedFromPackages ? null : form.billingPeriod)
              : null,
            packages: priceIsDerivedFromPackages
              ? packages
                  .filter((pkg) => pkg.name.trim() && pkg.price.trim() && !isNaN(Number(pkg.price)))
                  .map((pkg, i) => ({
                    name: pkg.name.trim(),
                    description: pkg.description.trim() || null,
                    price: Number(pkg.price),
                    billingPeriod: pkg.billingPeriod,
                    features: pkg.features
                      .split('\n')
                      .map((line) => line.trim())
                      .filter(Boolean),
                    isPopular: pkg.isPopular,
                    displayOrder: i,
                  }))
              : [],
          };

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      // Remember this vendor/requirement as the default for the next
      // brand-new product — shell products have no real vendor/requirement
      // to remember. localStorage failures (private browsing, quota) are
      // non-fatal — the save itself already succeeded.
      if (!isShellProduct) {
        try {
          if (form.vendorId) localStorage.setItem(LAST_VENDOR_KEY, form.vendorId);
          if (form.templateId) localStorage.setItem(LAST_REQUIREMENT_KEY, form.templateId);
        } catch { /* non-fatal */ }
      }

      setOpen(false);
      fetchProducts();
    } catch (e) {
      setErrors({ name: e instanceof Error ? e.message : 'Failed to save. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Generic "Fetch details" — hits /api/admin/products/fetch-metadata,
  // which scrapes OG tags / schema.org JSON-LD from the pasted product
  // link. Only ever fills fields the admin hasn't already typed into
  // (never clobbers existing/edited data), and separately tries to
  // auto-select a vendor by matching the resolved product URL's hostname
  // against each vendor's stored website — also only when vendorId is
  // still blank.
  const handleFetchMetadata = async () => {
    if (!form.url.trim()) return;
    setFetchingMetadata(true);
    setFetchMetadataError(null);
    setFetchMetadataNotice(null);
    try {
      const res = await fetch(`/api/admin/products/fetch-metadata?url=${encodeURIComponent(form.url.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch product details.');

      // Match on the *resolved* URL (post-redirect) where available — a
      // shortened/tracking link's raw hostname won't match the vendor's
      // real domain, but where it actually lands will.
      const productHost = normalizeHost(data.finalUrl || form.url);
      const matchedVendor = productHost
        ? vendors.find(([, , website]) => website && normalizeHost(website) === productHost)
        : undefined;

      // Requirement suggestion runs off the fetched name + description —
      // whichever the form doesn't already have filled wins out as the
      // best text signal (matches the same "prefer existing, fall back to
      // fetched" logic used when actually filling those fields below).
      const suggestionText = [form.name.trim() || data.name, form.description.trim() || data.description]
        .filter(Boolean)
        .join(' ');
      const suggestedRequirement = suggestionText
        ? suggestRequirement(requirements, suggestionText)
        : null;

      setForm((f) => {
        // Only treat this as "we're assigning the vendor/requirement" if
        // the admin hadn't already picked one — never silently reassign an
        // existing selection, same rule as every other autofilled field.
        const willAssignVendor = !f.vendorId && !!matchedVendor;
        const willAssignRequirement = !f.templateId && !!suggestedRequirement;
        const shouldFillPrice = !f.price.trim() && !f.usePriceRange && !!data.price;

        // Vendor market beats scraped page currency when we're the ones
        // assigning the vendor — a vendor's own market (KE/US) is a more
        // reliable signal for which currency this listing should use than
        // whatever currency happened to be on the source page (e.g. a KE
        // vendor's site might still show USD in its metadata).
        const marketCurrency =
          willAssignVendor && matchedVendor?.[3] ? MARKET_CURRENCY[matchedVendor[3]] : undefined;

        return {
          ...f,
          name: f.name.trim() ? f.name : data.name || f.name,
          description: f.description.trim() ? f.description : data.description || f.description,
          image: f.image.trim() ? f.image : data.image || f.image,
          price: shouldFillPrice ? data.price : f.price,
          currency: marketCurrency
            ? marketCurrency
            : shouldFillPrice && SUPPORTED_CURRENCIES.includes(data.currency)
              ? data.currency
              : f.currency,
          vendorId: willAssignVendor ? matchedVendor![0] : f.vendorId,
          templateId: willAssignRequirement ? String(suggestedRequirement!.id) : f.templateId,
        };
      });

      const notices: string[] = [];
      if (matchedVendor) notices.push(`Vendor auto-selected: ${matchedVendor[1]} (matched by link domain)`);
      if (suggestedRequirement && !form.templateId) {
        notices.push(`Requirement suggested: ${suggestedRequirement.name} — please confirm this is correct`);
      }
      if (notices.length) setFetchMetadataNotice(notices.join(' · '));
    } catch (e) {
      setFetchMetadataError(e instanceof Error ? e.message : 'Failed to fetch product details.');
    } finally {
      setFetchingMetadata(false);
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
            <div className="modal-subtitle">
              {isShellProduct
                ? 'System-managed county-fee requirement — only name, description, image, and apply link are editable'
                : 'Admin-managed product — requires a vendor and requirement'}
            </div>
          </div>
          <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="modal-divider" />
        <div className="modal-body">
          {hasOrphanedPackageData && (
            <div
              className="mb-3 rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}
            >
              This product has software package data entered, but the selected requirement isn&apos;t Software —
              those packages won&apos;t be saved. Switch the requirement back to a Software one to keep them.
            </div>
          )}
          {fetchMetadataNotice && (
            <div
              className="mb-3 rounded-lg border px-3 py-2 text-xs"
              style={{ borderColor: 'rgba(52, 211, 153, 0.4)', backgroundColor: 'rgba(52, 211, 153, 0.08)', color: '#34d399' }}
            >
              {fetchMetadataNotice}
            </div>
          )}
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
            packages={packages}
            setPackages={setPackages}
            isFeeScheduleShell={isShellProduct}
            onFetchMetadata={handleFetchMetadata}
            fetchingMetadata={fetchingMetadata}
            fetchMetadataError={fetchMetadataError}
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