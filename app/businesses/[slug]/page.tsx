// app/businesses/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBusiness, isUSMarketEligible } from '@/lib/business-data';
import { getBusinessCostBreakdown, type BusinessCostBreakdown } from '@/lib/cost-data';
import HubPageContent from './HubPageContent';
import RelatedBusinesses from './RelatedBusinesses';
import { isExcludedFromTotals } from '@/lib/necessity';
import { formatCurrency } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import { type MarketCode } from '@/lib/markets';

export const revalidate = 300; // regenerate at most every 5 minutes

const market: MarketCode = 'KE';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDays(days: number) {
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/** Same slugify pattern used everywhere else category names are turned
 * into URL segments (see categorySlug() in BusinessesContent.tsx) —
 * duplicated here rather than imported to avoid a client/server import
 * across a 'use client' boundary; keep both in sync if either changes. */
function categorySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Whether a requirement counts toward the headline "N requirements to
 * start" total (Stage 3 Part B). Reads the RequirementCategory entity's
 * `excludedFromTotals` flag — threaded through by lib/business-data.ts's
 * fetchBusiness alongside slug/published — and falls back to the legacy
 * category-string comparison only for a template that somehow has no
 * categoryRef yet.
 *
 * Note this is only used for the requirement COUNT and grouping now. The
 * cost figure applies the same rule internally, inside the cost engine.
 */
function isRequirementExcludedFromTotals(template: {
  category: string | null;
  categoryRef?: { excludedFromTotals: boolean } | null;
}): boolean {
  return template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(template.category ?? '');
}

/** Build auto-generated FAQs from business data. */
function buildAutoFaqs(
  name: string,
  cost: BusinessCostBreakdown | null,
  timeMin: number | null,
  timeMax: number | null,
  profitPotential: string | null,
  skillLevel: string | null,
  requirementCount: number,
  bestLocations: string[],
): AutoFaq[] {
  const faqs: AutoFaq[] = [];

  // Only answer the cost question from genuinely computed data. When
  // `source` is EDITORIAL there's nothing priced behind the figure, and a
  // hand-entered band dressed up as a data-derived answer in an FAQ rich
  // result is exactly the kind of claim that shouldn't be made.
  if (cost?.hasPricing && cost.source === 'COMPUTED') {
    const money = (n: number) => formatCurrency(n, market);
    const { requirementsWithPricing, totalRequirements } = cost.coverage;

    faqs.push({
      question: `How much does it cost to start a ${name} business in Kenya?`,
      answer: `Starting a ${name} business in Kenya costs between ${money(cost.oneTime.low)} and ${money(cost.oneTime.high)} depending on your scale and location, with a typical setup around ${money(cost.oneTime.typical)}. This is based on ${requirementsWithPricing} out of ${totalRequirements} essential requirements that currently have real supplier prices.${
        requirementsWithPricing < totalRequirements
          ? ' The actual cost may be higher, as some requirements are still being priced.'
          : ''
      }`,
    });
  }

  if (timeMin && timeMax) {
    faqs.push({
      question: `How long does it take to launch a ${name} business in Kenya?`,
      answer: `You can expect to launch your ${name} business within ${formatDays(timeMin)} to ${formatDays(timeMax)}. This includes registration, sourcing requirements, and getting your first customers.`,
    });
  }

  if (requirementCount > 0) {
    faqs.push({
      question: `What are the requirements to start a ${name} business in Kenya?`,
      answer: `A ${name} business in Kenya has ${requirementCount} requirements covering documents, equipment, licences, and operational needs. Some are mandatory while others are optional depending on your business scale.`,
    });
  }

  if (profitPotential) {
    const label = profitPotential.replace(/_/g, ' ');
    faqs.push({
      question: `Is a ${name} business profitable in Kenya?`,
      answer: `A ${name} business has ${label} profit potential in Kenya. Profitability depends on your location, scale of operation, and how well you manage costs and customer acquisition.`,
    });
  }

  if (skillLevel) {
    faqs.push({
      question: `Do I need special skills to start a ${name} business?`,
      answer: `The skill level required for a ${name} business is ${skillLevel}. ${
        skillLevel === 'low'
          ? 'Most people can start with basic training and learn on the job.'
          : skillLevel === 'moderate'
          ? 'Some prior experience or short training will give you a strong advantage.'
          : 'Significant experience or professional training is recommended before starting.'
      }`,
    });
  }

  if (bestLocations.length > 0) {
    const locationList = bestLocations.join(', ');
    faqs.push({
      question: `Where is the best place to start a ${name} business in Kenya?`,
      answer: `The best locations for a ${name} business in Kenya include ${locationList}. These areas offer strong customer demand, good infrastructure, or proximity to key suppliers.`,
    });
  }

  return faqs;
}

interface AutoFaq {
  question: string;
  answer: string;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug, market);

  if (!business) {
    return {
      title: 'Business Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const year = new Date().getFullYear();
  const name = business.name;
  const title = `${name} Business in Kenya [${year}] - Everything You Need to Know | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in Kenya. Explore requirements, startup costs, licences, and everything you need to launch.`;

  const pageUrl = `${SITE_URL}/businesses/${slug}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  // Only advertise a US alternate if this business actually has a live US
  // page — see isUSMarketEligible() in lib/business-data.ts.
  const usEligible = await isUSMarketEligible(business.id);

  return {
    title,
    description,
    keywords: [
      `how to start a ${name} business in Kenya`,
      `${name} business guide Kenya`,
      `${name} business requirements Kenya`,
      `${name} startup cost Kenya`,
      `start ${name} business`,
    ].join(', '),
    authors: [{ name: 'HustleCare' }],
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: 'en_KE',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Start a ${name} business in Kenya` }],
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
    alternates: {
      canonical: pageUrl,
      languages: {
        'en-KE': pageUrl,
        ...(usEligible ? { 'en-US': `${SITE_URL}/us/businesses/${slug}` } : {}),
      },
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const businesses = await prisma.business.findMany({ select: { slug: true } });
    return businesses.map((b) => ({ slug: b.slug }));
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BusinessHubPage({ params }: Props) {
  const { slug } = await params;

  // Business shape and cost are fetched independently: the cost breakdown
  // comes from lib/cost-data.ts, which is cached separately and owns the
  // one correct product filter. This page used to run its own inline
  // price loop over a products select that included non-ACTIVE products —
  // see the COST NOTE in lib/business-data.ts.
  const [business, cost] = await Promise.all([
    fetchBusiness(slug, market),
    getBusinessCostBreakdown(slug, market),
  ]);

  if (!business) notFound();

  const year = new Date().getFullYear();
  const name = business.name;
  const pageUrl = `${SITE_URL}/businesses/${slug}`;

  // ── Core/Stock split ──────────────────────────────────────────────────────
  // Stock requirements are products a business can sell (e.g. spare parts),
  // not fixed one-time startup requirements. They're excluded from the
  // headline requirement count, category breakdown and requirements
  // preview — the cost engine applies the same rule internally.
  const coreRequirements = business.requirements.filter(
    (r) => !isRequirementExcludedFromTotals(r.template)
  );

  const requirementCount = coreRequirements.length;
  const title = `${name} Business in Kenya [${year}] - Everything You Need to Know | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in Kenya with ${requirementCount} requirements and cost estimates.`;

  // ── Requirement grouping ──────────────────────────────────────────────────
  const grouped = coreRequirements.reduce<Record<string, typeof coreRequirements>>(
    (acc, req) => {
      const cat = req.template.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(req);
      return acc;
    },
    {}
  );

  // requirementSlug is only a valid link target when the template is
  // actually published — an unpublished template might carry a slug
  // placeholder but has no live /requirements/{slug} page yet.
  const previewRequirements = coreRequirements.slice(0, 4).map((r) => ({
    id: r.id,
    name: r.template.name,
    category: r.template.category,
    necessity: r.template.necessity,
    image: r.template.image,
    requirementSlug: r.template.published ? r.template.slug : null,
  }));

  const categoryBreakdown = Object.entries(grouped).map(([cat, reqs]) => ({
    name: cat,
    count: reqs.length,
    requiredCount: reqs.filter((r) => r.template.necessity === 'Required').length,
  }));

  // ── FAQs: merge DB overrides on top of auto-generated ────────────────────

  const autoFaqs = buildAutoFaqs(
    name,
    cost,
    business.timeToLaunchMin,
    business.timeToLaunchMax,
    business.profitPotential,
    business.skillLevel,
    requirementCount,
    business.bestLocations,
  );

  // DB FAQs completely replace auto ones when present
  const dbFaqs = business.faqs.map((f) => ({ question: f.question, answer: f.answer }));
  const finalFaqs = dbFaqs.length > 0 ? dbFaqs : autoFaqs;

  // ── Structured Data ───────────────────────────────────────────────────────
  //
  // BreadcrumbList mirrors the visible breadcrumb in HubPageContent.tsx
  // exactly: Home > Businesses > Categories > {Category} > {Business} when
  // the business has a category, or Home > Businesses > {Business} when it
  // doesn't.
  const breadcrumbItems: Array<{ '@type': string; position: number; name: string; item: string }> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_URL}/businesses` },
  ];
  let breadcrumbPosition = 3;
  if (business.category) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbPosition++,
      name: 'Categories',
      item: `${SITE_URL}/businesses/categories`,
    });
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: breadcrumbPosition++,
      name: business.category.name,
      item: `${SITE_URL}/businesses/categories/${categorySlug(business.category.name)}`,
    });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbPosition++,
    name,
    item: pageUrl,
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: breadcrumbItems,
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: title,
        description,
        url: pageUrl,
        image: {
          '@type': 'ImageObject',
          url: business.image || `${SITE_URL}/images/default-business.jpg`,
          width: 1200,
          height: 630,
        },
        author: { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        datePublished:
          (business as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
      },
      // FAQPage schema — only emit when we have FAQs
      ...(finalFaqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: finalFaqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
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

      <HubPageContent
        slug={slug}
        name={name}
        description={business.description}
        image={business.image}
        category={business.category?.name}
        requirementCount={requirementCount}
        categoryBreakdown={categoryBreakdown}
        previewRequirements={previewRequirements}

        timeToLaunchMin={business.timeToLaunchMin}
        timeToLaunchMax={business.timeToLaunchMax}
        profitPotential={business.profitPotential}
        skillLevel={business.skillLevel}
        bestLocations={business.bestLocations}
        faqs={finalFaqs}
      />

      {business.category && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <RelatedBusinesses
            categoryId={business.category.id}
            currentSlug={slug}
            categoryName={business.category.name}
          />
        </div>
      )}
    </>
  );
}