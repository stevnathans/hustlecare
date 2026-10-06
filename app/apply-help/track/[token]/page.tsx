// app/apply-help/track/[token]/page.tsx
//
// The customer's private page for one request. The long random token in the
// URL is the only key, so the page is never indexed and never leaks its
// address to other sites.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FiCheckCircle, FiDownload } from 'react-icons/fi';
import { prisma } from '@/lib/prisma';
import { createSignedDownloadUrl } from '@/lib/storage/privateStorage';
import { formatCurrency } from '@/lib/currency';
import { DEFAULT_MARKET } from '@/lib/markets';
import TrackingClient from '@/components/apply-help/TrackingClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Track your application | HustleCare',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

const dateFmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const r = await prisma.applyAssistanceRequest.findUnique({
    where: { publicToken: token },
    include: { documents: { orderBy: { createdAt: 'asc' } } },
  });
  if (!r) notFound();

  const offering = r.templateId
    ? await prisma.applyServiceOffering.findUnique({
        where: { templateId: r.templateId },
        include: { documents: { orderBy: { displayOrder: 'asc' } } },
      })
    : null;

  const deliverables = await Promise.all(
    r.documents
      .filter((d) => d.isDeliverable)
      .map(async (d) => {
        try {
          return { id: d.id, label: d.label, fileName: d.fileName, url: await createSignedDownloadUrl(d.storagePath, 3600, d.fileName) };
        } catch {
          return { id: d.id, label: d.label, fileName: d.fileName, url: null };
        }
      }),
  );

  const stage = r.stage;
  const canChange = stage === 'PAID' || stage === 'READY';
  const title = `${r.requirementName}${r.countyName ? ` · ${r.countyName}` : ''}`;

  // The four milestones the customer cares about.
  const order = ['LEAD', 'PAID', 'READY', 'SUBMITTED', 'COMPLETED'] as const;
  const at = stage === 'CANCELLED' ? -1 : order.indexOf(stage as (typeof order)[number]);
  const steps = [
    { label: 'Payment', done: at >= 1, date: r.paidAt },
    { label: 'Documents', done: at >= 2, date: null },
    { label: 'Submitted', done: at >= 3, date: r.submittedAt },
    { label: 'Ready', done: at >= 4, date: r.completedAt },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <p className="text-sm font-medium text-emerald-700 mb-1">Your application</p>
      <h1 className="text-2xl font-bold text-slate-900 mb-1">{title}</h1>
      <p className="text-sm text-slate-600 mb-6">
        For {r.contactName}
        {r.businessName ? ` · ${r.businessName}` : ''}
      </p>

      {stage === 'CANCELLED' ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
          <p className="font-semibold text-slate-900">This request was cancelled</p>
          <p className="text-sm text-slate-600 mt-1">
            {r.cancelReason ? `${r.cancelReason} ` : ''}If that is not what you expected, reply to any of our emails and we
            will sort it out.
          </p>
        </div>
      ) : (
        <ol className="grid grid-cols-4 gap-2 mb-6" aria-label="Progress">
          {steps.map((s, i) => (
            <li key={s.label} className="text-center">
              <div
                className={`mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  s.done ? 'bg-emerald-600 text-white' : i === at ? 'border-2 border-emerald-600 text-emerald-700' : 'border border-slate-300 text-slate-400'
                }`}
              >
                {s.done ? <FiCheckCircle size={16} /> : i + 1}
              </div>
              <p className={`text-xs ${s.done || i === at ? 'font-medium text-slate-900' : 'text-slate-500'}`}>{s.label}</p>
              {s.date && <p className="text-[11px] text-slate-500">{dateFmt(s.date)}</p>}
            </li>
          ))}
        </ol>
      )}

      {stage === 'LEAD' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
          <p className="font-semibold text-slate-900">We have not received your payment yet</p>
          <p className="text-sm text-slate-600 mt-1">
            {r.serviceFee ? `The service fee is ${formatCurrency(r.serviceFee, DEFAULT_MARKET)}. ` : ''}
            If you have just paid, give it a minute and refresh this page. Otherwise you can pick up where you left off.
          </p>
          <Link
            href={`/apply-help?resume=${token}`}
            rel="nofollow"
            className="mt-3 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Continue to payment
          </Link>
        </div>
      )}

      {stage === 'PAID' && (
        <p className="text-sm text-slate-700 mb-4">
          Payment received. Please upload the documents below so we can start your application.
        </p>
      )}
      {stage === 'READY' && (
        <p className="text-sm text-slate-700 mb-4">
          We have everything we need and are working on your application. You can still replace a document below if you
          need to.
        </p>
      )}
      {stage === 'SUBMITTED' && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 mb-6 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Your application has been submitted</p>
          {r.authorityReference && (
            <p className="mt-1">
              Reference number: <strong>{r.authorityReference}</strong>
            </p>
          )}
          <p className="mt-1">We will email you the moment there is an update.</p>
        </div>
      )}

      {deliverables.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-white p-5 mb-6">
          <p className="font-semibold text-slate-900 mb-3">{stage === 'COMPLETED' ? 'Your documents are ready' : 'Documents from us'}</p>
          <ul className="space-y-2">
            {deliverables.map((d) => (
              <li key={d.id}>
                {d.url ? (
                  <a
                    href={d.url}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <FiDownload size={15} /> {d.label}
                  </a>
                ) : (
                  <span className="text-sm text-slate-600">{d.label} — link unavailable, please refresh.</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {stage !== 'LEAD' && stage !== 'CANCELLED' && (
        <TrackingClient
          token={token}
          canChange={canChange}
          specs={(offering?.documents ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            description: s.description,
            isRequired: s.isRequired,
          }))}
          documents={r.documents
            .filter((d) => !d.isDeliverable)
            .map((d) => ({
              id: d.id,
              specId: d.specId,
              label: d.label,
              fileName: d.fileName,
              status: d.status,
              rejectReason: d.rejectReason,
            }))}
        />
      )}

      <p className="text-xs text-slate-500 mt-8">
        Keep this page&apos;s link private. Anyone with it can see your documents. Questions? Reply to any email from us.
      </p>
    </div>
  );
}