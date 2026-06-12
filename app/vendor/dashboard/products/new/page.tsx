'use client';
// app/vendor/dashboard/products/new/page.tsx
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, Save, Send, Loader2, AlertCircle, CheckCircle2,
  Tag, Package, DollarSign, Layers, Info,
} from 'lucide-react';

type Template = {
  id: number;
  name: string;
  category: string;
  necessity: string;
  _count?: { businesses: number };
};

type ProductFormProps = { productId?: number };

export default function NewProductPage() {
  return <ProductForm />;
}

export function ProductForm({ productId }: ProductFormProps) {
  const router    = useRouter();
  const isEditing = !!productId;

  const [templates,       setTemplates]       = useState<Template[]>([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingTemplates,setLoadingTemplates] = useState(true);
  const [loadingProduct,  setLoadingProduct]  = useState(isEditing);
  const [checkingAccess,  setCheckingAccess]  = useState(!isEditing);
  const [error,           setError]           = useState('');
  const [saved,           setSaved]           = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', price: '', priceMin: '', priceMax: '',
    currency: 'KES', image: '', url: '', sku: '', stock: '',
    templateId: '', usePriceRange: false,
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
        name: p.name ?? '', description: p.description ?? '',
        price: p.price?.toString() ?? '', priceMin: p.priceMin?.toString() ?? '', priceMax: p.priceMax?.toString() ?? '',
        currency: p.currency ?? 'KES', image: p.image ?? '', url: p.url ?? '',
        sku: p.sku ?? '', stock: p.stock?.toString() ?? '',
        templateId: p.templateId?.toString() ?? '',
        usePriceRange: !!(p.priceMin || p.priceMax),
      });
    } catch { router.push('/vendor/dashboard/products'); }
    finally { setLoadingProduct(false); }
  }, [productId, router]);

  useEffect(() => {
    if (!isEditing) {
      fetch('/api/vendors/profile')
        .then(r => r.ok ? r.json() : null)
        .then(p => { if (p?.status === 'SUSPENDED') router.replace('/vendor/dashboard'); else setCheckingAccess(false); })
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
      };
      const url    = isEditing ? `/api/vendors/products/${productId}` : '/api/vendors/products';
      const method = isEditing ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) {
        if (data.code === 'VENDOR_SUSPENDED') { router.replace('/vendor/dashboard'); return; }
        throw new Error(data.error);
      }
      setSaved(true);
      setTimeout(() => router.push('/vendor/dashboard/products'), 800);
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong'); }
    finally { setLoading(false); }
  }

  const selectedTemplate    = templates.find(t => t.id.toString() === form.templateId);
  const templatesByCategory = templates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  const canSubmit = !loading && !!form.name && !!form.templateId;

  if (checkingAccess || loadingProduct) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
        <Loader2 size={24} className="vd-spin" style={{ color: '#f59e0b' }} />
        <style>{CSS}</style>
      </div>
    );
  }

  return (
    <div style={F.page}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={F.pageHead}>
        <Link href="/vendor/dashboard/products" style={F.backLink}>
          <ChevronLeft size={14} /> Back to Products
        </Link>
        <h1 style={F.h1}>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        <p style={F.subtitle}>
          {isEditing
            ? 'Update your product. Changes require re-submission for review.'
            : 'Add a product to a requirement so entrepreneurs can find and buy it.'}
        </p>
      </div>

      {/* Banners */}
      {error && (
        <div style={F.errorBanner}>
          <AlertCircle size={13} /> {error}
        </div>
      )}
      {saved && (
        <div style={F.successBanner}>
          <CheckCircle2 size={13} /> Saved — redirecting…
        </div>
      )}

      <div style={F.layout} className="vd-form-layout">

        {/* Main */}
        <div style={F.mainCol}>

          {/* Requirement */}
          <div style={F.card}>
            <div style={F.cardHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Tag size={14} style={{ color: '#f59e0b' }} />
                <h2 style={F.cardTitle}>Requirement</h2>
              </div>
              <p style={F.cardDesc}>Which business requirement does this product fulfil?</p>
            </div>
            {loadingTemplates ? (
              <div style={F.skeleton} />
            ) : (
              <div style={F.field}>
                <label style={F.label}>Select Requirement <span style={{ color: '#f87171' }}>*</span></label>
                <select style={F.select} value={form.templateId} onChange={e => setForm(f => ({ ...f, templateId: e.target.value }))}>
                  <option value="">— Choose a requirement —</option>
                  {Object.entries(templatesByCategory).map(([cat, items]) => (
                    <optgroup key={cat} label={cat}>
                      {items.map(t => <option key={t.id} value={t.id.toString()}>{t.name}</option>)}
                    </optgroup>
                  ))}
                </select>
                {selectedTemplate && (
                  <div style={F.templatePreview}>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: '#e2e2f0', marginBottom: '0.35rem' }}>{selectedTemplate.name}</div>
                    <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.4rem' }}>
                      <span style={{ ...F.pill, background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}>{selectedTemplate.category}</span>
                      <span style={{ ...F.pill, background: selectedTemplate.necessity === 'Required' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: selectedTemplate.necessity === 'Required' ? '#34d399' : '#fbbf24' }}>
                        {selectedTemplate.necessity}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.74rem', color: '#55556e', lineHeight: 1.5, margin: 0 }}>
                      Your product will appear to any entrepreneur whose business includes this requirement.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div style={F.card}>
            <div style={F.cardHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={14} style={{ color: '#818cf8' }} />
                <h2 style={F.cardTitle}>Product Details</h2>
              </div>
            </div>
            <div style={F.field}>
              <label style={F.label}>Product Name <span style={{ color: '#f87171' }}>*</span></label>
              <input style={F.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. HP Pavilion 15 Laptop" />
            </div>
            <div style={F.field}>
              <label style={F.label}>Description</label>
              <textarea style={F.textarea} rows={4} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Specs, features, and why entrepreneurs should choose this product…" />
            </div>
            <div style={F.twoCol} className="vd-two-col">
              <div style={F.field}>
                <label style={F.label}>Product Image URL</label>
                <input style={F.input} value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://…" />
              </div>
              <div style={F.field}>
                <label style={F.label}>Product / Buy Link</label>
                <input style={F.input} value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://…" />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={F.card}>
            <div style={F.cardHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={14} style={{ color: '#34d399' }} />
                <h2 style={F.cardTitle}>Pricing</h2>
              </div>
            </div>
            <div style={F.twoCol} className="vd-two-col">
              <div style={F.field}>
                <label style={F.label}>Currency</label>
                <select style={F.select} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {['KES', 'USD', 'UGX', 'TZS', 'NGN', 'ZAR', 'GHS'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={F.field}>
                <label style={F.label}>
                  Price type
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontWeight: 400, textTransform: 'none' as const, letterSpacing: 0, fontSize: '0.77rem', marginLeft: '0.5rem' }}>
                    <input type="checkbox" checked={form.usePriceRange} onChange={e => setForm(f => ({ ...f, usePriceRange: e.target.checked }))}
                      style={{ accentColor: '#f59e0b', cursor: 'pointer' }} />
                    Use range
                  </label>
                </label>
                {!form.usePriceRange ? (
                  <input style={F.input} type="number" placeholder="0.00" value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                ) : (
                  <div style={F.twoCol} className="vd-two-col">
                    <div>
                      <div style={{ ...F.label, marginBottom: '0.2rem' }}>Min</div>
                      <input style={F.input} type="number" placeholder="0.00" value={form.priceMin}
                        onChange={e => setForm(f => ({ ...f, priceMin: e.target.value }))} />
                    </div>
                    <div>
                      <div style={{ ...F.label, marginBottom: '0.2rem' }}>Max</div>
                      <input style={F.input} type="number" placeholder="0.00" value={form.priceMax}
                        onChange={e => setForm(f => ({ ...f, priceMax: e.target.value }))} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={F.sideCol}>

          {/* Publish */}
          <div style={F.card}>
            <div style={{ ...F.cardHead, marginBottom: '0.85rem' }}>
              <h2 style={F.cardTitle}>Publish</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <button
                style={{ ...F.btnPrimary, width: '100%', justifyContent: 'center', opacity: canSubmit ? 1 : 0.5 }}
                onClick={() => handleSave(true)}
                disabled={!canSubmit}
              >
                {loading ? <Loader2 size={13} className="vd-spin" /> : <Send size={13} />}
                Submit for Review
              </button>
              <button
                style={{ ...F.btnSecondary, width: '100%', justifyContent: 'center' }}
                onClick={() => handleSave(false)}
                disabled={loading || !form.name}
              >
                <Save size={13} /> Save as Draft
              </button>
            </div>
            <div style={F.reviewNote}>
              <Info size={12} style={{ flexShrink: 0, marginTop: 1, color: '#55556e' }} />
              <span>Products are reviewed by the Hustlecare team before going live — usually within 1–2 business days.</span>
            </div>
          </div>

          {/* Inventory */}
          <div style={F.card}>
            <div style={{ ...F.cardHead, marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={13} style={{ color: '#9494b0' }} />
                <h2 style={F.cardTitle}>Inventory</h2>
              </div>
            </div>
            <div style={F.twoCol} className="vd-two-col">
              <div style={F.field}>
                <label style={F.label}>SKU</label>
                <input style={F.input} placeholder="Optional" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
              </div>
              <div style={F.field}>
                <label style={F.label}>Stock</label>
                <input style={F.input} type="number" placeholder="Unlimited" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
              </div>
            </div>
            <span style={F.hint}>Leave stock blank for unlimited / untracked.</span>
          </div>

          {/* How it works */}
          <div style={{ ...F.card, background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.14)' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.55rem' }}>How tagging works</h3>
            <p style={{ fontSize: '0.74rem', color: '#55556e', lineHeight: 1.7, margin: 0 }}>
              Once approved, your product is automatically shown to every entrepreneur starting a business that includes the requirement you selected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  @keyframes vd-spin { to { transform: rotate(360deg); } }
  .vd-spin { animation: vd-spin 1s linear infinite; }
  a { text-decoration: none; color: inherit; }
  select option, optgroup { background: #1a1a24; }

  .vd-form-layout { display: grid; grid-template-columns: 1fr 300px; gap: 1.25rem; align-items: start; }
  .vd-two-col     { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  @media (max-width: 860px) {
    .vd-form-layout { grid-template-columns: 1fr !important; }
  }
  @media (max-width: 520px) {
    .vd-two-col { grid-template-columns: 1fr !important; }
  }
`;

const F: Record<string, React.CSSProperties> = {
  page:           { fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5', maxWidth: 1000, paddingBottom: '2rem' },
  pageHead:       { marginBottom: '1.75rem' },
  backLink:       { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: '#55556e', marginBottom: '0.7rem' },
  h1:             { fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.025em', marginBottom: '0.25rem', color: '#f0f0f5' },
  subtitle:       { fontSize: '0.81rem', color: '#55556e', lineHeight: 1.6 },
  errorBanner:    { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.09)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '1.25rem' },
  successBanner:  { display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1rem', borderRadius: 10, background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.2)', color: '#6ee7b7', fontSize: '0.82rem', marginBottom: '1.25rem' },
  layout:         {},
  mainCol:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sideCol:        { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card:           { background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.2rem' },
  cardHead:       { marginBottom: '1rem' },
  cardTitle:      { fontSize: '0.88rem', fontWeight: 700, color: '#e2e2f0' },
  cardDesc:       { fontSize: '0.77rem', color: '#55556e', lineHeight: 1.55, marginTop: '0.2rem' },
  field:          { marginBottom: '0.9rem' },
  label:          { display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 700, color: '#9494b0', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' },
  input:          { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.58rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none' },
  textarea:       { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.58rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none', resize: 'vertical', lineHeight: 1.6 },
  select:         { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '0.58rem 0.85rem', color: '#f0f0f5', fontFamily: "'DM Sans', sans-serif", fontSize: '0.85rem', outline: 'none', cursor: 'pointer' },
  hint:           { fontSize: '0.7rem', color: '#55556e', marginTop: '0.25rem', display: 'block', lineHeight: 1.5 },
  twoCol:         {},
  skeleton:       { height: 46, borderRadius: 8, background: 'rgba(255,255,255,0.04)' },
  templatePreview:{ marginTop: '0.6rem', padding: '0.75rem 0.85rem', borderRadius: 9, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' },
  pill:           { display: 'inline-flex', padding: '0.15rem 0.55rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700 },
  reviewNote:     { display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '0.85rem', padding: '0.7rem 0.8rem', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', fontSize: '0.73rem', color: '#9494b0', lineHeight: 1.6 },
  btnPrimary:     { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.62rem 1.1rem', borderRadius: 9, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.84rem', fontWeight: 700, border: 'none', cursor: 'pointer' },
  btnSecondary:   { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.62rem 1.1rem', borderRadius: 9, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: '#9494b0', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer' },
};