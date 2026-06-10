'use client';
// app/vendor/dashboard/products/new/page.tsx
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Save, Send,
  Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';

type Template = {
  id: number;
  name: string;
  category: string;
  necessity: string;
  _count?: { businesses: number };
};

type ProductFormProps = {
  productId?: number;
};

export default function NewProductPage() {
  return <ProductForm />;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router   = useRouter();
  const isEditing = !!productId;

  const [templates,       setTemplates]       = useState<Template[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [loadingProduct,  setLoadingProduct]  = useState(isEditing);
  // Checking suspension before rendering the form
  const [checkingAccess,  setCheckingAccess]  = useState(!isEditing);
  const [error,           setError]           = useState('');
  const [saved,           setSaved]           = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    priceMin: '',
    priceMax: '',
    currency: 'KES',
    image: '',
    url: '',
    sku: '',
    stock: '',
    templateId: '',
    usePriceRange: false,
  });

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
        name:          p.name          ?? '',
        description:   p.description   ?? '',
        price:         p.price?.toString()    ?? '',
        priceMin:      p.priceMin?.toString() ?? '',
        priceMax:      p.priceMax?.toString() ?? '',
        currency:      p.currency      ?? 'KES',
        image:         p.image         ?? '',
        url:           p.url           ?? '',
        sku:           p.sku           ?? '',
        stock:         p.stock?.toString() ?? '',
        templateId:    p.templateId?.toString() ?? '',
        usePriceRange: !!(p.priceMin || p.priceMax),
      });
    } catch {
      router.push('/vendor/dashboard/products');
    } finally { setLoadingProduct(false); }
  }, [productId, router]);

  useEffect(() => {
    // On the NEW product page, verify the vendor is not suspended before
    // rendering the form. If suspended, redirect to dashboard immediately.
    if (!isEditing) {
      fetch('/api/vendors/profile')
        .then(r => r.ok ? r.json() : null)
        .then(profile => {
          if (profile?.status === 'SUSPENDED') {
            router.replace('/vendor/dashboard');
          } else {
            setCheckingAccess(false);
          }
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
        name:        form.name,
        description: form.description || null,
        price:       form.usePriceRange ? null : (form.price    ? parseFloat(form.price)    : null),
        priceMin:    form.usePriceRange ? (form.priceMin ? parseFloat(form.priceMin) : null) : null,
        priceMax:    form.usePriceRange ? (form.priceMax ? parseFloat(form.priceMax) : null) : null,
        currency:    form.currency,
        image:       form.image   || null,
        url:         form.url     || null,
        sku:         form.sku     || null,
        stock:       form.stock   ? parseInt(form.stock) : null,
        templateId:  form.templateId ? parseInt(form.templateId) : null,
        submitForReview,
      };

      const url    = isEditing ? `/api/vendors/products/${productId}` : '/api/vendors/products';
      const method = isEditing ? 'PATCH' : 'POST';

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      // The POST handler returns VENDOR_SUSPENDED if the vendor was suspended
      // between page load and form submission (e.g. two tabs open).
      if (!res.ok) {
        if (data.code === 'VENDOR_SUSPENDED') {
          router.replace('/vendor/dashboard');
          return;
        }
        throw new Error(data.error);
      }

      setSaved(true);
      setTimeout(() => router.push('/vendor/dashboard/products'), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const selectedTemplate      = templates.find(t => t.id.toString() === form.templateId);
  const templatesByCategory   = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  // Show a spinner while verifying suspension status (new product only)
  if (checkingAccess || loadingProduct) {
    return (
      <div style={S.loadWrap}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
      </div>
    );
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={S.pageHeader}>
        <Link href="/vendor/dashboard/products" style={S.backLink}>
          <ChevronLeft size={15} /> Products
        </Link>
        <h1 style={S.h1}>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        <p style={S.subtitle}>
          {isEditing
            ? 'Update your product details. Changes require re-submission for review.'
            : 'Add a product to a requirement so entrepreneurs can find and purchase it.'}
        </p>
      </div>

      {error && (
        <div style={S.errorBanner}>
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {saved && (
        <div style={S.successBanner}>
          <CheckCircle2 size={14} /> Saved! Redirecting…
        </div>
      )}

      <div style={S.layout}>
        {/* Main form */}
        <div style={S.mainCol}>

          {/* Requirement linking */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Requirement</h2>
              <p style={S.cardDesc}>Which business requirement does this product fulfil? This determines where your product appears in the marketplace.</p>
            </div>

            {loadingTemplates ? (
              <div style={S.skeleton} />
            ) : (
              <div style={S.fieldGroup}>
                <label style={S.label}>Select Requirement <span style={S.req}>*</span></label>
                <select
                  style={S.select}
                  value={form.templateId}
                  onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}
                >
                  <option value="">— Choose a requirement —</option>
                  {Object.entries(templatesByCategory).map(([category, items]) => (
                    <optgroup key={category} label={category}>
                      {items.map(t => (
                        <option key={t.id} value={t.id.toString()}>{t.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                {selectedTemplate && (
                  <div style={S.templatePreview}>
                    <div style={S.templatePreviewName}>{selectedTemplate.name}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ ...S.catTag, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>
                        {selectedTemplate.category}
                      </span>
                      <span style={{
                        ...S.catTag,
                        background: selectedTemplate.necessity === 'Required' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color:      selectedTemplate.necessity === 'Required' ? '#34d399'              : '#fbbf24',
                      }}>
                        {selectedTemplate.necessity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#55556e', margin: '0.35rem 0 0' }}>
                      Your product will appear to entrepreneurs starting any business that includes this requirement.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Basic info */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Product Details</h2>
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Product Name <span style={S.req}>*</span></label>
              <input style={S.input} placeholder="e.g. HP Pavilion 15 Laptop" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Description</label>
              <textarea style={S.textarea} rows={4}
                placeholder="Describe the product — specs, features, what makes it great for new entrepreneurs…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div style={S.twoCol}>
              <div style={S.fieldGroup}>
                <label style={S.label}>Product Image URL</label>
                <input style={S.input} placeholder="https://…" value={form.image}
                  onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Product URL / Buy Link</label>
                <input style={S.input} placeholder="https://…" value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Pricing</h2>
            </div>

            <div style={S.fieldGroup}>
              <label style={S.label}>Currency</label>
              <select style={{ ...S.select, maxWidth: 160 }} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {['KES', 'USD', 'UGX', 'TZS', 'NGN', 'ZAR', 'GHS'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={S.fieldGroup}>
              <label style={{ ...S.label, gap: '0.75rem' }}>
                Price
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, fontSize: '0.78rem' }}>
                  <input type="checkbox" checked={form.usePriceRange}
                    onChange={e => setForm(f => ({ ...f, usePriceRange: e.target.checked }))}
                    style={{ accentColor: '#f59e0b', cursor: 'pointer' }} />
                  Use price range
                </label>
              </label>

              {!form.usePriceRange ? (
                <input style={S.input} type="number" placeholder="0.00" value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              ) : (
                <div style={S.twoCol}>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.7rem' }}>Min</label>
                    <input style={S.input} type="number" placeholder="0.00" value={form.priceMin}
                      onChange={e => setForm(f => ({ ...f, priceMin: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ ...S.label, fontSize: '0.7rem' }}>Max</label>
                    <input style={S.input} type="number" placeholder="0.00" value={form.priceMax}
                      onChange={e => setForm(f => ({ ...f, priceMax: e.target.value }))} />
                  </div>
                </div>
              )}
              <span style={S.hint}>
                Price ranges are useful for products with variable specs or configurations.
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={S.sideCol}>

          {/* Publish card */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Publish</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <button
                style={{ ...S.btnPrimary, width: '100%', justifyContent: 'center', opacity: (loading || !form.name || !form.templateId) ? 0.5 : 1 }}
                onClick={() => handleSave(true)}
                disabled={loading || !form.name || !form.templateId}
              >
                {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                Submit for Review
              </button>
              <button
                style={{ ...S.btnSecondary, width: '100%', justifyContent: 'center' }}
                onClick={() => handleSave(false)}
                disabled={loading || !form.name}
              >
                <Save size={14} /> Save as Draft
              </button>
            </div>

            <div style={{ marginTop: '0.85rem', padding: '0.75rem', borderRadius: 8, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)', fontSize: '0.75rem', color: '#9494b0', lineHeight: 1.6 }}>
              Submitted products are reviewed by the Hustlecare team before appearing in the marketplace. Usually within 1–2 business days.
            </div>
          </div>

          {/* Inventory */}
          <div style={S.card}>
            <div style={S.cardHeader}>
              <h2 style={S.cardTitle}>Inventory</h2>
            </div>
            <div style={S.twoCol}>
              <div style={S.fieldGroup}>
                <label style={S.label}>SKU</label>
                <input style={S.input} placeholder="Optional" value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div style={S.fieldGroup}>
                <label style={S.label}>Stock</label>
                <input style={S.input} type="number" placeholder="Unlimited" value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>
            <span style={S.hint}>Leave stock blank for unlimited / not tracked.</span>
          </div>

          {/* How it works */}
          <div style={{ ...S.card, background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.15)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.6rem' }}>
              How marketplace tagging works
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#55556e', lineHeight: 1.7, margin: 0 }}>
              When your product is approved, it&rsquo;s automatically tagged to every business that uses the requirement you selected.
              For example, a product under <em style={{ color: '#9494b0' }}>Laptop</em> appears to anyone starting a <em style={{ color: '#9494b0' }}>Graphic Design Agency</em>, <em style={{ color: '#9494b0' }}>Freelance Writing</em>, or any other business that needs a laptop.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  a { text-decoration: none; color: inherit; }
  select option { background: #1a1a24; }
  optgroup { background: #1a1a24; }
`;

const S: Record<string, React.CSSProperties> = {
  page:                { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 960 },
  loadWrap:            { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 },
  pageHeader:          { marginBottom: '1.75rem' },
  backLink:            { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: '#55556e', marginBottom: '0.75rem' },
  h1:                  { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' },
  subtitle:            { fontSize: '0.82rem', color: '#55556e', lineHeight: 1.6 },
  errorBanner:         { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.83rem', marginBottom: '1.25rem' },
  successBanner:       { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '0.83rem', marginBottom: '1.25rem' },
  layout:              { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' },
  mainCol:             { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  sideCol:             { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  card:                { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.25rem' },
  cardHeader:          { marginBottom: '1rem' },
  cardTitle:           { fontSize: '0.9rem', fontWeight: 700, color: '#e2e2f0', marginBottom: '0.2rem' },
  cardDesc:            { fontSize: '0.78rem', color: '#55556e', lineHeight: 1.6 },
  fieldGroup:          { marginBottom: '1rem' },
  label:               { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: '#9494b0', marginBottom: '0.35rem', textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  req:                 { color: '#f87171' },
  input:               { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', outline: 'none' },
  textarea:            { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', outline: 'none', resize: 'vertical' as const, lineHeight: 1.6 },
  select:              { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.6rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem', outline: 'none', cursor: 'pointer' },
  hint:                { fontSize: '0.72rem', color: '#55556e', marginTop: '0.3rem', display: 'block', lineHeight: 1.5 },
  twoCol:              { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  skeleton:            { height: 48, borderRadius: 8, background: 'rgba(255,255,255,0.04)' },
  templatePreview:     { marginTop: '0.6rem', padding: '0.75rem 0.9rem', borderRadius: 9, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' },
  templatePreviewName: { fontSize: '0.86rem', fontWeight: 600, color: '#e2e2f0', marginBottom: '0.4rem' },
  catTag:              { display: 'inline-flex', padding: '0.15rem 0.55rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700 },
  btnPrimary:          { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.2rem', borderRadius: 9, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0a0f', fontSize: '0.86rem', fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(245,158,11,0.2)' },
  btnSecondary:        { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.1rem', borderRadius: 9, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer' },
};