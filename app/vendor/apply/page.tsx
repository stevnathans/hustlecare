/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
// app/vendor/apply/page.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Tracks whether we've completed the first status check — used so
  // background session revalidations (e.g. on window focus) don't
  // yank the whole form out and replace it with a full-page spinner.
  const hasLoadedOnce = useRef(false);

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
    // Only show the blocking full-page loader the first time. Later
    // calls (triggered by session revalidation on tab focus, etc.)
    // happen silently in the background.
    if (!hasLoadedOnce.current) setChecking(true);
    try {
      const res = await fetch('/api/vendors/apply');
      if (res.ok) setExistingApp(await res.json());
    } catch {
      // ignore — keep whatever we had
    } finally {
      setChecking(false);
      hasLoadedOnce.current = true;
    }
  }, []);

  // Depend on primitive values, not the `session` object itself.
  // NextAuth returns a new `session` object reference on every
  // background refetch (e.g. window focus), which would otherwise
  // re-trigger this effect and re-run the application check every
  // time the user switches tabs.
  const userId = session?.user?.id;
  const userRole = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signin?callbackUrl=/vendor/apply');
      return;
    }
    if (status === 'authenticated') {
      if (userRole === 'vendor') {
        router.push('/vendor/dashboard');
        return;
      }
      checkExistingApplication();
    }
  }, [status, userId, userRole, router, checkExistingApplication]);

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

  // Only the very first load blocks with a full-page spinner.
  if (status === 'loading' || (checking && !hasLoadedOnce.current)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 size={28} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (existingApp) {
    return <ApplicationStatusCard app={existingApp} onReapply={() => setExistingApp(null)} />;
  }

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-16 pt-6 text-gray-900">
      {/* Back link */}
      <Link
        href="/"
        className="mx-auto mb-7 flex max-w-[660px] items-center gap-1 text-sm text-gray-500 transition-colors hover:text-emerald-600"
      >
        <ChevronLeft size={15} /> Hustlecare
      </Link>

      {/* Header */}
      <div className="mx-auto mb-7 flex max-w-[660px] items-center gap-3">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50">
          <Store size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Become a Vendor</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Reach thousands of entrepreneurs starting their businesses
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mx-auto mb-6 max-w-[660px]">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300 ${
                  step > s.id
                    ? 'bg-emerald-600 text-white'
                    : step === s.id
                    ? 'bg-emerald-500 text-white ring-4 ring-emerald-100'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {step > s.id ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span
                className={`hidden text-xs font-medium transition-colors duration-300 sm:inline ${
                  step >= s.id ? 'text-gray-800' : 'text-gray-400'
                }`}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="mx-1 h-px min-w-[16px] flex-1 bg-gray-200">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: step > s.id ? '100%' : '0%' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Mobile progress bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-200 sm:hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Card — single container, no re-mount on step change */}
      <div className="mx-auto max-w-[660px] rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            <XCircle size={14} className="flex-shrink-0" /> {error}
          </div>
        )}

        {/* Step 1 — hidden, not unmounted, so no data loss */}
        <div className={step === 1 ? 'block' : 'hidden'}>
          <StepHeading
            title="Your store identity"
            desc="This is how customers will find and recognise your storefront."
          />

          <Field label="Business / Store Name" required>
            <input
              className={inputCls}
              placeholder="e.g. TechHub Kenya"
              value={form.businessName}
              onChange={e => handleBusinessNameChange(e.target.value)}
            />
          </Field>

          <Field label="Store URL" required>
            <div className="flex items-stretch">
              <span className="flex items-center whitespace-nowrap rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-3 font-mono text-xs text-gray-500">
                hustlecare.com/vendors/
              </span>
              <input
                className={`${inputCls} rounded-l-none`}
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
            {!slugChecking && slugAvailable === true && (
              <Hint color="text-emerald-600">✓ Available</Hint>
            )}
            {!slugChecking && slugAvailable === false && (
              <Hint color="text-red-500">✗ Already taken — try another</Hint>
            )}
            <Hint>Lowercase letters, numbers, and hyphens only. Min 3 characters.</Hint>
          </Field>

          <Field label="Tagline">
            <input
              className={inputCls}
              placeholder="e.g. Quality tech at startup prices"
              value={form.tagline}
              maxLength={120}
              onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            />
            <Hint>{form.tagline.length}/120</Hint>
          </Field>

          <Field label="Logo URL">
            <input
              className={inputCls}
              placeholder="https://…"
              value={form.logo}
              onChange={e => setForm(f => ({ ...f, logo: e.target.value }))}
            />
          </Field>
        </div>

        {/* Step 2 */}
        <div className={step === 2 ? 'block' : 'hidden'}>
          <StepHeading
            title="About your business"
            desc="Help customers understand who you are and how to reach you."
          />

          <Field label="Business Description">
            <textarea
              className={`${inputCls} resize-y leading-relaxed`}
              rows={4}
              placeholder="Tell entrepreneurs what you sell, your story, and why they should buy from you…"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Website" icon={<Globe size={12} />}>
              <input
                className={inputCls}
                placeholder="https://yourbusiness.com"
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              />
            </Field>
            <Field label="Location" icon={<MapPin size={12} />}>
              <input
                className={inputCls}
                placeholder="Nairobi, Kenya"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Phone" icon={<Phone size={12} />}>
            <input
              className={`${inputCls} max-w-[280px]`}
              placeholder="+254 700 000 000"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </Field>

          <div className="mt-5 mb-3.5 flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-wider text-gray-400">
            Social Links{' '}
            <span className="text-[0.72rem] font-normal italic normal-case tracking-normal text-gray-300">
              optional
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                { icon: <Twitter size={12} />, key: 'twitterUrl', label: 'Twitter / X', ph: 'https://x.com/…' },
                { icon: <Instagram size={12} />, key: 'instagramUrl', label: 'Instagram', ph: 'https://instagram.com/…' },
                { icon: <Facebook size={12} />, key: 'facebookUrl', label: 'Facebook', ph: 'https://facebook.com/…' },
                { icon: <Linkedin size={12} />, key: 'linkedinUrl', label: 'LinkedIn', ph: 'https://linkedin.com/…' },
              ] as { icon: React.ReactNode; key: string; label: string; ph: string }[]
            ).map(({ icon, key, label, ph }) => (
              <Field key={key} label={label} icon={icon}>
                <input
                  className={inputCls}
                  placeholder={ph}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </Field>
            ))}
          </div>
        </div>

        {/* Step 3 */}
        <div className={step === 3 ? 'block' : 'hidden'}>
          <StepHeading
            title="What will you sell?"
            desc="Select the product categories you plan to list. This helps us match your products to the right businesses."
          />

          <Field label="Product Categories" required>
            <div className="flex flex-wrap gap-2">
              {PRODUCT_CATEGORIES.map(cat => {
                const active = form.productCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-150 active:scale-95 ${
                      active
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                  >
                    {active && <CheckCircle2 size={13} />}
                    {cat}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Why do you want to sell on Hustlecare?" required>
            <textarea
              className={`${inputCls} resize-y leading-relaxed`}
              rows={5}
              placeholder="Tell us about your products, your target market, and why Hustlecare is the right fit for your business…"
              value={form.pitchNote}
              onChange={e => setForm(f => ({ ...f, pitchNote: e.target.value }))}
            />
            <Hint>Minimum 20 characters. This helps our team review your application.</Hint>
          </Field>
        </div>

        {/* Step 4 — review */}
        <div className={step === 4 ? 'block' : 'hidden'}>
          <StepHeading
            title="Review your application"
            desc="Everything look good? Submit to begin the review process."
          />

          <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4">
            <ReviewRow label="Store Name" value={form.businessName} />
            <ReviewRow label="Store URL" value={`/vendors/${form.slug}`} />
            {form.tagline && <ReviewRow label="Tagline" value={form.tagline} />}
            {form.location && <ReviewRow label="Location" value={form.location} />}
            {form.website && <ReviewRow label="Website" value={form.website} />}
            <ReviewRow
              label="Categories"
              value={form.productCategories.length > 0 ? form.productCategories.join(', ') : '—'}
              noBorder
            />
          </div>

          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
            <div className="mb-1.5 text-[0.66rem] font-bold uppercase tracking-wider text-emerald-700">
              Your pitch
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {form.pitchNote || '—'}
            </p>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
            <Clock size={14} className="mt-0.5 flex-shrink-0 text-amber-500" />
            <p className="m-0 text-sm leading-relaxed text-gray-600">
              Applications are typically reviewed within{' '}
              <strong className="text-gray-800">1–3 business days</strong>. You&rsquo;ll receive
              an email once a decision is made.
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="mt-7 flex items-center gap-3 border-t border-gray-100 pt-5">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4.5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ChevronLeft size={14} /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < 4 ? (
            <button
              type="button"
              onClick={goNext}
              disabled={!canProceed()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-emerald-600 disabled:hover:shadow-sm"
            >
              Continue <ChevronRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-emerald-700 hover:shadow disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  Submit Application <ArrowRight size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared class strings ───────────────────────────────────────── */
const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';

/* ── Small reusable sub-components ─────────────────────────────── */

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6">
      <h2 className="mb-1 text-lg font-bold tracking-tight text-gray-900">{title}</h2>
      <p className="text-sm leading-relaxed text-gray-500">{desc}</p>
    </div>
  );
}

function Field({
  label,
  children,
  required,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Hint({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className={`mt-1 block text-xs ${color ?? 'text-gray-400'}`}>{children}</span>
  );
}

function ReviewRow({
  label,
  value,
  noBorder,
}: {
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  return (
    <div
      className={`flex gap-4 py-2.5 ${noBorder ? '' : 'border-b border-gray-200'}`}
    >
      <span className="w-24 flex-shrink-0 text-xs text-gray-400">{label}</span>
      <span className="break-words text-sm text-gray-800">{value}</span>
    </div>
  );
}

function ApplicationStatusCard({
  app,
  onReapply,
}: {
  app: NonNullable<ApplicationStatus>;
  onReapply: () => void;
}) {
  const isPending = app.status === 'PENDING';
  const isApproved = app.status === 'APPROVED';
  const isRejected = app.status === 'REJECTED';

  return (
    <div className="min-h-screen bg-gray-50 px-4 pb-16 pt-6">
      <div className="mx-auto mt-12 max-w-[500px] rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-4 flex h-15 w-15 items-center justify-center rounded-full ${
            isPending
              ? 'bg-amber-50'
              : isApproved
              ? 'bg-emerald-50'
              : 'bg-red-50'
          }`}
          style={{ width: 60, height: 60 }}
        >
          {isPending && <Clock size={26} className="text-amber-500" />}
          {isApproved && <CheckCircle2 size={26} className="text-emerald-600" />}
          {isRejected && <XCircle size={26} className="text-red-500" />}
        </div>

        <h2 className="mb-2 text-lg font-bold text-gray-900">
          {isPending && 'Application Under Review'}
          {isApproved && 'Application Approved!'}
          {isRejected && 'Application Not Approved'}
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-gray-500">
          {isPending &&
            `Your application for "${app.businessName}" is being reviewed. We'll email you within 1–3 business days.`}
          {isApproved && 'Welcome to Hustlecare Marketplace! Your vendor profile is live.'}
          {isRejected &&
            (app.reviewNote ||
              'Your application was not approved at this time. You may reapply with updated information.')}
        </p>

        {isApproved && (
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Go to Vendor Dashboard <ArrowRight size={14} />
          </Link>
        )}
        {isRejected && (
          <button
            type="button"
            onClick={onReapply}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            Update &amp; Reapply <ArrowRight size={14} />
          </button>
        )}
        {isPending && (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Back to Hustlecare
          </Link>
        )}
      </div>
    </div>
  );
}