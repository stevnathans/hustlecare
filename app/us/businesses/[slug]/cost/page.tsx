// app/us/businesses/[slug]/cost/page.tsx
//
// US counterpart of app/businesses/[slug]/cost/page.tsx. Follows this
// codebase's US-page convention: near-duplicate the Kenya page, with
// market-specific wording coming from lib/markets.ts helpers, and share
// the market-aware components from the Kenya tree.
//
// Differences from Kenya (all deliberate):
//  - No county fee table / county FAQ — legal requirements and county
//    fee schedules are Kenya-only.
//  - No links from cost lines to /requirements/{slug} (lib/cost-data.ts
//    emits no slugs for non-Kenya markets, matching the US hub and
//    requirements pages).
//  - No editorial costMin/costMax fallback (assumed KES; see
//    lib/cost-data.ts).
//  - Same anti-thin-content bar as the US hub and requirements pages:
//    no US-visible requirements → real 404. And noindex when there's no
//    genuinely computed US pricing yet.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCostBreakdownMatrix, hasComputedPricing } from '@/lib/cost-data';
import type { CostBreakdownPair, BusinessCostBreakdown } from '@/lib/cost-data';
import { currencyCode, formatCurrency, formatMoneyRange } from '@/lib/currency';
import {
  marketBasePath,
  marketCountryPhrase,
  marketHreflang,
  marketOgLocale,
  type MarketCode,
} from '@/lib/markets';
import { withArticle } from '@/lib/grammar';
import { pickWithinLimit, TITLE_MAX } from '@/lib/seo-fit';
import { DEFAULT_SIZE_BAND, type SizeBand } from '@/lib/cost-engine';
import CostSummaryPanel, { type CostPanelSummary } from '@/app/businesses/[slug]/cost/CostSummaryPanel';
import CostCategoryBreakdown from '@/app/businesses/[slug]/cost/CostCategoryBreakdown';
import CostCartSync from '@/components/shared/CostCartSync';
import CostCartSummary from '@/components/shared/CostCartSummary';

export const revalidate = 300;

// The ONLY market-specific line in this file (see lib/markets.ts).
const market: MarketCode = 'US';

