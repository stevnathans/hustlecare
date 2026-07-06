// app/businesses/[slug]/requirements/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessPageContent from './BusinessPageContent';
import { prisma } from '@/lib/prisma';
import type { Business as BusinessData, Requirement as RequirementData } from 'hooks/useBusinessData';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

interface RequirementFaq {
  question: string;
  answer: string;
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchBusinessWithRequirements(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      requirements: {
        // Match the hub page's filtering so both pages agree on the
        // canonical set of requirements. Previously this query had no
        // isActive/isDeprecated filter and no explicit ordering, so this
        // page could show stale/deprecated items the hub page excluded.
        where: { isActive: true, template: { isDeprecated: false } },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          templateId: true,
          necessityOverride: true,
          descriptionOverride: true,
          template: {
            select: {
              name: true,
              description: true,
              category: true,
              necessity: true,
              image: true,
            },
          },
        },
      },
    },
  });
  return business;
}

// ── Title Builder ─────────────────────────────────────────────────────────────
// "Kenya" is now explicit in the title. Previously this page's own title
// omitted it while the hub and how-to-start pages both included it, which
// made those pages a stronger literal match for searches like
// "requirements to start a barbershop business in Kenya."

function buildTitle(businessName: string, requirementCount: number): string {
  const year = new Date().getFullYear();
  if (requirementCount > 0) {
    return `${requirementCount} Requirements To Start a ${businessName} Business in Kenya (${year} Costs & Checklist)`;
  }
  return `${businessName} Business Requirements in Kenya - Complete Checklist & Costs`;
}

// ── FAQ Builder ────────────────────────────────────────────────────────────────
// Small, requirements-specific FAQ set generated from data already fetched
// above. Deliberately different in focus from the hub page's FAQs (which
// cover cost/time/profitability/location) so the two pages don't compete
// with near-duplicate FAQ content.

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

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusinessWithRequirements(slug);

  if (!business) {
    return {
      title: 'Business Not Found | HustleCare',
      description: 'The requested business could not be found. Browse our full list of businesses with startup guides and cost calculators.',
      robots: { index: false, follow: true },
    };
  }

  const requirementCount = business.requirements?.length ?? 0;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Explore all ${requirementCount} requirements to start a ${business.name} business in Kenya. Use our cost calculator to estimate your total investment and get a complete launch plan.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/businesses/${slug}/requirements`;
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;

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
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `What you need to start a ${business.name} business`,
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
    },

    category: 'Business',
    classification: 'Business Directory',

    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const businesses = await prisma.business.findMany({ select: { slug: true } });
    return businesses.map((b) => ({ slug: b.slug }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await fetchBusinessWithRequirements(slug);

  if (!business) {
    notFound();
  }

  const requirements = business.requirements ?? [];
  const requirementCount = requirements.length;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/businesses/${slug}/requirements`;
  const hubUrl = `${siteUrl}/businesses/${slug}`;
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Complete guide to starting a ${business.name} business in Kenya with ${requirementCount} requirements and cost calculator.`;

  // ── Requirement counts (for FAQs and general use) ───────────────────────
  const requiredCount = requirements.filter(
    (req) => (req.necessityOverride ?? req.template.necessity) === 'Required'
  ).length;
  const optionalCount = requirementCount - requiredCount;

  // ── Structured Data ─────────────────────────────────────────────────────────
  //
  // All JSON-LD is emitted here in the server component so it is present in the
  // raw HTML response that search-engine crawlers receive — client components are
  // hydrated too late for reliable schema injection.
  //
  // We use a @graph array so all nodes share a single <script> tag and Google can
  // understand their relationships.
  //
  // Requirements are typed as "Thing" (not "Product") — they are prerequisites
  // for starting a business, not purchasable items. Using "Product" here caused
  // Google Search Console to flag missing required Product fields (offers, price).

  // Group requirements by category for the ItemList, preserving insertion order.
  const categoryMap = new Map<string, typeof requirements>();
  for (const req of requirements) {
    const cat = req.template.category ?? 'General';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(req);
  }

  // Build a flat, sequentially-numbered list of all requirements across categories.
  let position = 1;
  const requirementListItems = requirements.map((req) => ({
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

  // Auto-generated FAQ content, distinct in focus from the hub page's FAQs.
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
      // 1. BreadcrumbList — enables breadcrumb rich results
      //    Fixed: the business-name node now points at the hub page URL
      //    (previously it incorrectly pointed at this page's own URL, which
      //    conflicted with the hub page's breadcrumb claiming that same node).
      //    Added a 4th "Requirements" node for this page itself.
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

      // 2. Article — signals editorial content about starting a business
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
          url: siteUrl,
        },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: siteUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${siteUrl}/images/logo.png`,
          },
        },
        // Real createdAt/updatedAt from the Business model — previously this
        // used a type-cast fallback because createdAt wasn't reliably present
        // on the fetched object, and dateModified was always "now."
        datePublished: business.createdAt.toISOString(),
        dateModified: business.updatedAt.toISOString(),
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': pageUrl,
        },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
        about: {
          '@type': 'Thing',
          name: `${business.name} Business`,
        },
        keywords: [
          `how to start a ${business.name} business`,
          `${business.name} business requirements`,
          `${business.name} startup cost Kenya`,
        ].join(', '),
      },

      // 3. Service — describes HustleCare's startup-guide service for this business
      {
        '@type': 'Service',
        '@id': `${pageUrl}#service`,
        name: `${business.name} Business Startup Guide`,
        description: `Complete guide to starting a ${business.name} business in Kenya with detailed requirements and cost estimates.`,
        provider: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: siteUrl,
        },
        areaServed: {
          '@type': 'Country',
          name: 'Kenya',
          sameAs: 'https://en.wikipedia.org/wiki/Kenya',
        },
        url: pageUrl,
      },

      // 4. ItemList — the flat list of all requirements as "Thing" nodes.
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

      // 5. FAQPage — new. Gives this page its own FAQ rich-result eligibility
      //    instead of ceding all FAQ presence to the hub page.
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
    ],
  };

  // ── Data shaped for the client hook's initial state ──────────────────────
  // Passed into BusinessPageContent so the requirements list is present in
  // the server-rendered HTML instead of only appearing after a client-side
  // fetch resolves post-hydration.
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
  };

  const initialRequirements: RequirementData[] = requirements.map((req) => ({
    id: req.id,
    templateId: req.templateId,
    name: req.template.name,
    description: req.descriptionOverride ?? req.template.description ?? null,
    category: req.template.category ?? null,
    necessity: req.necessityOverride ?? req.template.necessity,
    image: req.template.image ?? null,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Pass resolved slug string — NOT the params Promise — plus the
          server-fetched business/requirements/FAQs for SSR content. */}
      <BusinessPageContent
        slug={slug}
        initialBusiness={initialBusiness}
        initialRequirements={initialRequirements}
        faqs={requirementFaqs}
      />
    </>
  );
}