'use client';
// components/orders/PayPanel.tsx
//
// Pay the next amount due on an order: the deposit, the full amount, or the
// balance. What is due is decided by the server.
//
// Manual payment (and while online payment is switched off): shows the exact
// M-Pesa steps and the number to pay. Automatic payment: sends an M-Pesa
// prompt to the customer's phone and waits for their PIN, and still shows the
// number for anyone who prefers to pay themselves.

import { useEffect, useRef, useState } from 'react';
import { FiCheckCircle, FiLoader, FiAlertCircle, FiClock, FiSmartphone } from 'react-icons/fi';
import { STK_POLL_INTERVAL_MS, STK_POLL_MAX_MS, type ApplyPaymentMode } from '@/lib/applyAssistance/config';
import { MANUAL_PAY_NUMBER, MANUAL_PAY_WHATSAPP } from '@/lib/payments/manual-config';

interface Props {
  token: string;
  amount: number;
  /** e.g. "deposit", "balance", "fee": used in the button and messages */
  label: string;
  paymentMode: ApplyPaymentMode;
  defaultPhone: string;
  /** The order number, quoted when the customer sends their confirmation message */
  orderRef?: string;
  onPaid?: () => void;
}

type Phase = 'idle' | 'waiting' | 'timedout' | 'paid';

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-US')}`;
const inputClass =
  'w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100';

function ManualInstructions({ amount, fromPhone, orderRef, compact }: { amount: number; fromPhone: string; orderRef?: string; compact?: boolean }) {
  return (
    <div className={`rounded-2xl border border-emerald-200 bg-emerald-50 ${compact ? 'p-4' : 'p-5'}`} role="status">
      <p className="font-semibold text-slate-900 mb-2">
        {compact ? 'Or pay yourself by M-Pesa' : `Pay ${ksh(amount)} by M-Pesa`}
      </p>
      <ol className="text-sm text-slate-700 space-y-1.5 list-decimal pl-5">
        <li>Open M-Pesa and choose <strong>Send Money</strong>.</li>
        <li>Enter the number <strong className="text-base text-slate-900">{MANUAL_PAY_NUMBER}</strong>.</li>
        <li>Enter the amount <strong>{ksh(amount)}</strong>.</li>
        {fromPhone && <li>Pay from <strong>{fromPhone}</strong>, the number you gave us, so we can match your payment.</li>}
        <li>
          Send your M-Pesa confirmation message to{' '}
          <a href={`https://wa.me/${MANUAL_PAY_WHATSAPP}`} className="font-semibold text-emerald-700 underline" target="_blank" rel="noopener">
            {MANUAL_PAY_NUMBER} on WhatsApp
          </a>
          {orderRef ? <>, quoting <strong>{orderRef}</strong></> : null}.
        </li>
      </ol>
      <p className="text-xs text-slate-600 mt-3">We confirm payments by hand and email you as soon as we see yours. You do not need to do anything else on this page.</p>
    </div>
  );
}

export default function PayPanel({ token, amount, label, paymentMode, defaultPhone, orderRef, onPaid }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [phone, setPhone] = useState(defaultPhone);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };
  useEffect(() => stopPolling, []);

  // Manual payment, or online payment not switched on yet: show the steps straight away.
  if (paymentMode !== 'daraja') {
    return <ManualInstructions amount={amount} fromPhone={defaultPhone} orderRef={orderRef} />;
  }

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
      setPhase('waiting');
      beginPolling();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const box = 'rounded-2xl border border-slate-200 bg-white p-5';

  if (phase === 'paid') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center" role="status">
        <FiCheckCircle className="mx-auto mb-2 text-emerald-600" size={32} />
        <p className="font-semibold text-slate-900">Payment received. Thank you.</p>
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
      <div className="space-y-4">
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
        <ManualInstructions amount={amount} fromPhone={defaultPhone} orderRef={orderRef} compact />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

        <div>
          <label htmlFor="payPhone" className="block text-sm font-medium text-slate-700 mb-1.5">M-Pesa number to charge</label>
          <input id="payPhone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0712 345 678" />
        </div>

        <button type="button" onClick={start} disabled={busy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-sm disabled:opacity-60">
          {busy ? <FiLoader className="animate-spin" size={16} /> : null}
          Pay {ksh(amount)} with M-Pesa
        </button>
      </div>
      <ManualInstructions amount={amount} fromPhone={defaultPhone} orderRef={orderRef} compact />
    </div>
  );
}