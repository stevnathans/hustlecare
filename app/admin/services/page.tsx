/* eslint-disable react/no-unescaped-entities */
// app/admin/services/page.tsx
//
// Services catalog: the services you sell, their packages (price, deposit,
// turnaround, what's included) and the files customers are asked to send.
// The public /services pages and pricing cards read from here.
'use client';
import { useCallback, useEffect, useState } from 'react';

type Category = 'PLANNING' | 'LEGAL' | 'BRANDING' | 'DIGITAL';

interface PackageRow {
  id?: number;
  key: string;
  name: string;
  tag: string | null;
  price: number;
  depositPercent: number;
  turnaroundMinDays: number | null;
  turnaroundMaxDays: number | null;
  revisionRounds: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

interface DocRow {
  id?: number;
  label: string;
  description: string | null;
  isRequired: boolean;
}

interface ServiceRow {
  id: number;
  slug: string;
  name: string;
  shortDescription: string;
  emoji: string;
  category: Category;
  ctaLabel: string;
  isActive: boolean;
  displayOrder: number;
  packages: PackageRow[];
  documents: DocRow[];
}

const CATEGORY_LABELS: Record<Category, string> = {
  PLANNING: 'Business planning',
  LEGAL: 'Legal setup',
  BRANDING: 'Branding',
  DIGITAL: 'Digital presence',
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap');
  .adm { font-family:'Sora',sans-serif; color:#f0f0f5; }
  .adm-mono { font-family:'DM Mono',monospace; }
  .r-table { width:100%; border-collapse:collapse; }
  .r-table th { padding:0.65rem 1rem; text-align:left; font-size:0.7rem; font-weight:700; color:#55556e; text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid rgba(255,255,255,0.06); white-space:nowrap; background:#13131a; }
  .r-table td { padding:0.8rem 1rem; border-bottom:1px solid rgba(255,255,255,0.04); vertical-align:middle; }
  .r-table tbody tr { cursor:pointer; transition:background 0.15s; }
  .r-table tbody tr:hover { background:rgba(255,255,255,0.03); }
  .u-plain { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.09); border-radius:8px; padding:0.5rem 0.75rem; color:#f0f0f5; font-family:'Sora',sans-serif; font-size:0.84rem; outline:none; width:100%; box-sizing:border-box; }
  .u-plain:focus { border-color:rgba(99,102,241,0.5); }
  .u-plain:disabled { opacity:0.55; cursor:not-allowed; }
  select.u-plain option { background:#1a1a24; }
  .btn { display:inline-flex; align-items:center; gap:0.4rem; padding:0.5rem 1rem; border-radius:9px; font-family:'Sora',sans-serif; font-size:0.82rem; font-weight:600; cursor:pointer; border:none; white-space:nowrap; text-decoration:none; }
  .btn-primary { background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; }
  .btn-primary:disabled, .btn-ghost:disabled { opacity:0.5; cursor:not-allowed; }
  .btn-ghost { background:rgba(255,255,255,0.06); color:#9494b0; border:1px solid rgba(255,255,255,0.09); }
  .btn-ghost:hover { background:rgba(255,255,255,0.1); color:#f0f0f5; }
  .btn-sm { padding:0.3rem 0.65rem; font-size:0.76rem; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:9999; display:flex; align-items:center; justify-content:center; padding:1rem; backdrop-filter:blur(4px); overflow-y:auto; }
  .modal-box { background:#1a1a24; border:1px solid rgba(255,255,255,0.09); border-radius:16px; width:100%; max-width:760px; box-shadow:0 24px 80px rgba(0,0,0,0.6); margin:auto; }
  .section-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:11px; padding:0.9rem 1rem; margin-bottom:0.75rem; }
  .pkg-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:11px; padding:0.85rem 0.95rem; margin-bottom:0.7rem; }
  .f-label { display:block; font-size:0.74rem; font-weight:600; color:#8a8aa6; margin-bottom:0.3rem; }
  .hint { font-size:0.74rem; color:#6a6a86; margin:0.35rem 0 0; line-height:1.45; }
  .h3 { font-size:0.8rem; font-weight:700; color:#b4b4cc; margin:0 0 0.65rem; }
  .chip { display:inline-flex; padding:0.2rem 0.65rem; border-radius:100px; font-size:0.72rem; font-weight:700; white-space:nowrap; }
  .scroll::-webkit-scrollbar { width:4px; height:4px; }
  .scroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:2px; }
`;

async function api<T = Record<string, unknown>>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Something went wrong.');
  return data as T;
}

const jsonInit = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-US')}`;

function priceRange(pkgs: PackageRow[]): string {
  const active = pkgs.filter((p) => p.isActive);
  if (active.length === 0) return '—';
  const prices = active.map((p) => p.price);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return lo === hi ? ksh(lo) : `${ksh(lo)} – ${ksh(hi)}`;
}

// ── Package form ─────────────────────────────────────────────────────────────

interface PkgForm {
  id?: number;
  key: string;
  name: string;
  tag: string;
  price: string;
  depositPercent: string;
  turnaroundMinDays: string;
  turnaroundMaxDays: string;
  revisionRounds: string;
  features: string; // one per line
  isPopular: boolean;
  isActive: boolean;
}

const toPkgForm = (p: PackageRow): PkgForm => ({
  id: p.id,
  key: p.key,
  name: p.name,
  tag: p.tag ?? '',
  price: String(p.price),
  depositPercent: String(p.depositPercent),
  turnaroundMinDays: p.turnaroundMinDays ? String(p.turnaroundMinDays) : '',
  turnaroundMaxDays: p.turnaroundMaxDays ? String(p.turnaroundMaxDays) : '',
  revisionRounds: String(p.revisionRounds),
  features: p.features.join('\n'),
  isPopular: p.isPopular,
  isActive: p.isActive,
});

const blankPkg = (): PkgForm => ({
  key: '',
  name: '',
  tag: '',
  price: '',
  depositPercent: '50',
  turnaroundMinDays: '',
  turnaroundMaxDays: '',
  revisionRounds: '2',
  features: '',
  isPopular: false,
  isActive: true,
});

// ── Edit modal ───────────────────────────────────────────────────────────────

function EditModal({
  service,
  onClose,
  onSaved,
  notify,
}: {
  service: ServiceRow | null; // null = creating a new service
  onClose: () => void;
  onSaved: () => void;
  notify: (msg: string, type?: 'success' | 'error') => void;
}) {
  const isNew = service === null;
  const [slug, setSlug] = useState('');
  const [name, setName] = useState(service?.name ?? '');
  const [shortDescription, setShortDescription] = useState(service?.shortDescription ?? '');
  const [emoji, setEmoji] = useState(service?.emoji ?? '');
  const [category, setCategory] = useState<Category>(service?.category ?? 'PLANNING');
  const [ctaLabel, setCtaLabel] = useState(service?.ctaLabel ?? 'Get started');
  const [isActive, setIsActive] = useState(service?.isActive ?? true);
  const [displayOrder, setDisplayOrder] = useState(String(service?.displayOrder ?? 100));
  const [pkgs, setPkgs] = useState<PkgForm[]>((service?.packages ?? []).map(toPkgForm));
  const [docs, setDocs] = useState<DocRow[]>(service?.documents ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const patchPkg = (i: number, patch: Partial<PkgForm>) =>
    setPkgs((list) => list.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  const patchDoc = (i: number, patch: Partial<DocRow>) =>
    setDocs((list) => list.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));

  async function save() {
    setError('');
    setSaving(true);
    try {
      const payload = {
        name,
        shortDescription,
        emoji,
        category,
        ctaLabel,
        isActive,
        displayOrder: Number(displayOrder),
        packages: pkgs.map((p) => ({
          id: p.id,
          key: p.key,
          name: p.name,
          tag: p.tag,
          price: Number(p.price),
          depositPercent: Number(p.depositPercent),
          turnaroundMinDays: p.turnaroundMinDays === '' ? null : Number(p.turnaroundMinDays),
          turnaroundMaxDays: p.turnaroundMaxDays === '' ? null : Number(p.turnaroundMaxDays),
          revisionRounds: Number(p.revisionRounds),
          features: p.features.split('\n'),
          isPopular: p.isPopular,
          isActive: p.isActive,
        })),
        documents: docs,
      };
      if (isNew) await api('/api/admin/services', jsonInit('POST', { ...payload, slug }));
      else await api(`/api/admin/services/${service.id}`, jsonInit('PUT', payload));
      notify('Saved');
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>
        <div style={{ padding: '1.2rem 1.5rem 0.9rem', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{isNew ? 'New service' : service.name}</h2>
          {!isNew && <p style={{ fontSize: '0.78rem', color: '#7a7a96', margin: '0.25rem 0 0' }} className="adm-mono">/services/{service.slug}</p>}
        </div>

        <div className="scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '1.1rem 1.5rem' }}>
          {error && (
            <div style={{ padding: '0.65rem 0.85rem', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '0.75rem' }} role="alert">
              {error}
            </div>
          )}

          {/* Details */}
          <div className="section-card">
            <h3 className="h3">About the service</h3>
            {isNew && (
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="f-label" htmlFor="slug">Page address (cannot be changed later)</label>
                <input id="slug" className="u-plain adm-mono" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="e.g. company-profile" />
                <p className="hint">
                  This becomes /services/{slug || 'your-address'}. A new service also needs its own page built for that address, otherwise visitors who click it see a "not found" page. Until it's built, keep it switched off below.
                </p>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="f-label" htmlFor="emoji">Icon</label>
                <input id="emoji" className="u-plain" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="📋" />
              </div>
              <div>
                <label className="f-label" htmlFor="name">Name</label>
                <input id="name" className="u-plain" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label className="f-label" htmlFor="desc">One-line description (shown on the services page)</label>
              <input id="desc" className="u-plain" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: '0.6rem' }}>
              <div>
                <label className="f-label" htmlFor="cat">Group</label>
                <select id="cat" className="u-plain" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                  {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="f-label" htmlFor="cta">Button text</label>
                <input id="cta" className="u-plain" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
              </div>
              <div>
                <label className="f-label" htmlFor="order">Order</label>
                <input id="order" className="u-plain adm-mono" inputMode="numeric" value={displayOrder} onChange={(e) => setDisplayOrder(e.target.value.replace(/\D/g, ''))} />
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', marginTop: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} style={{ accentColor: '#6366f1' }} />
              Show this service on the website
            </label>
          </div>

          {/* Packages */}
          <div className="section-card">
            <h3 className="h3">Packages and prices</h3>
            {pkgs.length === 0 && <p className="hint" style={{ marginBottom: '0.6rem' }}>No packages yet. Add one to give this service a price.</p>}

            {pkgs.map((p, i) => {
              const price = Number(p.price) || 0;
              const pct = Number(p.depositPercent) || 0;
              const deposit = Math.round((price * pct) / 100);
              return (
                <div key={p.id ?? `new-${i}`} className="pkg-card" style={{ opacity: p.isActive ? 1 : 0.6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label className="f-label">Name</label>
                      <input className="u-plain" value={p.name} onChange={(e) => patchPkg(i, { name: e.target.value })} placeholder="e.g. Starter" />
                    </div>
                    <div>
                      <label className="f-label">Key {p.id ? '(fixed)' : ''}</label>
                      <input className="u-plain adm-mono" disabled={!!p.id} value={p.key} onChange={(e) => patchPkg(i, { key: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="starter" />
                    </div>
                    <div>
                      <label className="f-label">Tagline</label>
                      <input className="u-plain" value={p.tag} onChange={(e) => patchPkg(i, { tag: e.target.value })} placeholder="e.g. Best for early ideas" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr 1fr', gap: '0.6rem', marginTop: '0.65rem' }}>
                    <div>
                      <label className="f-label">Total price (KSh)</label>
                      <input className="u-plain adm-mono" inputMode="numeric" value={p.price} onChange={(e) => patchPkg(i, { price: e.target.value.replace(/[^\d.]/g, '') })} />
                    </div>
                    <div>
                      <label className="f-label">Deposit %</label>
                      <input className="u-plain adm-mono" inputMode="numeric" value={p.depositPercent} onChange={(e) => patchPkg(i, { depositPercent: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div>
                      <label className="f-label">Days from</label>
                      <input className="u-plain adm-mono" inputMode="numeric" value={p.turnaroundMinDays} onChange={(e) => patchPkg(i, { turnaroundMinDays: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div>
                      <label className="f-label">Days to</label>
                      <input className="u-plain adm-mono" inputMode="numeric" value={p.turnaroundMaxDays} onChange={(e) => patchPkg(i, { turnaroundMaxDays: e.target.value.replace(/\D/g, '') })} />
                    </div>
                    <div>
                      <label className="f-label">Revisions</label>
                      <input className="u-plain adm-mono" inputMode="numeric" value={p.revisionRounds} onChange={(e) => patchPkg(i, { revisionRounds: e.target.value.replace(/\D/g, '') })} />
                    </div>
                  </div>
                  {price > 0 && pct > 0 && (
                    <p className="hint">
                      Customer pays <strong style={{ color: '#d0d0e0' }}>{ksh(deposit)}</strong> up front{pct < 100 ? <> and <strong style={{ color: '#d0d0e0' }}>{ksh(price - deposit)}</strong> when the work is ready</> : ' (everything up front)'}.
                    </p>
                  )}

                  <div style={{ marginTop: '0.65rem' }}>
                    <label className="f-label">What's included (one point per line)</label>
                    <textarea className="u-plain" rows={4} style={{ resize: 'vertical' }} value={p.features} onChange={(e) => patchPkg(i, { features: e.target.value })} />
                  </div>

                  <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', marginTop: '0.65rem', fontSize: '0.8rem', color: '#9494b0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={p.isPopular} onChange={(e) => patchPkg(i, { isPopular: e.target.checked })} style={{ accentColor: '#6366f1' }} />
                      Mark as "Most popular"
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={p.isActive} onChange={(e) => patchPkg(i, { isActive: e.target.checked })} style={{ accentColor: '#6366f1' }} />
                      Offer this package
                    </label>
                    {!p.id && (
                      <button className="btn btn-ghost btn-sm" onClick={() => setPkgs((l) => l.filter((_, idx) => idx !== i))}>Remove</button>
                    )}
                  </div>
                </div>
              );
            })}

            <button className="btn btn-ghost btn-sm" onClick={() => setPkgs((l) => [...l, blankPkg()])}>+ Add a package</button>
            <p className="hint">
              Packages can't be deleted, only switched off, so old orders keep their history. Changing a price affects new orders only; every order keeps the price it was placed at. If a package is part of a questionnaire's logic (e.g. "Investor" adds extra questions), keep its key as it is.
            </p>
          </div>

          {/* Files */}
          <div className="section-card">
            <h3 className="h3">Files we ask the customer to send</h3>
            {docs.length === 0 && <p className="hint" style={{ marginBottom: '0.6rem' }}>None. Customers will be asked for files only if you add them here.</p>}
            {docs.map((d, i) => (
              <div key={d.id ?? `new-${i}`} style={{ padding: '0.6rem 0.7rem', background: 'rgba(255,255,255,0.03)', borderRadius: 9, marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <input className="u-plain" value={d.label} onChange={(e) => patchDoc(i, { label: e.target.value })} placeholder="e.g. Business logo" aria-label="File name" />
                  <button className="btn btn-ghost btn-sm" onClick={() => setDocs((l) => l.filter((_, idx) => idx !== i))} aria-label="Remove">×</button>
                </div>
                <input className="u-plain" style={{ marginTop: '0.4rem' }} value={d.description ?? ''} onChange={(e) => patchDoc(i, { description: e.target.value })} placeholder="Help text (optional)" aria-label="Help text" />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.78rem', color: '#9494b0', marginTop: '0.45rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={d.isRequired} onChange={(e) => patchDoc(i, { isRequired: e.target.checked })} style={{ accentColor: '#6366f1' }} />
                  Required before we can start
                </label>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" onClick={() => setDocs((l) => [...l, { label: '', description: null, isRequired: false }])}>+ Add a file</button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '0.9rem 1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !name.trim() || (isNew && slug.length < 3)}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ServicesAdminPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState<ServiceRow | 'new' | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const d = await api<{ services: ServiceRow[] }>('/api/admin/services');
      setServices(d.services);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load services.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runImport() {
    setImporting(true);
    try {
      const r = await api<{ servicesCreated: number; packagesCreated: number }>('/api/admin/services/import', { method: 'POST' });
      notify(
        r.servicesCreated === 0 && r.packagesCreated === 0
          ? 'Nothing new to import. Everything is already there.'
          : `Imported ${r.servicesCreated} service${r.servicesCreated === 1 ? '' : 's'} and ${r.packagesCreated} package${r.packagesCreated === 1 ? '' : 's'}.`,
      );
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'The import failed.', 'error');
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <style>{S}</style>

      {toast && (
        <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 99999, padding: '0.75rem 1.25rem', borderRadius: 11, fontSize: '0.84rem', fontFamily: 'Sora,sans-serif', fontWeight: 600, background: toast.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${toast.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, color: toast.type === 'success' ? '#6ee7b7' : '#fca5a5', maxWidth: 420 }}>
          {toast.msg}
        </div>
      )}

      <div className="adm" style={{ minHeight: '100vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>Services</h1>
            <p style={{ fontSize: '0.84rem', color: '#55556e' }}>The services you sell, with their packages, prices and the files customers send.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={runImport} disabled={importing}>{importing ? 'Importing…' : 'Import current services'}</button>
            <button className="btn btn-primary" onClick={() => setEditing('new')}>+ New service</button>
          </div>
        </div>

        {loadError && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontSize: '0.84rem', marginBottom: '1rem' }}>
            {loadError} If this is the first time, make sure the database migration for the services tables has been run.
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#55556e', fontSize: '0.85rem' }}>Loading…</div>
        ) : services.length === 0 && !loadError ? (
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.4rem' }}>No services in the catalog yet</p>
            <p style={{ fontSize: '0.84rem', color: '#7a7a96', marginBottom: '1.1rem' }}>
              Your website still shows its built-in services and prices. Import them once to start editing from here, nothing changes for visitors.
            </p>
            <button className="btn btn-primary" onClick={runImport} disabled={importing}>{importing ? 'Importing…' : 'Import current services'}</button>
          </div>
        ) : (
          <div style={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div className="scroll" style={{ overflowX: 'auto' }}>
              <table className="r-table">
                <thead>
                  <tr><th>Service</th><th>Group</th><th>Status</th><th>Packages</th><th></th></tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} onClick={() => setEditing(s)}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{s.emoji} {s.name}</div>
                        <div className="adm-mono" style={{ fontSize: '0.72rem', color: '#55556e', marginTop: 2 }}>/services/{s.slug}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>{CATEGORY_LABELS[s.category]}</td>
                      <td>
                        {s.isActive
                          ? <span className="chip" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>Live</span>
                          : <span className="chip" style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' }}>Hidden</span>}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#9494b0' }}>
                        {s.packages.filter((p) => p.isActive).length === 0
                          ? <span style={{ color: '#55556e' }}>No packages yet</span>
                          : <>{s.packages.filter((p) => p.isActive).length} · <span className="adm-mono">{priceRange(s.packages)}</span></>}
                      </td>
                      <td style={{ textAlign: 'right' }}><span className="btn btn-ghost btn-sm">Edit</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {editing && (
          <EditModal
            service={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={load}
            notify={notify}
          />
        )}
      </div>
    </>
  );
}