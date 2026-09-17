// app/businesses/[slug]/cost/page.tsx
//
// CART CONNECTION (new): CostCartSync points the shared cart at this
// business (mirrors what useBusinessData does on the requirements page),
// and CostCartSummary shows the live running total. Neither requires a
// client data fetch of its own — they ride on the same CartContext the
// requirements page already uses, so items added here show up there and
// vice versa.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCostBreakdownMatrix, getCountyFeeTable } from '@/lib/cost-data';
import { formatCurrency, formatMoneyRange } from '@/lib/currency';
import { type MarketCode } from '@/lib/markets';
import type { CostBreakdownPair, BusinessCostBreakdown } from '@/lib/cost-data';
import { DEFAULT_SIZE_BAND, type SizeBand } from '@/lib/cost-engine';
import CostSummaryPanel, { type CostPanelSummary } from './CostSummaryPanel';
import CostCategoryBreakdown from './CostCategoryBreakdown';
import CountyFeeTable from './CountyFeeTable';
import CostCartSync from './CostCartSync';
import CostCartSummary from './CostCartSummary';

export const revalidate = 300;
const market: MarketCode = 'KE';

interface CostPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

async function fetchBusinessIdentity(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { name: true } },
    },
  });
}

function toPanelSummary(breakdown: BusinessCostBreakdown): CostPanelSummary {
  return {
    oneTime: breakdown.oneTime,
    monthlyRecurring: breakdown.monthlyRecurring,
    stock: breakdown.stock,
    stockCount: breakdown.stockCount,
    coverage: {
      totalRequirements: breakdown.coverage.totalRequirements,
      requirementsWithPricing: breakdown.coverage.requirementsWithPricing,
    },
    hasPricing: breakdown.hasPricing,
    source: breakdown.source,
    workingCapitalMonths: breakdown.workingCapitalMonths,
  };
}

function buildCostPageFaqs(
  businessName: string,
  required: BusinessCostBreakdown,
  optionalCount: number,
  stockCount: number,
  hasCountyFees: boolean,
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const money = (n: number) => formatCurrency(n, market);

  if (required.hasPricing && required.source === 'COMPUTED') {
    faqs.push({
      question: `What's included in this ${businessName} cost estimate?`,
      answer: `This figure covers the ${required.coverage.totalRequirements} mandatory (required) requirements for a ${businessName.toLowerCase()} business — legal registration, equipment, documents and branding — priced from ${money(required.oneTime.low)} to ${money(required.oneTime.high)}.${
        optionalCount > 0
          ? ` It does not include ${optionalCount} optional item${optionalCount === 1 ? '' : 's'} you can add for a fuller estimate.`
          : ''
      }${stockCount > 0 ? ' Stock and inventory costs are tracked separately, since they scale with how much you plan to sell rather than being a fixed one-time cost.' : ''}`,
    });
  }

  if (required.monthlyRecurring.high > 0) {
    faqs.push({
      question: `Does this include rent and other monthly running costs?`,
      answer: `Yes, separately. One-time setup costs (equipment, permits, documents) are shown apart from monthly running costs like rent, utilities and subscriptions, which come to roughly ${formatMoneyRange(required.monthlyRecurring, market)} per month. The "cash needed to open" figure adds ${required.workingCapitalMonths} months of running costs on top of the one-time setup — you can adjust that number of months on this page.`,
    });
  } else {
    faqs.push({
      question: `Does this figure include ongoing running costs?`,
      answer: `This is a one-time setup cost, covering equipment, legal registration, and other items you buy once to launch. Ongoing costs like rent, stock and staff wages will vary by location and scale and aren't included in the figure above.`,
    });
  }

  if (hasCountyFees) {
    faqs.push({
      question: `How much does the business permit cost for a ${businessName.toLowerCase()} in Kenya?`,
      answer: `County business permit fees vary by location — see the county-by-county table on this page for exact figures. Select your county on the requirements page for the precise fee and a direct link to apply.`,
    });
  }

  faqs.push({
    question: `How accurate is this cost estimate?`,
    answer:
      required.coverage.ratio >= 1
        ? `Every mandatory requirement for a ${businessName.toLowerCase()} business currently has a real supplier price behind it, so this range reflects actual prices in the market rather than a rough guess.`
        : `This estimate is based on ${required.coverage.requirementsWithPricing} of ${required.coverage.totalRequirements} mandatory requirements that currently have real supplier prices — the remaining items are still being priced, so the true cost may run higher than shown here.`,
  });

  return faqs;
}

