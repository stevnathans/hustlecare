// components/apply-help/ApplyHelpForm.tsx
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { FiCheckCircle, FiLoader } from 'react-icons/fi';

export default function ApplyHelpForm() {
  const params = useSearchParams();

  const [form, setForm] = useState({
    requirementName: params.get('requirement') || '',
    countyName: params.get('county') || '',
    businessName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
  });
  const businessId = params.get('businessId');

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const F = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.requirementName.trim() || !form.contactName.trim() || !form.contactPhone.trim()) {
      setError('Please fill in the requirement, your name, and phone number.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/apply-assistance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, businessId: businessId ? Number(businessId) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-emerald-200 p-8 text-center">
        <FiCheckCircle className="mx-auto mb-3 text-emerald-500" size={40} />
        <h2 className="text-lg font-bold text-slate-900 mb-2">Request received</h2>
        <p className="text-sm text-slate-600">
          Thanks — our team will contact you at {form.contactPhone} to help with your{' '}
          {form.requirementName} application{form.countyName ? ` in ${form.countyName}` : ''}.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          What do you need help applying for? *
        </label>
        <input
          className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          value={form.requirementName}
          onChange={F('requirementName')}
          placeholder="e.g. Single Business Permit"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">County</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            value={form.countyName}
            onChange={F('countyName')}
            placeholder="e.g. Nairobi"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Business name</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            value={form.businessName}
            onChange={F('businessName')}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 pt-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Your name *</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            value={form.contactName}
            onChange={F('contactName')}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Phone *</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={form.contactPhone}
              onChange={F('contactPhone')}
              placeholder="+254 700 000 000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Email</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              value={form.contactEmail}
              onChange={F('contactEmail')}
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Anything else we should know?</label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            value={form.notes}
            onChange={F('notes')}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 text-sm disabled:opacity-60"
      >
        {submitting ? <FiLoader className="animate-spin" size={16} /> : null}
        {submitting ? 'Submitting…' : 'Request Help'}
      </button>
    </form>
  );
}