/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// app/vendor/apply/page.tsx
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store, Globe, MapPin, Phone, Twitter, Instagram,
  Facebook, Linkedin, ChevronRight, ChevronLeft,
  CheckCircle2, Clock, XCircle, Loader2, ArrowRight,
} from 'lucide-react';

const PRODUCT_CATEGORIES = [
  'Equipment', 'Software', 'Documents', 'Legal', 'Branding', 'Operating Expenses',
];

const STEPS = [
  { id: 1, label: 'Store Identity' },
  { id: 2, label: 'About & Links' },
  { id: 3, label: 'What You Sell' },
  { id: 4, label: 'Review & Submit' },
];

type ApplicationStatus = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  businessName: string;
  slug: string;
  reviewNote: string | null;
  createdAt: string;
} | null;

export default function VendorApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingApp, setExistingApp] = useState<ApplicationStatus>(null);
  const [error, setError] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugChecking, setSlugChecking] = useState(false);

  // All form state lives here and is NEVER reset on step change
  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    tagline: '',
    logo: '',
    description: '',
    website: '',
    location: '',
    phone: '',
    twitterUrl: '',
    instagramUrl: '',
    facebookUrl: '',
    linkedinUrl: '',
    productCategories: [] as string[],
    businessTypes: [] as string[],
    pitchNote: '',
  });

  const checkExistingApplication = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/vendors/apply');
      if (res.ok) setExistingApp(await res.json());
    } catch {}
    finally { setChecking(false); }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?callbackUrl=/vendor/apply');
      return;
    }
    if (status === 'authenticated') {
      if ((session.user.role as string) === 'vendor') {
        router.push('/vendor/dashboard');
        return;
      }
      checkExistingApplication();
    }
  }, [status, session, router, checkExistingApplication]);

  function handleBusinessNameChange(value: string) {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);
    setForm(f => ({ ...f, businessName: value, slug }));
    setSlugAvailable(null);
  }

  async function checkSlug(slug: string) {
    if (!slug || slug.length < 3) return;
    setSlugChecking(true);
    try {
      const res = await fetch(`/api/vendors/public?slug=${encodeURIComponent(slug)}`);
      setSlugAvailable(res.status === 404);
    } catch {
      setSlugAvailable(null);
    } finally {
      setSlugChecking(false);
    }
  }

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      productCategories: f.productCategories.includes(cat)
        ? f.productCategories.filter(c => c !== cat)
        : [...f.productCategories, cat],
    }));
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/vendors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      await checkExistingApplication();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  function canProceed() {
    if (step === 1) return form.businessName.trim().length > 0 && form.slug.trim().length >= 3;
    if (step === 3) return form.productCategories.length > 0 && form.pitchNote.trim().length > 20;
    return true;
  }

  function goNext() { if (canProceed()) setStep(s => s + 1); }
  function goBack() { setStep(s => s - 1); }

  if (status === 'loading' || checking) {
    return (
      <div style={S.loadingWrap}>
        <style>{CSS}</style>
        <Loader2 size={28} className="va-spin" style={{ color: '#f59e0b' }} />
      </div>
    );
  }

  if (existingApp) {
    return <ApplicationStatusCard app={existingApp} onReapply={() => setExistingApp(null)} />;
  }

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Back link */}
      <Link href="/" style={S.backLink}>
        <ChevronLeft size={15} /> Hustlecare
      </Link>

      {/* Header */}
      <div style={S.header}>
        <div style={S.storeBadge}>
          <Store size={18} color="#f59e0b" />
        </div>
        <div>
          <h1 style={S.h1}>Become a Vendor</h1>
          <p style={S.subtitle}>Reach thousands of entrepreneurs starting their businesses</p>
        </div>
      </div>

      {/* Step indicator */}
      <div style={S.stepRow}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={S.stepItem}>
            <div style={{
              ...S.stepDot,
              background: step > s.id ? '#10b981' : step === s.id ? '#f59e0b' : 'rgba(255,255,255,0.07)',
              color: step >= s.id ? '#0a0a0f' : '#55556e',
            }}>
              {step > s.id ? <CheckCircle2 size={13} /> : s.id}
            </div>
            <span className="va-step-label" style={{ fontSize: '0.72rem', color: step >= s.id ? '#e2e2f0' : '#55556e' }}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1, background: step > s.id ? '#10b981' : 'rgba(255,255,255,0.06)', margin: '0 0.4rem', minWidth: 16 }} />
            )}
          </div>
        ))}
      </div>

      {/* Card — single container, no re-mount on step change */}
      <div style={S.card}>
        {error && (
          <div style={S.errorBanner}>
            <XCircle size={14} /> {error}
          </div>
        )}

        {/* Step 1 — hidden, not unmounted, so no data loss */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <StepHeading title="Your store identity" desc="This is how customers will find and recognise your storefront." />

          <Field label="Business / Store Name" required>
            <input
              style={S.input}
              placeholder="e.g. TechHub Kenya"
              value={form.businessName}
              onChange={e => handleBusinessNameChange(e.target.value)}
            />
          </Field>

          <Field label="Store URL" required>
            <div style={S.slugRow}>
              <span style={S.slugPrefix}>hustlecare.com/vendors/</span>
              <input
                style={{ ...S.input, borderRadius: '0 8px 8px 0', borderLeft: 'none', flex: 1 }}
                value={form.slug}
                onChange={e => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                  setForm(f => ({ ...f, slug: val }));
                  setSlugAvailable(null);
                }}
                onBlur={() => checkSlug(form.slug)}
                placeholder="your-store-name"
              />
            </div>
            {slugChecking && <Hint>Checking availability…</Hint>}
            {!slugChecking && slugAvailable === true  && <Hint color="#10b981">✓ Available</Hint>}
            {!slugChecking && slugAvailable === false && <Hint color="#f87171">✗ Already taken — try another</Hint>}
            <Hint>Lowercase letters, numbers, and hyphens only. Min 3 characters.</Hint>
          </Field>

          <Field label="Tagline">
            <input
              style={S.input}
              placeholder="e.g. Quality tech at startup prices"
              value={form.tagline}
              maxLength={120}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            />
            <Hint>{form.tagline.length}/120</Hint>
          </Field>

          <Field label="Logo URL">
            <input style={S.input} placeholder="https://…" value={form.logo}
              onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} />
          </Field>
        </div>

        {/* Step 2 */}
        <div style={{ display: step === 2 ? 'block' : 'none' }}>
          <StepHeading title="About your business" desc="Help customers understand who you are and how to reach you." />

          <Field label="Business Description">
            <textarea
              style={S.textarea}
              rows={4}
              placeholder="Tell entrepreneurs what you sell, your story, and why they should buy from you…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <div style={S.twoCol}>
            <Field label="Website" icon={<Globe size={12} />}>
              <input style={S.input} placeholder="https://yourbusiness.com" value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </Field>
            <Field label="Location" icon={<MapPin size={12} />}>
              <input style={S.input} placeholder="Nairobi, Kenya" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </Field>
          </div>

          <Field label="Phone" icon={<Phone size={12} />}>
            <input style={{ ...S.input, maxWidth: 280 }} placeholder="+254 700 000 000" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </Field>

          <div style={S.socialsDivider}>
            Social Links <span style={S.optional}>optional</span>
          </div>
          <div style={S.twoCol}>
            {([
              { icon: <Twitter size={12} />,   key: 'twitterUrl',   label: 'Twitter / X',  ph: 'https://x.com/…' },
              { icon: <Instagram size={12} />, key: 'instagramUrl', label: 'Instagram',     ph: 'https://instagram.com/…' },
              { icon: <Facebook size={12} />,  key: 'facebookUrl',  label: 'Facebook',      ph: 'https://facebook.com/…' },
              { icon: <Linkedin size={12} />,  key: 'linkedinUrl',  label: 'LinkedIn',      ph: 'https://linkedin.com/…' },
            ] as { icon: React.ReactNode; key: string; label: string; ph: string }[]).map(({ icon, key, label, ph }) => (
              <Field key={key} label={label} icon={icon}>
                <input style={S.input} placeholder={ph}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </Field>
            ))}
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ display: step === 3 ? 'block' : 'none' }}>
          <StepHeading title="What will you sell?" desc="Select the product categories you plan to list. This helps us match your products to the right businesses." />

          <Field label="Product Categories" required>
            <div style={S.tagGrid}>
              {PRODUCT_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  style={{
                    ...S.tagBtn,
                    ...(form.productCategories.includes(cat) ? S.tagBtnActive : {}),
                  }}
                  onClick={() => toggleCategory(cat)}
                >
                  {form.productCategories.includes(cat) && <CheckCircle2 size={11} />}
                  {cat}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Why do you want to sell on Hustlecare?" required>
            <textarea
              style={S.textarea}
              rows={5}
              placeholder="Tell us about your products, your target market, and why Hustlecare is the right fit for your business…"
              value={form.pitchNote}
              onChange={e => setForm(f => ({ ...f, pitchNote: e.target.value }))}
            />
            <Hint>Minimum 20 characters. This helps our team review your application.</Hint>
          </Field>
        </div>

        {/* Step 4 — review */}
        <div style={{ display: step === 4 ? 'block' : 'none' }}>
          <StepHeading title="Review your application" desc="Everything look good? Submit to begin the review process." />

          <div style={S.reviewGrid}>
            <ReviewRow label="Store Name" value={form.businessName} />
            <ReviewRow label="Store URL"  value={`/vendors/${form.slug}`} />
            {form.tagline   && <ReviewRow label="Tagline"  value={form.tagline} />}
            {form.location  && <ReviewRow label="Location" value={form.location} />}
            {form.website   && <ReviewRow label="Website"  value={form.website} />}
            <ReviewRow
              label="Categories"
              value={form.productCategories.length > 0 ? form.productCategories.join(', ') : '—'}
            />
          </div>

          <div style={S.pitchPreview}>
            <div style={S.pitchLabel}>Your pitch</div>
            <p style={S.pitchText}>{form.pitchNote || '—'}</p>
          </div>

          <div style={S.timelineNote}>
            <Clock size={14} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.6 }}>
              Applications are typically reviewed within <strong style={{ color: '#e2e2f0' }}>1–3 business days</strong>.
              You&rsquo;ll receive an email once a decision is made.
            </p>
          </div>
        </div>

        {/* Nav */}
        <div style={S.navRow}>
          {step > 1 && (
            <button style={S.btnSecondary} onClick={goBack}>
              <ChevronLeft size={14} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button
              style={{ ...S.btnPrimary, opacity: canProceed() ? 1 : 0.4, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
              onClick={goNext}
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              style={{ ...S.btnPrimary, opacity: (!loading) ? 1 : 0.5 }}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={14} className="va-spin" /> Submitting…</>
                : <>Submit Application <ArrowRight size={14} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Small reusable sub-components ─────────────────────────────── */

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={S.stepTitle}>{title}</h2>
      <p style={S.stepDesc}>{desc}</p>
    </div>
  );
}

function Field({ label, children, required, icon }: {
  label: string; children: React.ReactNode; required?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={S.label}>
        {icon && <span style={{ opacity: 0.7 }}>{icon}</span>}
        {label}
        {required && <span style={{ color: '#f87171' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Hint({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{ ...S.hint, ...(color ? { color } : {}) }}>{children}</span>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.76rem', color: '#55556e', width: 100, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.84rem', color: '#e2e2f0', wordBreak: 'break-word' as const }}>{value}</span>
    </div>
  );
}

function ApplicationStatusCard({
  app, onReapply,
}: {
  app: NonNullable<ApplicationStatus>;
  onReapply: () => void;
}) {
  const isPending  = app.status === 'PENDING';
  const isApproved = app.status === 'APPROVED';
  const isRejected = app.status === 'REJECTED';

  return (
    <div style={S.page}>
      <style>{CSS}</style>
      <div style={{ ...S.card, maxWidth: 500, textAlign: 'center' as const, margin: '3rem auto 0' }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%', margin: '0 auto 1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isPending ? 'rgba(245,158,11,0.12)' : isApproved ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        }}>
          {isPending  && <Clock        size={26} color="#f59e0b" />}
          {isApproved && <CheckCircle2 size={26} color="#10b981" />}
          {isRejected && <XCircle      size={26} color="#f87171" />}
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f0f0f5' }}>
          {isPending  && 'Application Under Review'}
          {isApproved && 'Application Approved!'}
          {isRejected && 'Application Not Approved'}
        </h2>

        <p style={{ fontSize: '0.84rem', color: '#9494b0', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          {isPending  && `Your application for "${app.businessName}" is being reviewed. We'll email you within 1–3 business days.`}
          {isApproved && 'Welcome to Hustlecare Marketplace! Your vendor profile is live.'}
          {isRejected && (app.reviewNote || 'Your application was not approved at this time. You may reapply with updated information.')}
        </p>

        {isApproved && (
          <Link href="/vendor/dashboard" style={S.btnPrimary}>
            Go to Vendor Dashboard <ArrowRight size={14} />
          </Link>
        )}
        {isRejected && (
          <button style={S.btnPrimary} onClick={onReapply}>
            Update &amp; Reapply <ArrowRight size={14} />
          </button>
        )}
        {isPending && (
          <Link href="/" style={S.btnSecondary}>Back to Hustlecare</Link>
        )}
      </div>
    </div>
  );
}

/* ── CSS ─────────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  @keyframes va-spin { to { transform: rotate(360deg); } }
  .va-spin { animation: va-spin 1s linear infinite; }
  * { box-sizing: border-box; }

  /* Hide step labels on very small screens */
  @media (max-width: 480px) {
    .va-step-label { display: none; }
  }

  @media (max-width: 520px) {
    .va-two-col { grid-template-columns: 1fr !important; }
  }
`;

/* ── Styles ──────────────────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#08080f',
    fontFamily: "'Inter', sans-serif",
    color: '#f0f0f5',
    padding: '1.5rem 1rem 4rem',
  },
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#08080f',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.78rem',
    color: '#55556e',
    textDecoration: 'none',
    marginBottom: '1.75rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    maxWidth: 660,
    margin: '0 auto 1.75rem',
  },
  storeBadge: {
    width: 46,
    height: 46,
    borderRadius: 12,
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  h1: {
    fontSize: '1.35rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    margin: 0,
    color: '#f0f0f5',
  },
  subtitle: {
    fontSize: '0.8rem',
    color: '#55556e',
    margin: '0.15rem 0 0',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: 660,
    margin: '0 auto 1.5rem',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    flex: 1,
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.72rem',
    fontWeight: 700,
    flexShrink: 0,
    transition: 'background 0.2s',
  },
  card: {
    maxWidth: 660,
    margin: '0 auto',
    background: '#0f0f1a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '1.75rem',
    // No animation here — the card is always mounted, only contents swap
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.7rem 1rem',
    borderRadius: 9,
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.18)',
    color: '#fca5a5',
    fontSize: '0.82rem',
    marginBottom: '1.25rem',
  },
  stepTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    letterSpacing: '-0.01em',
    marginBottom: '0.3rem',
    color: '#f0f0f5',
  },
  stepDesc: {
    fontSize: '0.8rem',
    color: '#55556e',
    lineHeight: 1.6,
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#9494b0',
    marginBottom: '0.35rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.07em',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    padding: '0.6rem 0.85rem',
    color: '#f0f0f5',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.86rem',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    padding: '0.6rem 0.85rem',
    color: '#f0f0f5',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.86rem',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.6,
  },
  hint: {
    fontSize: '0.71rem',
    color: '#55556e',
    marginTop: '0.3rem',
    display: 'block',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '0.75rem',
  },
  slugRow: {
    display: 'flex',
    alignItems: 'stretch',
  },
  slugPrefix: {
    padding: '0.6rem 0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRight: 'none',
    borderRadius: '8px 0 0 8px',
    fontSize: '0.74rem',
    color: '#55556e',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
    fontFamily: "'DM Mono', monospace",
  },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  tagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    padding: '0.42rem 0.85rem',
    borderRadius: 100,
    border: '1px solid rgba(255,255,255,0.09)',
    background: 'rgba(255,255,255,0.03)',
    color: '#9494b0',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s',
  },
  tagBtnActive: {
    background: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.3)',
    color: '#fbbf24',
  },
  socialsDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#55556e',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '1.25rem 0 0.85rem',
  },
  optional: {
    fontWeight: 400,
    fontStyle: 'italic',
    textTransform: 'none' as const,
    letterSpacing: 0,
    color: '#3a3a56',
    fontSize: '0.72rem',
  },
  reviewGrid: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '0.35rem 1rem',
    marginBottom: '1.1rem',
  },
  pitchPreview: {
    background: 'rgba(245,158,11,0.04)',
    border: '1px solid rgba(245,158,11,0.12)',
    borderRadius: 10,
    padding: '0.9rem 1rem',
    marginBottom: '1.1rem',
  },
  pitchLabel: {
    fontSize: '0.66rem',
    fontWeight: 700,
    color: '#f59e0b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.45rem',
  },
  pitchText: {
    fontSize: '0.84rem',
    color: '#c8c8dc',
    lineHeight: 1.7,
    margin: 0,
    whiteSpace: 'pre-wrap' as const,
  },
  timelineNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.65rem',
    padding: '0.85rem 1rem',
    borderRadius: 10,
    background: 'rgba(245,158,11,0.05)',
    border: '1px solid rgba(245,158,11,0.1)',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1.75rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.6rem 1.3rem',
    borderRadius: 9,
    background: '#f59e0b',
    color: '#0a0a0f',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.86rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.6rem 1.1rem',
    borderRadius: 9,
    background: 'rgba(255,255,255,0.05)',
    color: '#9494b0',
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.86rem',
    fontWeight: 500,
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
};