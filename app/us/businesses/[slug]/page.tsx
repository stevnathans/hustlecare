// app/us/businesses/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchBusiness } from '@/lib/business-data';
import { prisma } from '@/lib/prisma';
import HubPageContent from '../../../businesses/[slug]/HubPageContent';
import RelatedBusinesses from '../../../businesses/[slug]/RelatedBusinesses';
import { isExcludedFromTotals } from '@/lib/necessity';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// ── Helpers ───────────────────────────────────────────────────────────────────

interface CostData {
  low: number;
  medium: number;
  high: number;
  requirementsWithProducts: number;
  totalRequirements: number;
  hasPricing: boolean;
}

function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDays(days: number) {
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/** Build auto-generated FAQs from business data — US copy. */
function buildAutoFaqs(
  name: string,
  cost: CostData | null,
  timeMin: number | null,
  timeMax: number | null,
  profitPotential: string | null,
  skillLevel: string | null,
  requirementCount: number,
  bestLocations: string[],
): AutoFaq[] {
  const faqs: AutoFaq[] = [];

  if (cost?.hasPricing) {
    faqs.push({
      question: `How much does it cost to start a ${name} business in the US?`,
      answer: `Starting a ${name} business in the US costs between ${formatUSD(cost.low)} and ${formatUSD(cost.high)} depending on your scale and location. This is based on ${cost.requirementsWithProducts} out of ${cost.totalRequirements} requirements that have products assigned.${cost.requirementsWithProducts < cost.totalRequirements ? ' The actual cost may be higher as some requirements are still being priced.' : ''}`,
    });
  }

  if (timeMin && timeMax) {
    faqs.push({
      question: `How long does it take to launch a ${name} business in the US?`,
      answer: `You can expect to launch your ${name} business within ${formatDays(timeMin)} to ${formatDays(timeMax)}. This includes sourcing equipment and software, and getting your first customers.`,
    });
  }

  if (requirementCount > 0) {
    faqs.push({
      question: `What are the requirements to start a ${name} business in the US?`,
      answer: `A ${name} business in the US has ${requirementCount} requirements covering equipment, software, and operational needs. Some are essential while others are optional depending on your business scale.`,
    });
  }

  if (profitPotential) {
    const label = profitPotential.replace(/_/g, ' ');
    faqs.push({
      question: `Is a ${name} business profitable in the US?`,
      answer: `A ${name} business has ${label} profit potential in the US. Profitability depends on your location, scale of operation, and how well you manage costs and customer acquisition.`,
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
      question: `Where is the best place to start a ${name} business in the US?`,
      answer: `The best locations for a ${name} business in the US include ${locationList}. These areas offer strong customer demand, good infrastructure, or proximity to key suppliers.`,
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
  const business = await fetchBusiness(slug, 'US');

  if (!business) {
    return {
      title: 'Business Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const year = new Date().getFullYear();
  const name = business.name;
  const title = `${name} Business in the US [${year}] - Everything You Need to Know | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in the US. Explore requirements, startup costs, and everything you need to launch.`;

  const pageUrl = `${SITE_URL}/us/businesses/${slug}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `how to start a ${name} business in the US`,
      `${name} business guide US`,
      `${name} business requirements US`,
      `${name} startup cost US`,
      `start ${name} business`,
    ].join(', '),
    authors: [{ name: 'HustleCare' }],
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Start a ${name} business in the US` }],
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

// ── Static Params ─────────────────────────────────────────────────────────────
// Only pre-render businesses that actually have at least one US-visible
// requirement, so we don't statically build empty US pages for businesses
// that haven't been reviewed for the US market yet. See step 8 for the
// fuller design of this query.

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
  const business = await fetchBusiness(slug, 'US');

  if (!business) notFound();

  const year = new Date().getFullYear();
  const name = business.name;
  const pageUrl = `${SITE_URL}/us/businesses/${slug}`;

  const coreRequirements = business.requirements.filter(
    (r) => !isExcludedFromTotals(r.template.category ?? '')
  );

  const requirementCount = coreRequirements.length;
  const title = `${name} Business in the US [${year}] - Everything You Need to Know | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in the US with ${requirementCount} requirements and cost estimates.`;

  const grouped = coreRequirements.reduce<Record<string, typeof coreRequirements>>(
    (acc, req) => {
      const cat = req.template.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(req);
      return acc;
    },
    {}
  );

  const previewRequirements = coreRequirements.slice(0, 4).map((r) => ({
    id: r.id,
    name: r.template.name,
    category: r.template.category,
    necessity: r.template.necessity,
    image: r.template.image,
  }));

  const categoryBreakdown = Object.entries(grouped).map(([cat, reqs]) => ({
    name: cat,
    count: reqs.length,
    requiredCount: reqs.filter((r) => r.template.necessity === 'Required').length,
  }));

  let cost: CostData | null = null;
  try {
    let low = 0, medium = 0, high = 0, requirementsWithProducts = 0;
    const totalRequirements = coreRequirements.length;

    for (const req of coreRequirements) {
      const prices = req.template.products
        ?.map((p: { price: number | null }) => p.price)
        .filter((p): p is number => p !== null && p > 0)
        .sort((a: number, b: number) => a - b) ?? [];

      if (prices.length === 0) continue;
      requirementsWithProducts++;
      low    += prices[0];
      high   += prices[prices.length - 1];
      medium += prices[Math.floor(prices.length / 2)];
    }

    cost = {
      low,
      medium,
      high,
      requirementsWithProducts,
      totalRequirements,
      hasPricing: requirementsWithProducts > 0,
    };
  } catch {
    cost = null;
  }

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
  // business.faqs here. Those FAQ rows were authored for the Kenya market
  // (e.g. reference county permits, KES figures) and would be wrong if
  // reused verbatim on the US page. Until US-specific FAQ overrides exist
  // (a future country-scoped FAQ table/field), this page always uses the
  // auto-generated US copy above.
  const finalFaqs = autoFaqs;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/us` },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_URL}/us/businesses` },
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
        datePublished:
          (business as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-US',
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
        market="US"
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