export async function generateMetadata({ params }: CostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [business, matrix] = await Promise.all([
    fetchBusinessIdentity(slug),
    getCostBreakdownMatrix(slug, market),
  ]);

  if (!business) {
    return { title: 'Business Not Found | HustleCare', robots: { index: false, follow: true } };
  }

  const required = matrix?.[DEFAULT_SIZE_BAND].requiredOnly;
  const year = new Date().getFullYear();
  const name = business.name;
  const title = `How Much Does It Cost to Start a ${name} Business in Kenya? (${year} Breakdown) | HustleCare`;
  const description =
    required?.hasPricing && required.source === 'COMPUTED'
      ? `A ${name} business in Kenya typically costs ${formatCurrency(required.oneTime.low, market)} to ${formatCurrency(required.oneTime.high, market)} to start, plus running costs. Full category-by-category breakdown with real supplier prices and county permit fees.`
      : `Full cost breakdown for starting a ${name} business in Kenya — one-time setup costs, monthly running costs, and county permit fees, by category.`;

  const pageUrl = `${SITE_URL}/businesses/${slug}/cost`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `cost of starting a ${name} business in Kenya`,
      `${name} business startup cost`,
      `how much does it cost to start a ${name} business`,
      `${name} business cost breakdown`,
      `${name} startup budget Kenya`,
    ].join(', '),
    authors: [{ name: 'HustleCare' }],
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: 'en_KE',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Cost to start a ${name} business in Kenya` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@HustleCare',
      site: '@HustleCare',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: { canonical: pageUrl },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

export async function generateStaticParams() {
  try {
    const businesses = await prisma.business.findMany({ select: { slug: true } });
    return businesses.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export default async function CostPage({ params }: CostPageProps) {
  const { slug } = await params;

  const [business, matrix, countyFeeRows] = await Promise.all([
    fetchBusinessIdentity(slug),
    getCostBreakdownMatrix(slug, market),
    getCountyFeeTable(slug, market, DEFAULT_SIZE_BAND),
  ]);

  if (!business || !matrix) notFound();

  const name = business.name;
  const pageUrl = `${SITE_URL}/businesses/${slug}/cost`;
  const hubUrl = `${SITE_URL}/businesses/${slug}`;
  const requirementsUrl = `${SITE_URL}/businesses/${slug}/requirements`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;
  const year = new Date().getFullYear();
  const title = `How Much Does It Cost to Start a ${name} Business in Kenya? (${year} Breakdown)`;

  const reference: CostBreakdownPair = matrix[DEFAULT_SIZE_BAND];
  const { requiredOnly: required, withOptional } = reference;

  const optionalCount = withOptional.coverage.totalRequirements - required.coverage.totalRequirements;
  const unpricedLines = withOptional.lines.filter((l) => !l.hasPricing && !l.isStock);
  const hasCountyFees = countyFeeRows.length > 0;

  const faqs = buildCostPageFaqs(name, required, optionalCount, required.stockCount, hasCountyFees);

  const panelMatrix: Record<SizeBand, { requiredOnly: CostPanelSummary; withOptional: CostPanelSummary }> =
    Object.fromEntries(
      (Object.entries(matrix) as [SizeBand, CostBreakdownPair][]).map(([band, pair]) => [
        band,
        { requiredOnly: toPanelSummary(pair.requiredOnly), withOptional: toPanelSummary(pair.withOptional) },
      ]),
    ) as Record<SizeBand, { requiredOnly: CostPanelSummary; withOptional: CostPanelSummary }>;

  const requirementListItems = withOptional.lines
    .filter((l) => l.hasPricing && !l.isStock)
    .map((line, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Thing',
        name: line.name,
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'category', value: line.category },
          { '@type': 'PropertyValue', name: 'necessity', value: line.necessity },
          { '@type': 'PropertyValue', name: 'lowPriceKES', value: line.total.low },
          { '@type': 'PropertyValue', name: 'highPriceKES', value: line.total.high },
        ],
      },
    }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_URL}/businesses` },
          { '@type': 'ListItem', position: 3, name: business.name, item: hubUrl },
          { '@type': 'ListItem', position: 4, name: 'Cost', item: pageUrl },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: title,
        description:
          required.hasPricing && required.source === 'COMPUTED'
            ? `A ${name} business in Kenya typically costs ${formatMoneyRange(required.oneTime, market)} to start.`
            : `Full cost breakdown for starting a ${name} business in Kenya.`,
        url: pageUrl,
        image: { '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 },
        author: { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        datePublished: business.createdAt.toISOString(),
        dateModified: business.updatedAt.toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
      },
      ...(requirementListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#costed-items`,
              name: `Cost Breakdown for Starting a ${name} Business in Kenya`,
              numberOfItems: requirementListItems.length,
              itemListElement: requirementListItems,
            },
          ]
        : []),
      ...(faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <CostCartSync businessId={business.id} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
          <Link href="/businesses" className="hover:text-emerald-700">Businesses</Link>
          <span className="mx-2">/</span>
          <Link href={`/businesses/${slug}`} className="hover:text-emerald-700">{name}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Cost</span>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
            {title}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            A category-by-category breakdown of what it costs to start a {name.toLowerCase()} business in
            Kenya, based on real supplier prices{hasCountyFees ? ' and county permit fees' : ''}.
          </p>
        </div>

        <div className="mb-6">
          <CostSummaryPanel
            businessName={name}
            market={market}
            matrix={panelMatrix}
            optionalCount={optionalCount}
          />
        </div>

        <div className="mb-10">
          <CostCartSummary businessSlug={slug} market={market} />
        </div>

        {required.hasPricing && (
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              Cost Breakdown by Category
            </h2>
            <p className="text-xs text-slate-400 mb-4">Shown at Medium scale — use the summary above to compare sizes.</p>
            <CostCategoryBreakdown
              categories={withOptional.categories}
              lines={withOptional.lines}
              market={market}
              businessSlug={slug}
            />
          </section>
        )}

        {hasCountyFees && (
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">County Permit Fees</h2>
            <CountyFeeTable rows={countyFeeRows} market={market} businessSlug={slug} />
          </section>
        )}

        {unpricedLines.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-3">What This Estimate Doesn&apos;t Include</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <p className="text-sm text-amber-800 mb-3">
                The following requirements don&apos;t have supplier prices yet, so they aren&apos;t counted
                in the figures above. Your actual cost may be higher.
              </p>
              <ul className="flex flex-wrap gap-2">
                {unpricedLines.map((line) =>
                  line.slug ? (
                    <li key={line.requirementId}>
                      <Link
                        href={`/requirements/${line.slug}`}
                        className="text-xs font-medium text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-full transition-colors"
                      >
                        {line.name}
                      </Link>
                    </li>
                  ) : (
                    <li
                      key={line.requirementId}
                      className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full"
                    >
                      {line.name}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </section>
        )}

        <p className="text-xs text-slate-400 text-center mb-10">
          {required.pricesLastVerifiedAt
            ? `Prices last verified ${new Date(required.pricesLastVerifiedAt).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}.`
            : 'Prices are sourced from active supplier listings and reviewed periodically.'}{' '}
          This is an estimate — actual costs vary by supplier, location and business decisions.
        </p>

        {faqs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 text-center">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold text-slate-800 text-sm sm:text-base flex items-center justify-between gap-3">
                    {faq.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0">
                      ⌄
                    </span>
                  </summary>
                  <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={requirementsUrl}
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
          >
            Build Your Own Estimate on the Requirements Page
          </Link>
          <Link
            href={hubUrl}
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
          >
            Back to {name} Overview
          </Link>
        </div>
      </div>
    </>
  );
}