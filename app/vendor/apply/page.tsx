/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// app/vendor/apply/page.tsx
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Store, Globe, MapPin, Phone, Twitter, Instagram,
  Facebook, Linkedin, ChevronRight, ChevronLeft,
  CheckCircle2, Clock, XCircle, Loader2, ArrowRight,
} from 'lucide-react';

const PRODUCT_CATEGORIES = ['Equipment', 'Software', 'Documents', 'Legal', 'Branding', 'Operating Expenses'];

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

  const [form, setForm] = useState({
    businessName: '',
    slug: '',
    tagline: '',
    logo: '',
    coverImage: '',
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/signin?callbackUrl=/vendor/apply');
    if (status === 'authenticated') {
      if ((session.user.role as string) === 'vendor') {
        router.push('/vendor/dashboard');
        return;
      }
      checkExistingApplication();
    }
  }, [status, session, router]);

  async function checkExistingApplication() {
    setChecking(true);
    try {
      const res = await fetch('/api/vendors/apply');
      if (res.ok) {
        const data = await res.json();
        setExistingApp(data);
      }
    } catch {}
    finally { setChecking(false); }
  }

  // Auto-generate slug from business name
  function handleBusinessNameChange(value: string) {
    setForm(f => ({
      ...f,
      businessName: value,
      slug: value.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40),
    }));
    setSlugAvailable(null);
  }

  async function checkSlug(slug: string) {
    if (!slug || slug.length < 3) return;
    setSlugChecking(true);
    try {
      // We'll check via the apply endpoint by doing a lightweight request
      // In production you'd have a dedicated /api/vendor/check-slug endpoint
      const res = await fetch(`/api/vendors/public?slug=${encodeURIComponent(slug)}`);
      setSlugAvailable(res.status === 404); // 404 = not taken = available
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
    if (step === 3) return form.productCategories.length > 0;
    if (step === 4) return form.pitchNote.trim().length > 20;
    return true;
  }

  if (status === 'loading' || checking) {
    return (
      <div style={styles.loadingWrap}>
        <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#f59e0b' }} />
      </div>
    );
  }

  // Show status card if application already exists
  if (existingApp) {
    return <ApplicationStatusCard app={existingApp} onReapply={() => setExistingApp(null)} />;
  }

  return (
    <div style={styles.page}>
      <style>{PAGE_STYLES}</style>

      {/* Header */}
      <div style={styles.header}>
        <Link href="/" style={styles.backLink}>
          <ChevronLeft size={16} /> Back to Hustlecare
        </Link>
        <div style={styles.headerInner}>
          <div style={styles.storeBadge}>
            <Store size={20} color="#f59e0b" />
          </div>
          <div>
            <h1 style={styles.h1}>Become a Vendor</h1>
            <p style={styles.subtitle}>Reach thousands of entrepreneurs starting their businesses</p>
          </div>
        </div>

        {/* Step indicator */}
        <div style={styles.stepRow}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={styles.stepItem}>
              <div style={{
                ...styles.stepDot,
                background: step > s.id ? '#10b981' : step === s.id ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                borderColor: step >= s.id ? 'transparent' : 'rgba(255,255,255,0.12)',
                color: step >= s.id ? '#0a0a0f' : '#55556e',
                fontWeight: 700,
              }}>
                {step > s.id ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span style={{ fontSize: '0.72rem', color: step >= s.id ? '#e2e2f0' : '#55556e', whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: step > s.id ? '#10b981' : 'rgba(255,255,255,0.06)', margin: '0 0.5rem', minWidth: 20 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div style={styles.card}>
        {error && (
          <div style={styles.errorBanner}>
            <XCircle size={15} /> {error}
          </div>
        )}

        {/* ── Step 1: Store Identity ── */}
        {step === 1 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Your store identity</h2>
            <p style={styles.stepDesc}>This is how customers will find and recognise your storefront.</p>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Business / Store Name <span style={styles.req}>*</span></label>
              <input
                style={styles.input}
                placeholder="e.g. TechHub Kenya"
                value={form.businessName}
                onChange={e => handleBusinessNameChange(e.target.value)}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Store URL <span style={styles.req}>*</span></label>
              <div style={styles.slugRow}>
                <span style={styles.slugPrefix}>hustlecare.com/vendors/</span>
                <input
                  style={{ ...styles.input, borderRadius: '0 8px 8px 0', borderLeft: 'none', flex: 1 }}
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
              {slugChecking && <span style={styles.hint}>Checking availability…</span>}
              {!slugChecking && slugAvailable === true && (
                <span style={{ ...styles.hint, color: '#10b981' }}>✓ Available</span>
              )}
              {!slugChecking && slugAvailable === false && (
                <span style={{ ...styles.hint, color: '#f87171' }}>✗ Already taken — try another</span>
              )}
              <span style={styles.hint}>Only lowercase letters, numbers, and hyphens. Min 3 characters.</span>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tagline</label>
              <input
                style={styles.input}
                placeholder="e.g. Quality tech at startup prices"
                value={form.tagline}
                maxLength={120}
                onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
              />
              <span style={styles.hint}>{form.tagline.length}/120</span>
            </div>

            <div style={styles.twoCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Logo URL</label>
                <input style={styles.input} placeholder="https://…" value={form.logo}
                  onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Cover Image URL</label>
                <input style={styles.input} placeholder="https://…" value={form.coverImage}
                  onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: About & Links ── */}
        {step === 2 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>About your business</h2>
            <p style={styles.stepDesc}>Help customers understand who you are and how to reach you.</p>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Business Description</label>
              <textarea
                style={styles.textarea}
                rows={4}
                placeholder="Tell entrepreneurs what you sell, your story, and why they should buy from you…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div style={styles.twoCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}><Globe size={13} style={{ display: 'inline', marginRight: 4 }} />Website</label>
                <input style={styles.input} placeholder="https://yourbusiness.com" value={form.website}
                  onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}><MapPin size={13} style={{ display: 'inline', marginRight: 4 }} />Location</label>
                <input style={styles.input} placeholder="Nairobi, Kenya" value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}><Phone size={13} style={{ display: 'inline', marginRight: 4 }} />Phone</label>
              <input style={styles.input} placeholder="+254 700 000 000" value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>

            <div style={styles.sectionDivider}>Social Links <span style={styles.optionalTag}>optional</span></div>
            <div style={styles.twoCol}>
              {[
                { icon: <Twitter size={13} />, key: 'twitterUrl', label: 'Twitter/X', placeholder: 'https://x.com/…' },
                { icon: <Instagram size={13} />, key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/…' },
                { icon: <Facebook size={13} />, key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/…' },
                { icon: <Linkedin size={13} />, key: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/…' },
              ].map(({ icon, key, label, placeholder }) => (
                <div key={key} style={styles.fieldGroup}>
                  <label style={styles.label}>{icon} {label}</label>
                  <input style={styles.input} placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: What You Sell ── */}
        {step === 3 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>What will you sell?</h2>
            <p style={styles.stepDesc}>Select the product categories you plan to list. This helps us match your products to the right businesses.</p>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Product Categories <span style={styles.req}>*</span></label>
              <div style={styles.tagGrid}>
                {PRODUCT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    style={{
                      ...styles.tagBtn,
                      ...(form.productCategories.includes(cat) ? styles.tagBtnActive : {}),
                    }}
                    onClick={() => toggleCategory(cat)}
                  >
                    {form.productCategories.includes(cat) && <CheckCircle2 size={12} />}
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>
                Why do you want to sell on Hustlecare? <span style={styles.req}>*</span>
              </label>
              <textarea
                style={styles.textarea}
                rows={5}
                placeholder="Tell us about your products, your target market, and why Hustlecare is the right fit for your business…"
                value={form.pitchNote}
                onChange={e => setForm(f => ({ ...f, pitchNote: e.target.value }))}
              />
              <span style={styles.hint}>Minimum 20 characters. This helps our team review your application.</span>
            </div>
          </div>
        )}

        {/* ── Step 4: Review ── */}
        {step === 4 && (
          <div style={styles.stepContent}>
            <h2 style={styles.stepTitle}>Review your application</h2>
            <p style={styles.stepDesc}>Everything look good? Submit to begin the review process.</p>

            <div style={styles.reviewGrid}>
              <ReviewRow label="Store Name" value={form.businessName} />
              <ReviewRow label="Store URL" value={`/vendors/${form.slug}`} />
              {form.tagline && <ReviewRow label="Tagline" value={form.tagline} />}
              {form.location && <ReviewRow label="Location" value={form.location} />}
              {form.website && <ReviewRow label="Website" value={form.website} />}
              <ReviewRow
                label="Categories"
                value={form.productCategories.length > 0 ? form.productCategories.join(', ') : '—'}
              />
            </div>

            <div style={styles.pitchPreview}>
              <div style={styles.pitchLabel}>Your pitch</div>
              <p style={styles.pitchText}>{form.pitchNote || '—'}</p>
            </div>

            <div style={styles.timelineNote}>
              <Clock size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#9494b0', lineHeight: 1.6 }}>
                Applications are typically reviewed within <strong style={{ color: '#e2e2f0' }}>1–3 business days</strong>.
                You&rsquo;ll receive an email notification once a decision has been made.
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div style={styles.navRow}>
          {step > 1 && (
            <button style={styles.btnSecondary} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={15} /> Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 ? (
            <button
              style={{ ...styles.btnPrimary, opacity: canProceed() ? 1 : 0.45, cursor: canProceed() ? 'pointer' : 'not-allowed' }}
              onClick={() => canProceed() && setStep(s => s + 1)}
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              style={{ ...styles.btnPrimary, opacity: (canProceed() && !loading) ? 1 : 0.45 }}
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
            >
              {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : <>Submit Application <ArrowRight size={15} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.78rem', color: '#55556e', width: 110, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.84rem', color: '#e2e2f0', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function ApplicationStatusCard({
  app, onReapply,
}: {
  app: NonNullable<ApplicationStatus>;
  onReapply: () => void;
}) {
  const isPending = app.status === 'PENDING';
  const isApproved = app.status === 'APPROVED';
  const isRejected = app.status === 'REJECTED';

  return (
    <div style={styles.page}>
      <style>{PAGE_STYLES}</style>
      <div style={{ ...styles.card, maxWidth: 520, textAlign: 'center' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isPending ? 'rgba(245,158,11,0.12)' : isApproved ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
        }}>
          {isPending && <Clock size={28} color="#f59e0b" />}
          {isApproved && <CheckCircle2 size={28} color="#10b981" />}
          {isRejected && <XCircle size={28} color="#f87171" />}
        </div>

        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f0f0f5' }}>
          {isPending && 'Application Under Review'}
          {isApproved && 'Application Approved!'}
          {isRejected && 'Application Not Approved'}
        </h2>

        <p style={{ fontSize: '0.84rem', color: '#9494b0', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          {isPending && `Your application for "${app.businessName}" is being reviewed. We'll email you within 1–3 business days.`}
          {isApproved && `Welcome to Hustlecare Marketplace! Your vendor profile is live.`}
          {isRejected && (app.reviewNote || 'Your application was not approved at this time. You may reapply with updated information.')}
        </p>

        {isApproved && (
          <Link href="/vendor/dashboard" style={styles.btnPrimary}>
            Go to Vendor Dashboard <ArrowRight size={15} />
          </Link>
        )}
        {isRejected && (
          <button style={styles.btnPrimary} onClick={onReapply}>
            Update & Reapply <ArrowRight size={15} />
          </button>
        )}
        {isPending && (
          <Link href="/" style={styles.btnSecondary}>
            Back to Hustlecare
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const PAGE_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  * { box-sizing: border-box; }
  body { background: #080810; }
`;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#080810',
    fontFamily: "'DM Sans', sans-serif",
    color: '#f0f0f5',
    padding: '2rem 1rem 4rem',
  },
  loadingWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080810',
  },
  header: {
    maxWidth: 680,
    margin: '0 auto 1.5rem',
  },
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.8rem',
    color: '#55556e',
    textDecoration: 'none',
    marginBottom: '1.5rem',
  },
  headerInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '2rem',
  },
  storeBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    background: 'rgba(245,158,11,0.12)',
    border: '1px solid rgba(245,158,11,0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  h1: {
    fontSize: '1.8rem',
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    letterSpacing: '-0.02em',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '0.84rem',
    color: '#55556e',
    margin: '0.2rem 0 0',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  card: {
    maxWidth: 680,
    margin: '0 auto',
    background: '#0f0f1a',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: '2rem',
    animation: 'fadeUp 0.3s ease',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: 10,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#fca5a5',
    fontSize: '0.84rem',
    marginBottom: '1.25rem',
  },
  stepContent: {
    animation: 'fadeUp 0.25s ease',
  },
  stepTitle: {
    fontSize: '1.2rem',
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    letterSpacing: '-0.01em',
    marginBottom: '0.35rem',
    color: '#f0f0f5',
  },
  stepDesc: {
    fontSize: '0.83rem',
    color: '#55556e',
    marginBottom: '1.5rem',
    lineHeight: 1.6,
  },
  fieldGroup: {
    marginBottom: '1.1rem',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontSize: '0.76rem',
    fontWeight: 600,
    color: '#9494b0',
    marginBottom: '0.35rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  req: {
    color: '#f87171',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    padding: '0.65rem 0.9rem',
    color: '#f0f0f5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8,
    padding: '0.65rem 0.9rem',
    color: '#f0f0f5',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.6,
  },
  hint: {
    fontSize: '0.73rem',
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
    padding: '0.65rem 0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRight: 'none',
    borderRadius: '8px 0 0 8px',
    fontSize: '0.78rem',
    color: '#55556e',
    whiteSpace: 'nowrap' as const,
    display: 'flex',
    alignItems: 'center',
  },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
  },
  tagBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.45rem 0.9rem',
    borderRadius: 100,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#9494b0',
    fontSize: '0.82rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'all 0.15s',
  },
  tagBtnActive: {
    background: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.35)',
    color: '#fbbf24',
  },
  sectionDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '0.72rem',
    fontWeight: 700,
    color: '#55556e',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    margin: '1.25rem 0 0.9rem',
  },
  optionalTag: {
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
    padding: '0.5rem 1rem',
    marginBottom: '1.25rem',
  },
  pitchPreview: {
    background: 'rgba(245,158,11,0.05)',
    border: '1px solid rgba(245,158,11,0.15)',
    borderRadius: 10,
    padding: '1rem',
    marginBottom: '1.25rem',
  },
  pitchLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#f59e0b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
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
    padding: '0.9rem 1rem',
    borderRadius: 10,
    background: 'rgba(245,158,11,0.06)',
    border: '1px solid rgba(245,158,11,0.12)',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '2rem',
    paddingTop: '1.25rem',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.65rem 1.4rem',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#0a0a0f',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
    boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.65rem 1.2rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.06)',
    color: '#9494b0',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '0.88rem',
    fontWeight: 600,
    border: '1px solid rgba(255,255,255,0.09)',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
  },
};