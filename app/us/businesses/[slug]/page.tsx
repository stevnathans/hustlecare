// app/us/businesses/[slug]/page.tsx
//
// COST (this revision): the inline price loop and formatUSD are gone —
// cost comes from getBusinessCostBreakdown (lib/cost-data.ts), the same
// engine every other cost surface uses. The old loop read
// template.products, which fetchBusiness no longer selects (it also had
// no status/vendor-market filter), so the cost FAQ here was silently
// missing and, when present, was built from non-ACTIVE products.
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBusiness } from '@/lib/business-data';
import { getBusinessCostBreakdown, type BusinessCostBreakdown } from '@/lib/cost-data';
import { formatCurrency } from '@/lib/currency';
import { prisma } from '@/lib/prisma';
import HubPageContent from '../../../businesses/[slug]/HubPageContent';
import RelatedBusinesses from '../../../businesses/[slug]/RelatedBusinesses';
import { isExcludedFromTotals } from '@/lib/necessity';
import {
  marketBasePath,
  marketCountryPhrase,
  marketHreflang,
  marketOgLocale,
  type MarketCode,
} from '@/lib/markets';
import { withArticle } from '@/lib/grammar';
import { pickWithinLimit, TITLE_MAX } from '@/lib/seo-fit';

export const revalidate = 300; // regenerate at most every 5 minutes

