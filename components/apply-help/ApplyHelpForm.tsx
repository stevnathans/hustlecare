'use client';
// components/apply-help/ApplyHelpForm.tsx
//
// Two-step "Apply For Me" form:
//   1. Your details  → saved as a lead on the server as soon as you continue
//   2. Pay           → M-Pesa prompt (or manual instructions), then a
//                      confirmation once the payment is confirmed
// If there's no price set for the requirement (or online payment is off),
// step 1 ends with "request received" and the team follows up.

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { FiCheckCircle, FiLoader, FiAlertCircle, FiClock, FiSmartphone } from 'react-icons/fi';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_MARKET } from '@/lib/markets';
import {
  APPLY_REQUIRE_EMAIL,
  STK_POLL_INTERVAL_MS,
  STK_POLL_MAX_MS,
  type ApplyPaymentMode,
} from '@/lib/applyAssistance/config';

interface OfferingView {
  serviceFee: number;
  currency: string;
  typicalDaysMin: number | null;
  typicalDaysMax: number | null;
  whatsIncluded: string[];
  documents: { label: string; isRequired: boolean }[];
}

interface Props {
  initial: {
    requirementName: string;
    countyId: number | null;
    businessId: number | null;
    businessName: string | null;
    sourcePath: string;
  };
  counties: { id: number; name: string }[];
  offering: OfferingView | null;
  paymentMode: ApplyPaymentMode;
  /** Estimated government fee per county id (keys arrive as strings). */
  govFeeByCounty: Record<string, { low: number; high: number }>;
  /** Account details for signed-in visitors; empty strings otherwise. Still editable. */
  prefill: { contactName: string; contactEmail: string; contactPhone: string };
  /** Set when the visitor came from a "continue to payment" link: skips straight to paying. */
  resume: {
    token: string;
    paymentMode: ApplyPaymentMode;
    contactPhone: string;
    contactEmail: string | null;
    serviceFee: number;
    currency: string;
  } | null;
}

interface LeadResult {
  token: string;
  mode: 'pay' | 'received';
  paymentMode: ApplyPaymentMode;
  contactPhone: string;
  contactEmail: string | null;
  quote: {
    serviceFee: number;
    currency: string;
    typicalDaysMin: number | null;
    typicalDaysMax: number | null;
    whatsIncluded: string[];
  } | null;
}

interface ManualInfo {
  amount: number;
  payTo: string | null;
  payFromPhone: string | null;
}

type Step = 'details' | 'pay' | 'waiting' | 'manual' | 'paid' | 'received';

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';
const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

function turnaround(min: number | null, max: number | null): string | null {
  if (min && max && min !== max) return `${min}–${max} working days`;
  const one = max ?? min;
  return one ? `${one} working days` : null;
}

function GovFeeNote({ estimate, countySelected }: { estimate?: { low: number; high: number }; countySelected: boolean }) {
  const range = estimate
    ? estimate.low === estimate.high
      ? `about ${formatCurrency(estimate.low, DEFAULT_MARKET)}`
      : `roughly ${formatCurrency(estimate.low, DEFAULT_MARKET)} to ${formatCurrency(estimate.high, DEFAULT_MARKET)}`
    : null;
  return (
    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
      {range
        ? `The government fee is separate and goes straight to the authority: ${range}. This is an estimate. We confirm the exact amount before you pay it.`
        : countySelected
          ? 'The government fee is separate and goes straight to the authority. We tell you the exact amount before you pay it.'
          : 'The government fee is separate and goes straight to the authority. Pick your county to see an estimate.'}
    </p>
  );
}

