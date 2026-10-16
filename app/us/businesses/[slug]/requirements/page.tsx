// app/us/businesses/[slug]/requirements/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessPageContent from '../../../../businesses/[slug]/requirements/BusinessPageContent';
import { fetchBusinessWithRequirements, groupRequirementsByCategory } from '@/lib/business-data';
import type { CategoryLinkInfo } from '@/components/DetailsPage/RequirementsSection';
import { prisma } from '@/lib/prisma';
import { isExcludedFromTotals } from '@/lib/necessity';
import type { Business as BusinessData, Requirement as RequirementData } from 'hooks/useBusinessData';
import { selectTemplateDescription } from '@/lib/requirement-description';
import {
  marketBasePath,
  marketCountryPhrase,
  marketCountrySameAs,
  marketHreflang,
  marketLabel,
  marketOgLocale,
  type MarketCode,
} from '@/lib/markets';
import { withArticle } from '@/lib/grammar';
import { pickWithinLimit, TITLE_MAX } from '@/lib/seo-fit';

export const revalidate = 300; // regenerate at most every 5 minutes

// The ONLY market-specific line in this file (see lib/markets.ts).
const market: MarketCode = 'US';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
// US: https://hustlecare.net/us
const BASE_PATH = marketBasePath(market);
const SITE_BASE = `${SITE_URL}${BASE_PATH}`;
const COUNTRY = marketCountryPhrase(market); // "the US"
const HREFLANG = marketHreflang(market);

// Stage 4.5 — same threshold as the Kenya requirements page and its
// [category] sub-route counterpart. Kept as its own local constant here
// (rather than a shared import) to match this file's existing convention
// of near-duplicating the Kenya page rather than sharing state across the
// two market implementations — see the module comments throughout this
// file for the fuller reasoning already established at Stage 2/3.
const CATEGORY_PAGE_THRESHOLD = 3;

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

interface RequirementFaq {
  question: string;
  answer: string;
}

// ── Core/Stock split ──────────────────────────────────────────────────────────
// Same reasoning as the Kenya requirements page — see that file for the
// fuller comment. Stock requirements are sellable inventory, not fixed
// startup requirements, so they're excluded from every SEO-facing count
// here and get their own separate structured-data ItemList further down.
//
// Stage 3 Part B: reads RequirementCategory.excludedFromTotals
// (template.categoryRef) instead of string-comparing template.category,
// with the same fallback as the Kenya page for a template with no
// categoryRef yet.
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

// ── Title Builder ─────────────────────────────────────────────────────────────
// Fitted to TITLE_MAX so it isn't truncated in the browser tab or search
// results — longest wording first, falling back to shorter ones.

function buildTitle(businessName: string, requirementCount: number): string {
  const year = new Date().getFullYear();
  const a = withArticle(businessName);
  if (requirementCount > 0) {
    return pickWithinLimit(
      [
        `${requirementCount} Requirements To Start ${a} Business in ${COUNTRY} (${year} Costs & Checklist)`,
        `${requirementCount} Requirements to Start ${a} Business in ${COUNTRY} (${year})`,
        `${requirementCount} Requirements to Start ${a} Business in ${COUNTRY}`,
      ],
      TITLE_MAX
    );
  }
  return pickWithinLimit(
    [
      `${businessName} Business Requirements in ${COUNTRY} - Complete Checklist & Costs`,
      `${businessName} Business Requirements in ${COUNTRY}`,
    ],
    TITLE_MAX
  );
}

// ── FAQ Builder ────────────────────────────────────────────────────────────────