// The ONLY market-specific line in this file (see lib/markets.ts).
const market: MarketCode = 'US';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const SITE_BASE = `${SITE_URL}${marketBasePath(market)}`;
const COUNTRY = marketCountryPhrase(market); // "the US"
const HREFLANG = marketHreflang(market);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDays(days: number) {
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

function isRequirementExcludedFromTotals(template: {
  category: string | null;
  categoryRef?: { excludedFromTotals: boolean } | null;
}): boolean {
  return template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(template.category ?? '');
}

function buildHubTitle(name: string, year: number): string {
  return pickWithinLimit(
    [
      `${name} Business in ${COUNTRY}: Costs & Requirements (${year})`,
      `${name} Business in ${COUNTRY} (${year})`,
      `${name} Business in ${COUNTRY}`,
    ],
    TITLE_MAX
  );
}

/** Build auto-generated FAQs from business data — US copy. */
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

  const art = withArticle(name);
  const Art = art.charAt(0).toUpperCase() + art.slice(1);

  // Only answer from genuinely computed data (see the Kenya hub page).
  if (cost?.hasPricing && cost.source === 'COMPUTED') {
    const money = (n: number) => formatCurrency(n, market);
    const { requirementsWithPricing, totalRequirements } = cost.coverage;

    faqs.push({
      question: `How much does it cost to start ${art} business in ${COUNTRY}?`,
      answer: `Starting ${art} business in ${COUNTRY} costs between ${money(cost.oneTime.low)} and ${money(cost.oneTime.high)} depending on your scale and location, with a typical setup around ${money(cost.oneTime.typical)}. This is based on ${requirementsWithPricing} out of ${totalRequirements} essential requirements that currently have real supplier prices.${
        requirementsWithPricing < totalRequirements
          ? ' The actual cost may be higher as some requirements are still being priced.'
          : ''
      }`,
    });
  }

  if (timeMin && timeMax) {
    faqs.push({
      question: `How long does it take to launch ${art} business in ${COUNTRY}?`,
      answer: `You can expect to launch your ${name} business within ${formatDays(timeMin)} to ${formatDays(timeMax)}. This includes sourcing equipment and software, and getting your first customers.`,
    });
  }

  if (requirementCount > 0) {
    faqs.push({
      question: `What are the requirements to start ${art} business in ${COUNTRY}?`,
      answer: `${Art} business in ${COUNTRY} has ${requirementCount} requirements covering equipment, software, and operational needs. Some are essential while others are optional depending on your business scale.`,
    });
  }

  if (profitPotential) {
    const label = profitPotential.replace(/_/g, ' ');
    faqs.push({
      question: `Is ${art} business profitable in ${COUNTRY}?`,
      answer: `${Art} business has ${label} profit potential in ${COUNTRY}. Profitability depends on your location, scale of operation, and how well you manage costs and customer acquisition.`,
    });
  }

  if (skillLevel) {
    faqs.push({
      question: `Do I need special skills to start ${art} business?`,
      answer: `The skill level required for ${art} business is ${skillLevel}. ${
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
      question: `Where is the best place to start ${art} business in ${COUNTRY}?`,
      answer: `The best locations for ${art} business in ${COUNTRY} include ${locationList}. These areas offer strong customer demand, good infrastructure, or proximity to key suppliers.`,
    });
  }

  return faqs;
}

interface AutoFaq {
  question: string;
  answer: string;
}

// ── Shared eligibility calc ──────────────────────────────────────────────────
function countCoreRequirements(business: NonNullable<Awaited<ReturnType<typeof fetchBusiness>>>) {
  return business.requirements.filter((r) => !isRequirementExcludedFromTotals(r.template)).length;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug, market);

  const requirementCount = business ? countCoreRequirements(business) : 0;

  if (!business || requirementCount === 0) {
    return {
      title: 'Business Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const year = new Date().getFullYear();
  const name = business.name;
  const art = withArticle(name);
  const title = buildHubTitle(name, year);
  const description =
    business.description ||
    `Complete guide to starting ${art} business in ${COUNTRY}. Explore requirements, startup costs, and everything you need to launch.`;

  const pageUrl = `${SITE_BASE}/businesses/${slug}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `how to start ${art} business in ${COUNTRY}`,
      `${name} business guide in ${COUNTRY}`,
      `${name} business requirements in ${COUNTRY}`,
      `${name} startup cost in ${COUNTRY}`,
      `start ${name} business`,
    ].join(', '),
    authors: [{ name: 'HustleCare' }],
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: marketOgLocale(market),
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Start ${art} business in ${COUNTRY}` }],
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
        [HREFLANG]: pageUrl,
        [marketHreflang('KE')]: `${SITE_URL}${marketBasePath('KE')}/businesses/${slug}`,
      },
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function USBusinessHubPage({ params }: Props) {
  const { slug } = await params;

  const [business, cost] = await Promise.all([
    fetchBusiness(slug, market),
    getBusinessCostBreakdown(slug, market),
  ]);

  if (!business) notFound();

  const year = new Date().getFullYear();
  const name = business.name;
  const pageUrl = `${SITE_BASE}/businesses/${slug}`;

  const datePublished = business.createdAt.toISOString();
  const dateModified = business.updatedAt.toISOString();

  const coreRequirements = business.requirements.filter(
    (r) => !isRequirementExcludedFromTotals(r.template)
  );

  const requirementCount = coreRequirements.length;

  if (requirementCount === 0) notFound();

  const title = buildHubTitle(name, year);
  const description =
    business.description ||
    `Complete guide to starting ${withArticle(name)} business in ${COUNTRY} with ${requirementCount} requirements and cost estimates.`;

  const grouped = coreRequirements.reduce<Record<string, typeof coreRequirements>>(
    (acc, req) => {
      const cat = req.template.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(req);
      return acc;
    },
    {}
  );

  // requirementSlug deliberately null on the US market for now — see the
  // existing note: a market-aware /us/requirements/{slug} exists, but
  // linking to it is left for a later stage.
  const previewRequirements = coreRequirements.slice(0, 4).map((r) => ({
    id: r.id,
    name: r.template.name,
    category: r.template.category,
    necessity: r.template.necessity,
    image: r.template.image,
    requirementSlug: null,
  }));

  const categoryBreakdown = Object.entries(grouped).map(([cat, reqs]) => ({
    name: cat,
    count: reqs.length,
    requiredCount: reqs.filter((r) => r.template.necessity === 'Required').length,
  }));

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

  // NOTE: unlike the Kenya hub page, we deliberately do NOT fall back to
  // business.faqs here — those rows were authored for the Kenya market.
  const finalFaqs = autoFaqs;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_BASE },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_BASE}/businesses` },
          { '@type': 'ListItem', position: 3, name: name, item: pageUrl },
        ],
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
        datePublished,
        dateModified,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: HREFLANG,
      },
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
        market={market}
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