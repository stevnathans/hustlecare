// app/businesses/[slug]/requirements/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessPageContent from './BusinessPageContent';
import { prisma } from '@/lib/prisma';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchBusinessWithRequirements(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      requirements: {
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
            },
          },
        },
      },
    },
  });
  return business;
}

// ── Title Builder ─────────────────────────────────────────────────────────────

function buildTitle(businessName: string, requirementCount: number): string {
  const year = new Date().getFullYear();
  if (requirementCount > 0) {
    return `${requirementCount} Requirements To Start a ${businessName} Business in ${year} (Plus Total Cost Calculations)`;
  }
  return `${businessName} Business - Complete Requirements & Total Costs`;
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
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Complete guide to starting a ${business.name} business in Kenya with ${requirementCount} requirements and cost calculator.`;

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

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. BreadcrumbList — enables breadcrumb rich results
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${siteUrl}/businesses` },
          { '@type': 'ListItem', position: 3, name: business.name, item: pageUrl },
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
        // datePublished is required for Article rich results; fall back to
        // createdAt if your Prisma model exposes it, otherwise use a fixed
        // date that reflects when the content was first published.
        datePublished:
          (business as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date().toISOString(),
        dateModified: new Date().toISOString(),
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
      //
      //    Previously this was generated client-side in RequirementsSection.tsx
      //    with "@type": "Product", which caused two problems:
      //      a) Google flagged missing Product-required fields (offers, price, etc.)
      //      b) Client components inject <script> after hydration, so crawlers
      //         may not see the schema in the initial HTML response.
      //
      //    Moving it here (server component) and typing items as "Thing" fixes both.
      ...(requirementListItems.length > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#requirements`,
              name: `Complete Requirements for Starting a ${business.name} Business`,
              description: `All ${requirementCount} requirements needed to start a ${business.name} business in Kenya, covering essential and optional items.`,
              numberOfItems: requirementCount,
              itemListElement: requirementListItems,
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

      {/* Pass resolved slug string — NOT the params Promise */}
      <BusinessPageContent slug={slug} />
    </>
  );
}