function buildRequirementsFaqs(
  businessName: string,
  totalRequirements: number,
  requiredCount: number,
  optionalCount: number,
  categories: string[],
): RequirementFaq[] {
  const faqs: RequirementFaq[] = [];
  const a = withArticle(businessName);

  if (totalRequirements > 0) {
    faqs.push({
      question: `What do I need to start ${a} business in ${COUNTRY}?`,
      answer: `To start ${a} business in ${COUNTRY}, you need ${totalRequirements} requirements in total${
        categories.length > 0 ? `, covering categories such as ${categories.join(', ')}` : ''
      }. Use the checklist on this page to see every item and add them to the cost calculator to estimate your total investment.`,
    });
  }

  if (requiredCount > 0) {
    faqs.push({
      question: `How many of the ${businessName} business requirements are mandatory?`,
      answer: `Out of the ${totalRequirements} requirements listed for ${a} business, ${requiredCount} ${
        requiredCount === 1 ? 'is essential' : 'are essential'
      } and ${optionalCount} ${
        optionalCount === 1 ? 'is optional' : 'are optional'
      }, depending on the scale at which you plan to operate.`,
    });
  }

  return faqs;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusinessWithRequirements(slug, market);

  const requirementCount = business
    ? splitCoreAndStock(business.requirements ?? []).core.length
    : 0;

  // Guards against both a genuinely missing business AND a business with
  // zero US-visible requirements — same anti-thin-content bar as
  // generateStaticParams below and the US hub page.
  if (!business || requirementCount === 0) {
    return {
      title: 'Business Not Found | HustleCare',
      description: 'The requested business could not be found. Browse our full list of businesses with startup guides and cost calculators.',
      robots: { index: false, follow: true },
    };
  }

  const a = withArticle(business.name);
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Explore all ${requirementCount} requirements to start ${a} business in ${COUNTRY}. Use our cost calculator to estimate your total investment and get a complete launch plan.`;

  const pageUrl = `${SITE_BASE}/businesses/${slug}/requirements`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `how to start ${a} business`,
      `how to start ${a} business in ${COUNTRY}`,
      `${business.name} business requirements`,
      `${business.name} business equipment list`,
      `${business.name} startup cost in ${COUNTRY}`,
      `${business.name} cost calculator`,
      `${business.name} business plan`,
      `equipment list to start ${a} business`,
      `business planning in ${COUNTRY}`,
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
      locale: marketOgLocale(market),
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `What you need to start ${a} business`,
        },
      ],
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
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    alternates: {
      canonical: pageUrl,
      // The Kenya requirements page for this slug is always guaranteed to
      // exist (its bar isn't gated on requirement count), so no
      // eligibility check is needed in this direction.
      languages: {
        [HREFLANG]: pageUrl,
        [marketHreflang('KE')]: `${SITE_URL}${marketBasePath('KE')}/businesses/${slug}/requirements`,
      },
    },

    category: 'Business',
    classification: 'Business Directory',

    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────
// Same filter as app/us/businesses/[slug]/page.tsx — only pre-render
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
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function USBusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await fetchBusinessWithRequirements(slug, market);

  if (!business) {
    notFound();
  }

  const requirements = business.requirements ?? [];
  const { core: coreRequirements, stock: stockRequirements } = splitCoreAndStock(requirements);
  const requirementCount = coreRequirements.length;

  // Same bar as generateStaticParams and generateMetadata above — a
  // business that slipped through to this on-demand render but has zero
  // qualifying requirements gets a real 404 instead of an empty,
  // indexable page.
  if (requirementCount === 0) {
    notFound();
  }

  const a = withArticle(business.name);
  const pageUrl = `${SITE_BASE}/businesses/${slug}/requirements`;
  const hubUrl = `${SITE_BASE}/businesses/${slug}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Complete guide to starting ${a} business in ${COUNTRY} with ${requirementCount} requirements and cost calculator.`;

  const requiredCount = coreRequirements.filter(
    (req) => (req.necessityOverride ?? req.template.necessity) === 'Required'
  ).length;
  const optionalCount = requirementCount - requiredCount;

  // ── Category-scoped checklist links (Stage 4.5) ──────────────────────────
  // Same grouping as the Kenya page, pointed at the US sub-route
  // (/us/businesses/{slug}/requirements/{category-slug}). See that file's
  // fuller comment on why the grouping runs over ALL active requirements
  // (Stock included) rather than just coreRequirements.
  const categoryGroups = groupRequirementsByCategory(requirements);
  const categoryLinks: Record<string, CategoryLinkInfo> = {};
  for (const [categoryName, group] of Object.entries(categoryGroups)) {
    if (group.slug && group.items.length >= CATEGORY_PAGE_THRESHOLD) {
      categoryLinks[categoryName] = {
        href: `${BASE_PATH}/businesses/${slug}/requirements/${group.slug}`,
        count: group.items.length,
      };
    }
  }

  // ── Structured Data ─────────────────────────────────────────────────────────

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
        `${req.template.name} required to start ${a} business`,
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'category',
          value: req.template.category ?? 'General',
        },
        {
          '@type': 'PropertyValue',
          name: 'necessity',
          value: req.necessityOverride ?? req.template.necessity,
        },
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
        {
          '@type': 'PropertyValue',
          name: 'category',
          value: req.template.category ?? 'Stock',
        },
        {
          '@type': 'PropertyValue',
          name: 'demand',
          value: req.necessityOverride ?? req.template.necessity,
        },
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
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_BASE },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_BASE}/businesses` },
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
        image: {
          '@type': 'ImageObject',
          url: ogImage,
          width: 1200,
          height: 630,
        },
        author: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/images/logo.png`,
          },
        },
        datePublished: business.createdAt.toISOString(),
        dateModified: business.updatedAt.toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageUrl,
        },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: HREFLANG,
        about: {
          '@type': 'Thing',
          name: `${business.name} Business`,
        },
        keywords: [
          `how to start ${a} business`,
          `${business.name} business requirements`,
          `${business.name} startup cost in ${COUNTRY}`,
        ].join(', '),
      },
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: `${business.name} Business Startup Guide`,
        description: `Complete guide to starting ${a} business in ${COUNTRY} with detailed requirements and cost estimates.`,
        provider: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
        },
        areaServed: {
          '@type': 'Country',
          name: marketLabel(market),
          sameAs: marketCountrySameAs(market),
        },
        url: pageUrl,
      },
      ...(requirementListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#requirements`,
              name: `Complete Requirements for Starting ${a} Business in ${COUNTRY}`,
              description: `All ${requirementCount} requirements needed to start ${a} business in ${COUNTRY}, covering essential and optional items.`,
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
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            },
          ]
        : []),
      ...(stockListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#stock`,
              name: `Popular Products You Can Sell in ${a} Business`,
              description: `${stockRequirements.length} product${
                stockRequirements.length === 1 ? '' : 's'
              } commonly stocked by ${business.name} businesses in ${COUNTRY}. These are inventory suggestions, not startup requirements.`,
              numberOfItems: stockRequirements.length,
              itemListElement: stockListItems,
            },
          ]
        : []),
    ],
  };

  // ── Data shaped for the client hook's initial state ──────────────────────
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

  // slug deliberately always null on the US market for now —
  // /requirements/{slug} was Kenya-scoped until Stage 4; a market-aware
  // /us/requirements/{slug} now exists, so this could be re-enabled, but
  // is left as-is here since re-pointing it is outside this stage's scope
  // — flip back to `req.template.published ? req.template.slug : null`
  // and point RequirementCard at the US route for this market when ready.
  //
  // Stage 3 Part B: excludedFromTotals/usesLegalCountyFilter threaded
  // through the same way as the Kenya page — see that file for the fuller
  // comment. The Legal county-vendor filter never actually applies on the
  // US market (BusinessPageContent.tsx's isKenya guard short-circuits it
  // before this flag is read), but it's threaded here anyway for type
  // consistency with RequirementData and so the two market page
  // implementations don't quietly diverge.
  const initialRequirements: RequirementData[] = requirements.map((req) => ({
    id: req.id,
    templateId: req.templateId,
    name: req.template.name,
    description: req.descriptionOverride ?? selectTemplateDescription(req.template, market) ?? null,
    category: req.template.category ?? null,
    necessity: req.necessityOverride ?? req.template.necessity,
    image: req.template.image ?? null,
    slug: null,
    excludedFromTotals:
      req.template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(req.template.category ?? ''),
    usesLegalCountyFilter:
      req.template.categoryRef?.usesLegalCountyFilter ?? (req.template.category === 'Legal'),
  }));

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
        categoryLinks={categoryLinks}
      />
    </>
  );
}