interface CostPageProps {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const BASE_PATH = marketBasePath(market); // "/us"
const SITE_BASE = `${SITE_URL}${BASE_PATH}`;
const COUNTRY = marketCountryPhrase(market); // "the US"
const HREFLANG = marketHreflang(market);
const CODE = currencyCode(market); // "USD"

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

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Fitted to TITLE_MAX, longest wording first (same approach as the US hub/requirements pages). */
function buildTitle(name: string, year: number): string {
  const a = withArticle(name);
  return pickWithinLimit(
    [
      `How Much Does It Cost to Start ${a} Business in ${COUNTRY}? (${year})`,
      `${name} Business Startup Costs in ${COUNTRY} (${year})`,
      `Cost to Start ${a} Business in ${COUNTRY}`,
    ],
    TITLE_MAX,
  );
}

// FAQ — focused on the mechanics of the estimate (what's included, running
// costs, accuracy), deliberately different from the hub and requirements
// pages' FAQs. No legal/permit question: legal requirements are not part
// of the US data.
function buildCostPageFaqs(
  businessName: string,
  required: BusinessCostBreakdown,
  optionalCount: number,
  stockCount: number,
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const a = withArticle(businessName);
  const money = (n: number) => formatCurrency(n, market);
  const categoryNames = required.categories.filter((c) => c.lineCount > 0).map((c) => c.name.toLowerCase());

  if (required.hasPricing && required.source === 'COMPUTED') {
    faqs.push({
      question: `What's included in this ${businessName} cost estimate?`,
      answer: `This figure covers the ${required.coverage.totalRequirements} required items for ${a} business${
        categoryNames.length > 0 ? ` — across ${joinList(categoryNames)}` : ''
      } — priced from ${money(required.oneTime.low)} to ${money(required.oneTime.high)}.${
        optionalCount > 0
          ? ` It does not include ${optionalCount} optional item${optionalCount === 1 ? '' : 's'} you can add for a fuller estimate.`
          : ''
      }${stockCount > 0 ? ' Stock and inventory costs are tracked separately, since they scale with how much you plan to sell rather than being a fixed one-time cost.' : ''}`,
    });
  }

  if (required.monthlyRecurring.high > 0) {
    faqs.push({
      question: `Does this include rent and other monthly running costs?`,
      answer: `Yes, separately. One-time setup costs are shown apart from monthly running costs like rent, utilities and subscriptions, which come to roughly ${formatMoneyRange(required.monthlyRecurring, market)} per month. The "cash needed to open" figure adds ${required.workingCapitalMonths} months of running costs on top of the one-time setup — you can adjust that number of months on this page.`,
    });
  } else {
    faqs.push({
      question: `Does this figure include ongoing running costs?`,
      answer: `This is a one-time setup cost, covering the equipment, software and other items you buy once to launch. Ongoing costs like rent, stock and staff wages will vary by location and scale and aren't included in the figure above.`,
    });
  }

  faqs.push({
    question: `How accurate is this cost estimate?`,
    answer:
      required.coverage.ratio >= 1
        ? `Every required item for ${a} business currently has a real supplier price behind it, so this range reflects actual prices in the market rather than a rough guess.`
        : `This estimate is based on ${required.coverage.requirementsWithPricing} of ${required.coverage.totalRequirements} required items that currently have real supplier prices — the remaining items are still being priced, so the true cost may run higher than shown here.`,
  });

  return faqs;
}

export async function generateMetadata({ params }: CostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const [business, matrix, keHasPricing] = await Promise.all([
    fetchBusinessIdentity(slug),
    getCostBreakdownMatrix(slug, market),
    hasComputedPricing(slug, 'KE'),
  ]);

  const requirementCount = matrix ? matrix[DEFAULT_SIZE_BAND].withOptional.coverage.totalRequirements : 0;

  // Guards both a missing business AND one with no US-visible requirements.
  if (!business || !matrix || requirementCount === 0) {
    return { title: 'Business Not Found | HustleCare', robots: { index: false, follow: true } };
  }

  const required = matrix[DEFAULT_SIZE_BAND].requiredOnly;
  const indexable = required.hasPricing;
  const year = new Date().getFullYear();
  const name = business.name;
  const a = withArticle(name);
  const title = buildTitle(name, year);
  const description =
    required.hasPricing && required.source === 'COMPUTED'
      ? `${capitalise(a)} business in ${COUNTRY} typically costs ${formatCurrency(required.oneTime.low, market)} to ${formatCurrency(required.oneTime.high, market)} to start, plus running costs. Full category-by-category breakdown with real supplier prices.`
      : `Full cost breakdown for starting ${a} business in ${COUNTRY} — one-time setup costs and monthly running costs, by category.`;

  const pageUrl = `${SITE_BASE}/businesses/${slug}/cost`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `cost of starting ${a} business in ${COUNTRY}`,
      `${name} business startup cost`,
      `how much does it cost to start ${a} business`,
      `${name} business cost breakdown`,
      `${name} startup budget in ${COUNTRY}`,
    ].join(', '),
    authors: [{ name: 'HustleCare' }],
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: marketOgLocale(market),
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Cost to start ${a} business in ${COUNTRY}` }],
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
      index: indexable,
      follow: true,
      googleBot: { index: indexable, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        [HREFLANG]: pageUrl,
        // Only point at the Kenya cost page when it has real pricing
        // (otherwise it's noindexed — see that page's metadata).
        ...(keHasPricing
          ? { [marketHreflang('KE')]: `${SITE_URL}${marketBasePath('KE')}/businesses/${slug}/cost` }
          : {}),
      },
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// Same filter as the US hub and requirements pages: only pre-render
// businesses with at least one US-visible requirement.
export async function generateStaticParams() {
  try {
    const businesses = await prisma.business.findMany({
      where: {
        requirements: {
          some: {
            isActive: true,
            template: {
              isDeprecated: false,
              OR: [{ restrictedToCountry: null }, { restrictedToCountry: 'US' }],
            },
          },
        },
      },
      select: { slug: true },
    });
    return businesses.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

export default async function USCostPage({ params }: CostPageProps) {
  const { slug } = await params;

  const [business, matrix] = await Promise.all([
    fetchBusinessIdentity(slug),
    getCostBreakdownMatrix(slug, market),
  ]);

  if (!business || !matrix) notFound();

  const reference: CostBreakdownPair = matrix[DEFAULT_SIZE_BAND];
  const { requiredOnly: required, withOptional } = reference;

  // On-demand renders can reach slugs outside generateStaticParams — give
  // a real 404 instead of an empty, indexable page.
  if (withOptional.coverage.totalRequirements === 0) notFound();

  const name = business.name;
  const a = withArticle(name);
  const pageUrl = `${SITE_BASE}/businesses/${slug}/cost`;
  const hubUrl = `${SITE_BASE}/businesses/${slug}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;
  const year = new Date().getFullYear();
  const title = buildTitle(name, year);
  const heading = `How Much Does It Cost to Start ${a} Business in ${COUNTRY}? (${year} Breakdown)`;

