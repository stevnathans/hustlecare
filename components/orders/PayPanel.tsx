'use client';
// components/orders/PayPanel.tsx
//
// Pay the next amount due on an order: sends the M-Pesa prompt, waits for the
// customer's PIN, and confirms. Used on the "pay your deposit" screen right
// after the questionnaire and on the customer's order page (deposit, full
// amount, or balance). What is due is decided by the server.

import { useEffect, useRef, useState } from 'react';
import { FiCheckCircle, FiLoader, FiAlertCircle, FiClock, FiSmartphone } from 'react-icons/fi';
import { STK_POLL_INTERVAL_MS, STK_POLL_MAX_MS, type ApplyPaymentMode } from '@/lib/applyAssistance/config';

interface Props {
  token: string;
  amount: number;
  /** e.g. "deposit", "balance", "fee": used in the button and messages */
  label: string;
  paymentMode: ApplyPaymentMode;
  defaultPhone: string;
  onPaid?: () => void;
}

type Phase = 'idle' | 'waiting' | 'timedout' | 'manual' | 'paid';

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-US')}`;
const inputClass =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';

export default function PayPanel({ token, amount, label, paymentMode, defaultPhone, onPaid }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState<{ payTo: string | null; payFromPhone: string | null } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => stopPolling, []);

  function beginPolling() {
    stopPolling();
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/service-orders/${token}/payment-status`, { cache: 'no-store' });
        const data = await res.json();
        if (data.paid) {
          stopPolling();
          setPhase('paid');
          onPaid?.();
          return;
        }
        if (data.payment?.status === 'FAILED') {
          stopPolling();
          setError(data.payment.failureReason || 'The payment was not completed.');
          setPhase('idle');
          return;
        }
      } catch {
        // network blip: keep polling
      }
      if (Date.now() - startedAt > STK_POLL_MAX_MS) {
        stopPolling();
        setPhase('timedout');
      }
    }, STK_POLL_INTERVAL_MS);
  }

  async function start() {
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const res = await fetch(`/api/service-orders/${token}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mpesaPhone: phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start the payment.');
      if (data.mode === 'manual') {
        setManual({ payTo: data.payTo, payFromPhone: data.payFromPhone });
        setPhase('manual');
      } else {
        setPhase('waiting');
        beginPolling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const box = 'rounded-2xl border border-slate-200 bg-white p-5';

  if (paymentMode === 'off') {
    return (
      <div className={box}>
        <p className="text-sm font-semibold text-slate-900">Payment: {ksh(amount)}</p>
        <p className="text-sm text-slate-600 mt-1">Online payment is not switched on yet. We will contact you with payment details.</p>
      </div>
    );
  }

  if (phase === 'paid') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" role="status">
        <FiCheckCircle className="mx-auto mb-2 text-emerald-600" size={32} />
        <p className="font-semibold text-slate-900">Payment received. Thank you.</p>
      </div>
    );
  }

  if (phase === 'manual' && manual) {
    return (
      <div className={box} role="status">
        <p className="font-semibold text-slate-900 mb-1">Pay with M-Pesa</p>
        <p className="text-sm text-slate-600">
          Send {ksh(amount)} by M-Pesa
          {manual.payTo ? <> to <strong className="text-slate-900">{manual.payTo}</strong></> : null}.
          {manual.payFromPhone ? <> Please pay from {manual.payFromPhone} so we can match your payment.</> : null}
        </p>
        <p className="text-sm text-slate-600 mt-2">We confirm payments by hand. As soon as we see yours we will email you; you do not need to do anything else.</p>
      </div>
    );
  }

  if (phase === 'waiting') {
    return (
      <div className={`${box} text-center`} aria-live="polite">
        <FiSmartphone className="mx-auto mb-2 text-emerald-500" size={30} />
        <p className="font-semibold text-slate-900 mb-1">Check your phone</p>
        <p className="text-sm text-slate-600 mb-3">We sent an M-Pesa prompt for {ksh(amount)}. Enter your M-Pesa PIN to finish.</p>
        <FiLoader className="mx-auto animate-spin text-slate-400" size={18} />
      </div>
    );
  }

  if (phase === 'timedout') {
    return (
      <div className={`${box} text-center`}>
        <FiClock className="mx-auto mb-2 text-slate-400" size={30} />
        <p className="font-semibold text-slate-900 mb-1">Still waiting for M-Pesa</p>
        <p className="text-sm text-slate-600 mb-4">If you already entered your PIN, give it a minute and check again. If the prompt never came, send a new one.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button type="button" onClick={() => { setPhase('waiting'); beginPolling(); }} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 text-sm">
            Check again
          </button>
          <button type="button" onClick={() => { stopPolling(); setError(''); setPhase('idle'); }} className="rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold px-5 py-2.5 text-sm">
            Send a new prompt
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${box} space-y-4`}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate-600 capitalize">{label}</span>
        <span className="text-xl font-bold text-slate-900">{ksh(amount)}</span>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" role="alert">
          <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {paymentMode === 'daraja' && (
        <div>
          <label htmlFor="payPhone" className="block text-sm font-medium text-slate-700 mb-1.5">M-Pesa number to charge</label>
          <input id="payPhone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0712 345 678" />
        </div>
      )}

      <button type="button" onClick={start} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-sm disabled:opacity-60">
        {busy ? <FiLoader className="animate-spin" size={16} /> : null}
        {paymentMode === 'daraja' ? `Pay ${ksh(amount)} with M-Pesa` : 'Show payment instructions'}
      </button>
    </div>
  );
}