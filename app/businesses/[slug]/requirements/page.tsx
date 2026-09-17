// app/businesses/[slug]/requirements/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessPageContent from './BusinessPageContent';
import { fetchBusinessWithRequirements, isUSMarketEligible } from '@/lib/business-data';
import { getRequirementsPageCostSummary } from '@/lib/cost-data';
import { isExcludedFromTotals } from '@/lib/necessity';
import type { Business as BusinessData, Requirement as RequirementData } from 'hooks/useBusinessData';
import { selectTemplateDescription } from '@/lib/requirement-description';
import { type MarketCode } from '@/lib/markets';
import type { CostRecurrence, SizeBand } from '@/lib/cost-engine';

export const revalidate = 300;
const market: MarketCode = 'KE';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

interface RequirementFaq {
  question: string;
  answer: string;
}

function splitCoreAndStock<T extends {
  template: { category: string | null; categoryRef?: { excludedFromTotals: boolean } | null };
}>(requirements: T[]): { core: T[]; stock: T[] } {
  const core: T[] = [];
  const stock: T[] = [];
  requirements.forEach((req) => {
    const excluded =
      req.template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(req.template.category ?? '');
    if (excluded) {
      stock.push(req);
    } else {
      core.push(req);
    }
  });
  return { core, stock };
}

function buildTitle(businessName: string, requirementCount: number): string {
  const year = new Date().getFullYear();
  if (requirementCount > 0) {
    return `${requirementCount} Requirements To Start a ${businessName} Business in Kenya (${year} Checklist)`;
  }
  return `${businessName} Business Requirements in Kenya - Complete Checklist`;
}