  const optionalCount = withOptional.coverage.totalRequirements - required.coverage.totalRequirements;
  const unpricedLines = withOptional.lines.filter((l) => !l.hasPricing && !l.isStock);

  // Required + non-stock only, matching required.categories exactly so the
  // category cards never sum to more than the headline figure.
  const categoryLines = required.lines.filter((l) => l.isRequired && !l.isStock);

  const faqs = buildCostPageFaqs(name, required, optionalCount, required.stockCount);

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
          { '@type': 'PropertyValue', name: `lowPrice${CODE}`, value: line.total.low },
          { '@type': 'PropertyValue', name: `highPrice${CODE}`, value: line.total.high },
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
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_BASE },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_BASE}/businesses` },
          { '@type': 'ListItem', position: 3, name: name, item: hubUrl },
          { '@type': 'ListItem', position: 4, name: 'Cost', item: pageUrl },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: title,
        description:
          required.hasPricing && required.source === 'COMPUTED'
            ? `${capitalise(a)} business in ${COUNTRY} typically costs ${formatMoneyRange(required.oneTime, market)} to start.`
            : `Full cost breakdown for starting ${a} business in ${COUNTRY}.`,
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
        inLanguage: HREFLANG,
      },
      ...(requirementListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#costed-items`,
              name: `Cost Breakdown for Starting ${a} Business in ${COUNTRY}`,
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
      <CostCartSummary businessSlug={slug} market={market} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-28">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-6">
          <Link href={`${BASE_PATH}/businesses`} className="hover:text-emerald-700">Businesses</Link>
          <span className="mx-2">/</span>
          <Link href={`${BASE_PATH}/businesses/${slug}`} className="hover:text-emerald-700">{name}</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Cost</span>
        </nav>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
            {heading}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            A category-by-category breakdown of what it costs to start {a} business in {COUNTRY}, based on
            real supplier prices.
          </p>
        </div>

        <div className="mb-10">
          <CostSummaryPanel
            businessName={name}
            market={market}
            matrix={panelMatrix}
            optionalCount={optionalCount}
          />
        </div>

        {required.hasPricing && (
          <section className="mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
              Cost Breakdown by Category
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Required items only, at Medium scale — matches the headline figure above.
              {optionalCount > 0 && ` ${optionalCount} optional item${optionalCount === 1 ? '' : 's'} not shown here — toggle "include optional" above to add them.`}
            </p>
            <CostCategoryBreakdown
              categories={required.categories}
              lines={categoryLines}
              market={market}
              businessSlug={slug}
            />
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
                {unpricedLines.map((line) => (
                  <li
                    key={line.requirementId}
                    className="text-xs font-medium text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full"
                  >
                    {line.name}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        <p className="text-xs text-slate-400 text-center mb-10">
          {required.pricesLastVerifiedAt
            ? `Prices last verified ${new Date(required.pricesLastVerifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`
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
            href={`${BASE_PATH}/businesses/${slug}/requirements`}
            className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
          >
            Build Your Own Estimate on the Requirements Page
          </Link>
          <Link
            href={`${BASE_PATH}/businesses/${slug}`}
            className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
          >
            Back to {name} Overview
          </Link>
        </div>
      </div>
    </>
  );
}