export default function ApplyHelpForm({ initial, counties, offering, paymentMode, govFeeByCounty, prefill, resume }: Props) {
  const [step, setStep] = useState<Step>(resume ? 'pay' : 'details');
  const [form, setForm] = useState({
    requirementName: initial.requirementName,
    countyId: initial.countyId ? String(initial.countyId) : '',
    contactName: prefill.contactName,
    contactPhone: prefill.contactPhone,
    contactEmail: prefill.contactEmail,
    notes: '',
    consent: false,
    website: '', // honeypot — real visitors never see this field
  });
  const [lead, setLead] = useState<LeadResult | null>(
    resume
      ? {
          token: resume.token,
          mode: 'pay',
          paymentMode: resume.paymentMode,
          contactPhone: resume.contactPhone,
          contactEmail: resume.contactEmail,
          quote: {
            serviceFee: resume.serviceFee,
            currency: resume.currency,
            typicalDaysMin: null,
            typicalDaysMax: null,
            whatsIncluded: [],
          },
        }
      : null,
  );
  const [mpesaPhone, setMpesaPhone] = useState(resume?.contactPhone ?? '');
  const [manual, setManual] = useState<ManualInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timedOut, setTimedOut] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => stopPolling, []);

  const requirementLocked = !!initial.requirementName;
  const fee = lead?.quote?.serviceFee ?? offering?.serviceFee ?? null;
  const countyName = counties.find((c) => String(c.id) === form.countyId)?.name ?? '';
  const time = offering ? turnaround(offering.typicalDaysMin, offering.typicalDaysMax) : null;
  const estimate = form.countyId ? govFeeByCounty[form.countyId] : undefined;

  const set =
    (key: 'requirementName' | 'countyId' | 'contactName' | 'contactPhone' | 'contactEmail' | 'notes' | 'website') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/apply-assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirementName: form.requirementName,
          countyId: form.countyId ? Number(form.countyId) : undefined,
          businessId: initial.businessId ?? undefined,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          notes: form.notes,
          consent: form.consent,
          sourcePath: initial.sourcePath,
          website: form.website,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save your details.');
      setLead(data as LeadResult);
      setMpesaPhone(form.contactPhone);
      setStep(data.mode === 'pay' ? 'pay' : 'received');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function beginPolling(token: string) {
    stopPolling();
    setTimedOut(false);
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/apply-assistance/${token}/payment-status`, { cache: 'no-store' });
        const data = await res.json();
        if (data.paid) {
          stopPolling();
          setStep('paid');
          return;
        }
        if (data.payment?.status === 'FAILED') {
          stopPolling();
          setError(data.payment.failureReason || 'The payment was not completed.');
          setStep('pay');
          return;
        }
      } catch {
        // network blip — keep polling
      }
      if (Date.now() - startedAt > STK_POLL_MAX_MS) {
        stopPolling();
        setTimedOut(true);
      }
    }, STK_POLL_INTERVAL_MS);
  }

  async function startPayment() {
    if (!lead || submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/apply-assistance/${lead.token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpesaPhone }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setStep('paid');
          return;
        }
        throw new Error(data.error || 'Could not start the payment.');
      }
      if (data.mode === 'manual') {
        setManual({ amount: data.amount, payTo: data.payTo, payFromPhone: data.payFromPhone });
        setStep('manual');
      } else {
        setStep('waiting');
        beginPolling(lead.token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const card = 'bg-white rounded-2xl border border-slate-200 p-6';

  // ── Final states ───────────────────────────────────────────────────────────
  const trackHref = lead ? `/apply-help/track/${lead.token}` : null;
  const linkClass =
    'inline-block rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 text-sm';

  if (step === 'paid') {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center" role="status">
        <FiCheckCircle className="mx-auto mb-3 text-emerald-500" size={40} />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Payment received</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          Thank you. We have emailed {lead?.contactEmail ?? 'you'} what we need for your {form.requirementName}
          {countyName ? ` in ${countyName}` : ''}. The next step is uploading your documents.
        </p>
        {trackHref && (
          <Link href={trackHref} rel="nofollow" className={linkClass}>
            Upload your documents
          </Link>
        )}
      </div>
    );
  }

  if (step === 'received') {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center" role="status">
        <FiCheckCircle className="mx-auto mb-3 text-emerald-500" size={40} />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Request received</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          Thanks. We will contact you on {lead?.contactPhone ?? 'your phone'}
          {lead?.contactEmail ? ` and at ${lead.contactEmail}` : ''} with the price and what happens next for your{' '}
          {form.requirementName}
          {countyName ? ` in ${countyName}` : ''}.
        </p>
      </div>
    );
  }

  if (step === 'manual' && manual) {
    return (
      <div className={card} role="status">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Pay with M-Pesa</h2>
        <p className="text-sm text-slate-600 mb-5">
          Send {formatCurrency(manual.amount, DEFAULT_MARKET)} by M-Pesa
          {manual.payTo ? <> to <strong className="text-slate-900">{manual.payTo}</strong></> : null}.
          {manual.payFromPhone ? <> Please pay from {manual.payFromPhone} so we can match your payment.</> : null}
        </p>
        <p className="text-sm text-slate-600 mb-5">
          We confirm payments by hand. As soon as we see yours, we will email you what we need. You can follow your
          request on its own page.
        </p>
        {trackHref && (
          <Link href={trackHref} rel="nofollow" className={linkClass}>
            Follow your request
          </Link>
        )}
      </div>
    );
  }

  if (step === 'waiting') {
    return (
      <div className={`${card} text-center`} aria-live="polite">
        {timedOut ? (
          <>
            <FiClock className="mx-auto mb-3 text-slate-400" size={36} />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Still waiting for M-Pesa</h2>
            <p className="text-sm text-slate-600 mb-5">
              If you already entered your PIN, give it a minute and check again. If the prompt never came, send a new
              one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => lead && beginPolling(lead.token)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 text-sm"
              >
                Check again
              </button>
              <button
                type="button"
                onClick={() => {
                  stopPolling();
                  setError('');
                  setStep('pay');
                }}
                className="rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-5 py-2.5 text-sm"
              >
                Send a new prompt
              </button>
            </div>
          </>
        ) : (
          <>
            <FiSmartphone className="mx-auto mb-3 text-emerald-500" size={36} />
            <h2 className="text-lg font-bold text-slate-900 mb-2">Check your phone</h2>
            <p className="text-sm text-slate-600 mb-4">
              We sent an M-Pesa prompt for {fee !== null ? formatCurrency(fee, DEFAULT_MARKET) : 'the service fee'}.
              Enter your M-Pesa PIN to finish.
            </p>
            <FiLoader className="mx-auto animate-spin text-slate-400" size={20} />
          </>
        )}
      </div>
    );
  }

  // ── Step 2: review and pay ─────────────────────────────────────────────────
  if (step === 'pay') {
    return (
      <div className={`${card} space-y-5`}>
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">Pay the service fee</h2>
          <p className="text-sm text-slate-600">
            {form.requirementName}
            {countyName ? ` · ${countyName}` : ''}
            {initial.businessName ? ` · for ${initial.businessName}` : ''}
          </p>
        </div>

        {fee !== null && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Hustlecare service fee</span>
              <span className="text-xl font-bold text-slate-900">{formatCurrency(fee, DEFAULT_MARKET)}</span>
            </div>
            <GovFeeNote estimate={estimate} countySelected={!!form.countyId} />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {lead?.paymentMode === 'daraja' && (
          <div>
            <label htmlFor="mpesaPhone" className={labelClass}>
              M-Pesa number to charge
            </label>
            <input
              id="mpesaPhone"
              className={inputClass}
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
            />
          </div>
        )}

        <button
          type="button"
          onClick={startPayment}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-sm disabled:opacity-60"
        >
          {submitting ? <FiLoader className="animate-spin" size={16} /> : null}
          {lead?.paymentMode === 'daraja' ? 'Send M-Pesa prompt' : 'Show payment instructions'}
        </button>
      </div>
    );
  }

  // ── Step 1: your details ───────────────────────────────────────────────────
  return (
    <form onSubmit={submitDetails} className="space-y-5">
      {offering && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-slate-600">Service fee</span>
            <span className="text-xl font-bold text-slate-900">{formatCurrency(offering.serviceFee, DEFAULT_MARKET)}</span>
          </div>
          {time && <p className="text-sm text-slate-600 mt-1">Usually done in {time} once we have your documents.</p>}
          {offering.whatsIncluded.length > 0 && (
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700 list-disc pl-5">
              {offering.whatsIncluded.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {offering.documents.length > 0 && (
            <p className="text-sm text-slate-600 mt-3">
              You will need: {offering.documents.map((d) => d.label).join(', ')}.
            </p>
          )}
          <GovFeeNote estimate={estimate} countySelected={!!form.countyId} />
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
            <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {requirementLocked ? (
          <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700">
            Applying for <strong className="text-slate-900">{form.requirementName}</strong>
            {initial.businessName ? <> for your {initial.businessName} business</> : null}
          </div>
        ) : (
          <div>
            <label htmlFor="requirementName" className={labelClass}>
              What do you need help applying for?
            </label>
            <input
              id="requirementName"
              className={inputClass}
              value={form.requirementName}
              onChange={set('requirementName')}
              placeholder="e.g. Single Business Permit"
              required
            />
          </div>
        )}

        <div>
          <label htmlFor="countyId" className={labelClass}>
            County where your business is
          </label>
          <select id="countyId" className={inputClass} value={form.countyId} onChange={set('countyId')}>
            <option value="">Select a county</option>
            {counties.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="contactName" className={labelClass}>
            Your name
          </label>
          <input
            id="contactName"
            className={inputClass}
            value={form.contactName}
            onChange={set('contactName')}
            autoComplete="name"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="contactPhone" className={labelClass}>
              Phone (WhatsApp if you can)
            </label>
            <input
              id="contactPhone"
              className={inputClass}
              value={form.contactPhone}
              onChange={set('contactPhone')}
              inputMode="tel"
              autoComplete="tel"
              placeholder="0712 345 678"
              required
            />
          </div>
          <div>
            <label htmlFor="contactEmail" className={labelClass}>
              Email{APPLY_REQUIRE_EMAIL ? '' : ' (optional)'}
            </label>
            <input
              id="contactEmail"
              type="email"
              className={inputClass}
              value={form.contactEmail}
              onChange={set('contactEmail')}
              autoComplete="email"
              required={APPLY_REQUIRE_EMAIL}
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Anything else we should know? (optional)
          </label>
          <textarea id="notes" rows={3} className={inputClass} value={form.notes} onChange={set('notes')} />
        </div>

        {/* Honeypot: hidden from people, tempting to bots. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={set('website')}
          />
        </div>

        <label className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          />
          <span>
            I agree that Hustlecare may contact me by WhatsApp, SMS and email about this request. See our{' '}
            <a href="/privacy" className="text-emerald-700 underline" target="_blank" rel="noopener">
              privacy policy
            </a>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-sm disabled:opacity-60"
        >
          {submitting ? <FiLoader className="animate-spin" size={16} /> : null}
          {submitting
            ? 'Saving…'
            : offering && paymentMode !== 'off'
              ? 'Continue to payment'
              : 'Send my request'}
        </button>
      </div>
    </form>
  );
}