function buildRequirementsFaqs(
  businessName: string,
  totalRequirements: number,
  requiredCount: number,
  optionalCount: number,
  categories: string[],
): RequirementFaq[] {
  const faqs: RequirementFaq[] = [];

  if (totalRequirements > 0) {
    faqs.push({
      question: `What do I need to start a ${businessName} business in Kenya?`,
      answer: `To start a ${businessName} business in Kenya, you need ${totalRequirements} requirements in total${
        categories.length > 0 ? `, covering categories such as ${categories.join(', ')}` : ''
      }. Use the checklist on this page to see every item and add them to the cost calculator to estimate your total investment.`,
    });
  }

  if (requiredCount > 0) {
    faqs.push({
      question: `How many of the ${businessName} business requirements are mandatory?`,
      answer: `Out of the ${totalRequirements} requirements listed for a ${businessName} business, ${requiredCount} ${
        requiredCount === 1 ? 'is essential' : 'are essential'
      } and ${optionalCount} ${
        optionalCount === 1 ? 'is optional' : 'are optional'
      }, depending on the scale at which you plan to operate.`,
    });
  }

  return faqs;
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusinessWithRequirements(slug, market);

  if (!business) {
    return {
      title: 'Business Not Found | HustleCare',
      description: 'The requested business could not be found. Browse our full list of businesses with startup guides and cost calculators.',
      robots: { index: false, follow: true },
    };
  }

  const { core } = splitCoreAndStock(business.requirements ?? []);
  const requirementCount = core.length;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Explore all ${requirementCount} requirements to start a ${business.name} business in Kenya. Use our cost calculator to estimate your total investment and get a complete launch plan.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/businesses/${slug}/requirements`;
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;

  const usEligible = await isUSMarketEligible(business.id);

  return {
    title,
    description,
    keywords: [
      `how to start a ${business.name} business`,
      `how to start a ${business.name} business in Kenya`,
      `${business.name} business requirements`,
      `${business.name} business equipment list`,
      `${business.name} startup cost in Kenya`,
      `${business.name} cost calculator`,
      `${business.name} business plan`,
      `equipment list to start a ${business.name} business`,
      `legal requirements to start a ${business.name} business in Kenya`,
      'business planning Kenya',
      'investment calculator',
      'business requirements checklist',
    ].join(', '),
    authors: [{ name: 'HustleCare' }],
    creator: 'HustleCare',
    publisher: 'HustleCare',
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: 'en_KE',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `What you need to start a ${business.name} business` }],
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
      googleBot: { index: true, follow: true, 'max-video-preview': -1, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        'en-KE': pageUrl,
        ...(usEligible ? { 'en-US': `${siteUrl}/us/businesses/${slug}/requirements` } : {}),
      },
    },
    category: 'Business',
    classification: 'Business Directory',
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

export async function generateStaticParams() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const businesses = await prisma.business.findMany({ select: { slug: true } });
    return businesses.map((b) => ({ slug: b.slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;

  // costSummary is now a Record<SizeBand, RequirementsPageCostSummary> —
  // one full summary per size band, feeding BusinessHeader's fallback for
  // whichever band the person has selected.
  const [business, costSummary] = await Promise.all([
    fetchBusinessWithRequirements(slug, market),
    getRequirementsPageCostSummary(slug, market),
  ]);

  if (!business) {
    notFound();
  }

  const requirements = business.requirements ?? [];
  const { core: coreRequirements, stock: stockRequirements } = splitCoreAndStock(requirements);
  const requirementCount = coreRequirements.length;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/businesses/${slug}/requirements`;
  const hubUrl = `${siteUrl}/businesses/${slug}`;
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Complete guide to starting a ${business.name} business in Kenya with ${requirementCount} requirements and cost calculator.`;

  const requiredCount = coreRequirements.filter(
    (req) => (req.necessityOverride ?? req.template.necessity) === 'Required'
  ).length;
  const optionalCount = requirementCount - requiredCount;

  const categoryMap = new Map<string, typeof requirements>();
  for (const req of coreRequirements) {
    const cat = req.template.category ?? 'General';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(req);
  }

  let position = 1;
  const requirementListItems = coreRequirements.map((req) => ({
    '@type': 'ListItem',
    position: position++,
    item: {
      '@type': 'Thing',
      name: req.template.name,
      description:
        req.descriptionOverride ||
        req.template.description ||
        `${req.template.name} required to start a ${business.name} business`,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'category', value: req.template.category ?? 'General' },
        { '@type': 'PropertyValue', name: 'necessity', value: req.necessityOverride ?? req.template.necessity },
      ],
    },
  }));

  let stockPosition = 1;
  const stockListItems = stockRequirements.map((req) => ({
    '@type': 'ListItem',
    position: stockPosition++,
    item: {
      '@type': 'Thing',
      name: req.template.name,
      description:
        req.descriptionOverride ||
        req.template.description ||
        `${req.template.name} — a product ${business.name} businesses commonly stock and sell`,
      additionalProperty: [
        { '@type': 'PropertyValue', name: 'category', value: req.template.category ?? 'Stock' },
        { '@type': 'PropertyValue', name: 'demand', value: req.necessityOverride ?? req.template.necessity },
      ],
    },
  }));

  const requirementFaqs = buildRequirementsFaqs(
    business.name,
    requirementCount,
    requiredCount,
    optionalCount,
    Array.from(categoryMap.keys()),
  );

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${siteUrl}/businesses` },
          { '@type': 'ListItem', position: 3, name: business.name, item: hubUrl },
          { '@type': 'ListItem', position: 4, name: 'Requirements', item: pageUrl },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: title,
        description,
        url: pageUrl,
        image: { '@type': 'ImageObject', url: ogImage, width: 1200, height: 630 },
        author: { '@type': 'Organization', name: 'HustleCare', url: siteUrl },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: siteUrl,
          logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
        },
        datePublished: business.createdAt.toISOString(),
        dateModified: business.updatedAt.toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
        about: { '@type': 'Thing', name: `${business.name} Business` },
        keywords: [
          `how to start a ${business.name} business`,
          `${business.name} business requirements`,
          `${business.name} startup cost Kenya`,
        ].join(', '),
      },
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: `${business.name} Business Startup Guide`,
        description: `Complete guide to starting a ${business.name} business in Kenya with detailed requirements and cost estimates.`,
        provider: { '@type': 'Organization', name: 'HustleCare', url: siteUrl },
        areaServed: { '@type': 'Country', name: 'Kenya', sameAs: 'https://en.wikipedia.org/wiki/Kenya' },
        url: pageUrl,
      },
      ...(requirementListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#requirements`,
              name: `Complete Requirements for Starting a ${business.name} Business In Kenya`,
              description: `All ${requirementCount} requirements needed to start a ${business.name} business in Kenya, covering essential and optional items.`,
              numberOfItems: requirementCount,
              itemListElement: requirementListItems,
            },
          ]
        : []),
      ...(requirementFaqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: requirementFaqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ]
        : []),
      ...(stockListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#stock`,
              name: `Popular Products You Can Sell in a ${business.name} Business`,
              description: `${stockRequirements.length} product${
                stockRequirements.length === 1 ? '' : 's'
              } commonly stocked by ${business.name} businesses in Kenya. These are inventory suggestions, not startup requirements.`,
              numberOfItems: stockRequirements.length,
              itemListElement: stockListItems,
            },
          ]
        : []),
    ],
  };

  const effectiveTradeClassId = business.tradeClassId ?? business.category?.defaultTradeClassId ?? null;

  const initialBusiness: BusinessData = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    image: business.image,
    published: business.published,
    categoryId: business.categoryId,
    userId: business.userId,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    costMin: business.costMin,
    costMax: business.costMax,
    timeToLaunchMin: business.timeToLaunchMin,
    timeToLaunchMax: business.timeToLaunchMax,
    profitPotential: business.profitPotential,
    skillLevel: business.skillLevel,
    bestLocations: business.bestLocations,
    tradeClassId: business.tradeClassId,
    effectiveTradeClassId,
  };

  const initialRequirements: RequirementData[] = requirements.map((req) => {
    const recurrence: CostRecurrence =
      req.template.costRecurrence ?? req.template.categoryRef?.defaultCostRecurrence ?? 'ONE_TIME';

    const quantityByBand = req.quantities.reduce<Partial<Record<SizeBand, number>>>((acc, row) => {
      acc[row.sizeBand as SizeBand] = row.quantity;
      return acc;
    }, {});

    return {
      id: req.id,
      templateId: req.templateId,
      name: req.template.name,
      description: req.descriptionOverride ?? selectTemplateDescription(req.template, market) ?? null,
      category: req.template.category ?? null,
      necessity: req.necessityOverride ?? req.template.necessity,
      image: req.template.image ?? null,
      slug: req.template.published ? req.template.slug : null,
      excludedFromTotals:
        req.template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(req.template.category ?? ''),
      usesLegalCountyFilter:
        req.template.categoryRef?.usesLegalCountyFilter ?? (req.template.category === 'Legal'),
      // ── Cost engine size-band support ──────────────────────────────
      quantity: req.defaultQuantity,
      quantityByBand,
      recurrence,
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <BusinessPageContent
        slug={slug}
        initialBusiness={initialBusiness}
        initialRequirements={initialRequirements}
        faqs={requirementFaqs}
        market={market}
        initialCost={costSummary}
      />
    </>
  );
}