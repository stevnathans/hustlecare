// app/apply-help/page.tsx
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import ApplyHelpForm from '@/components/apply-help/ApplyHelpForm';
import { resolveTemplateId, getActiveOffering } from '@/lib/applyAssistance/offering';
import { getPaymentMode } from '@/lib/applyAssistance/lifecycle';
import { estimateGovFeeByCounty } from '@/lib/applyAssistance/govFee';
import { formatPhoneLocal } from '@/lib/phone';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Get Help Applying for a Legal Requirement | HustleCare',
  description: 'Request hands-on help applying for a business permit, licence, or certificate in your county.',
  // This is a form whose content never changes between URLs, and the
  // "Apply For Me" links generate one query-string variant per business ×
  // requirement × county. Keep all of them out of the index. (Don't also
  // disallow it in robots.txt yet — Google has to be able to crawl the page
  // to see this noindex.)
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? '';
}

export default async function ApplyHelpPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const paymentMode = getPaymentMode();

  // ── "Continue to payment" links (reminder emails, tracking page) ──────────
  // /apply-help?resume=TOKEN picks up an unpaid request exactly where it was left.
  const resumeToken = first(sp.resume);
  let resumeLead = null;
  if (resumeToken) {
    const found = await prisma.applyAssistanceRequest.findUnique({ where: { publicToken: resumeToken } });
    if (found) {
      // Already paid, cancelled, or no way to pay online: the tracking page is the right place.
      if (found.stage !== 'LEAD' || paymentMode === 'off' || !found.serviceFee) {
        redirect(`/apply-help/track/${resumeToken}`);
      }
      resumeLead = found;
    }
  }

  const requirementName = (resumeLead?.requirementName ?? first(sp.requirement)).slice(0, 200);
  const countyParam = (resumeLead?.countyName ?? first(sp.county)).slice(0, 100);
  const fromParam = first(sp.from).slice(0, 200);
  const rawBusinessId = resumeLead?.businessId ?? Number(first(sp.businessId));

  // Signed-in visitors get their details filled in (they can still edit them).
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; name?: string | null; email?: string | null } | undefined;
  const accountPhone = sessionUser?.id
    ? (await prisma.user.findUnique({ where: { id: sessionUser.id }, select: { phone: true } }))?.phone ?? ''
    : '';

  const [counties, business] = await Promise.all([
    prisma.county.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    Number.isInteger(rawBusinessId) && rawBusinessId > 0
      ? prisma.business.findUnique({ where: { id: rawBusinessId }, select: { id: true, name: true } })
      : Promise.resolve(null),
  ]);

  const county = countyParam
    ? counties.find((c) => c.name.toLowerCase() === countyParam.toLowerCase()) ?? null
    : null;

  const templateId = requirementName
    ? await resolveTemplateId({ businessId: business?.id ?? null, requirementName })
    : null;
  const [offering, govFeeByCounty] = await Promise.all([
    getActiveOffering(templateId),
    estimateGovFeeByCounty({ templateId, businessId: business?.id ?? null }),
  ]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {resumeLead
            ? `Finish your ${requirementName} application`
            : requirementName
              ? `We can apply for your ${requirementName}`
              : 'Need help applying?'}
        </h1>
        <p className="text-slate-600 leading-relaxed">
          {resumeLead
            ? 'Your details are saved. Pay the service fee and we will tell you which documents to send.'
            : offering
              ? 'Tell us who you are, pay the service fee, and send us your documents. We handle the application from there.'
              : 'Tell us what you need and where. Our team will get back to you with the price and next steps.'}
        </p>
      </div>

      <ApplyHelpForm
        initial={{
          requirementName,
          countyId: county?.id ?? null,
          businessId: business?.id ?? null,
          businessName: business?.name ?? null,
          sourcePath: fromParam.startsWith('/') ? fromParam : '',
        }}
        counties={counties}
        offering={
          offering
            ? {
                serviceFee: offering.serviceFee,
                currency: offering.currency,
                typicalDaysMin: offering.typicalDaysMin,
                typicalDaysMax: offering.typicalDaysMax,
                whatsIncluded: offering.whatsIncluded,
                documents: offering.documents.map((d) => ({ label: d.label, isRequired: d.isRequired })),
              }
            : null
        }
        paymentMode={paymentMode}
        govFeeByCounty={govFeeByCounty}
        prefill={{
          contactName: resumeLead?.contactName ?? sessionUser?.name?.trim() ?? '',
          contactEmail: resumeLead?.contactEmail ?? sessionUser?.email?.trim() ?? '',
          contactPhone: resumeLead?.contactPhone ?? accountPhone,
        }}
        resume={
          resumeLead && resumeLead.publicToken && resumeLead.serviceFee
            ? {
                token: resumeLead.publicToken,
                paymentMode,
                contactPhone: resumeLead.contactPhoneE164
                  ? formatPhoneLocal(resumeLead.contactPhoneE164)
                  : resumeLead.contactPhone,
                contactEmail: resumeLead.contactEmail,
                serviceFee: resumeLead.serviceFee,
                currency: resumeLead.currency,
              }
            : null
        }
      />
    </div>
  );
}