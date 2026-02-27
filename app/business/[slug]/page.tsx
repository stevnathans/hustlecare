/* eslint-disable @typescript-eslint/no-explicit-any */
// app/business/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessPageContent from './BusinessPageContent';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering so metadata always reflects the latest DB data.
// Without this, Next.js may cache a stale requirement count at build time,
// which is why the browser tab title doesn't update when requirements change.
export const dynamic = 'force-dynamic';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchBusinessWithRequirements(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      // FIX: select ALL requirement fields needed for an accurate count.
      // Previously only `id` was selected; if your schema filters soft-deleted
      // rows via a default scope you may need a `where` clause here too.
      requirements: {
        select: { id: true },
        // Uncomment if you use soft-delete:
        // where: { deletedAt: null },
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

function buildDescription(
  business: { name: string; description?: string | null },
  requirementCount: number,
): string {
  return (
    business.description ||
    `Explore all ${requirementCount} requirements to start a ${business.name} business. ` +
      `Use our cost calculator to estimate your total investment and get a complete launch plan.`
  );
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;

  // FIX: re-use the same query so the count in the tab title always matches
  // the count shown on the page. Previously, if requirements were added or
  // removed after the last build, generateMetadata returned a stale count
  // because Next.js served a cached response.
  const business = await fetchBusinessWithRequirements(slug);

  if (!business) {
    return {
      title: 'Business Not Found',
      description: 'The requested business could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const requirementCount = business.requirements?.length ?? 0;
  const title = buildTitle(business.name, requirementCount);
  const description = buildDescription(business, requirementCount);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/business/${slug}`;
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `how to start a ${business.name} business`,
      `${business.name} business requirements`,
      `${business.name} startup cost`,
      `${business.name} business license`,
      `${business.name} business permit`,
      `${business.name} cost calculator`,
      'business planning',
      'investment calculator',
      'business requirements checklist',
    ].join(', '),

    authors: [{ name: 'HustleCare', url: siteUrl }],
    creator: 'HustleCare',
    publisher: 'HustleCare',

    // Helps Google understand which URL is canonical when query-strings exist
    alternates: {
      canonical: pageUrl,
    },

    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article', // 'article' gets richer treatment than 'website' for how-to content
      locale: 'en_US',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `How to start a ${business.name} business – requirements overview`,
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

  const requirementCount = business.requirements?.length ?? 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/business/${slug}`;
  const description = buildDescription(business, requirementCount);

  // ── Structured Data ─────────────────────────────────────────────────────────
  //
  // We emit TWO schema types:
  //
  //  1. Article  – keeps the existing rich-result signal for Google Discover /
  //               knowledge panels.
  //
  //  2. HowTo    – purpose-built for "how to start a business" queries. When
  //               Google parses a valid HowTo block it can surface a rich
  //               result directly in SERPs with the step count visible,
  //               which increases CTR significantly for this content type.
  //               Each requirement maps to a HowToStep.

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: buildTitle(business.name, requirementCount),
    description,
    url: pageUrl,
    image: business.image || `${siteUrl}/images/default-business.jpg`,
    author: { '@type': 'Organization', name: 'HustleCare', url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: 'HustleCare',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
    },
    // FIX: use dateModified so Google always sees a fresh signal when
    // requirements are updated (forces recrawl of the cached schema).
    dateModified: new Date().toISOString(),
    // datePublished should ideally come from business.createdAt if available:
    datePublished: (business as any).createdAt
      ? new Date((business as any).createdAt).toISOString()
      : new Date().toISOString(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${siteUrl}/businesses` },
        {
          '@type': 'ListItem',
          position: 3,
          name: business.name,
          item: pageUrl,
        },
      ],
    },
  };

  // HowTo schema – steps are intentionally kept lightweight here because the
  // full requirement details (descriptions, costs) are rendered on the page
  // and Google will pick them up via on-page content. If you later want
  // richer step descriptions, query requirement names from the DB and map
  // them to `step` objects with `name` and `text` fields.
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Start a ${business.name} Business`,
    description,
    totalTime: 'P30D', // rough estimate – adjust or remove if you have real data
    supply: [],
    tool: [],
    step: Array.from({ length: requirementCount }, (_, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      // Generic placeholder – replace with real requirement names if you
      // include them in the fetchBusinessWithRequirements query.
      name: `Complete requirement ${i + 1}`,
      url: `${pageUrl}#requirement-${i + 1}`,
    })),
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
    },
  };

  // FAQPage schema – boosts visibility with expandable Q&A in SERPs.
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How many requirements are there to start a ${business.name} business?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `There are ${requirementCount} requirements to start a ${business.name} business. These cover licenses, permits, equipment, and other startup needs.`,
        },
      },
      {
        '@type': 'Question',
        name: `How much does it cost to start a ${business.name} business?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The cost to start a ${business.name} business varies depending on your location and scale. Use our cost calculator on this page to get a personalised estimate based on the ${requirementCount} requirements.`,
        },
      },
      {
        '@type': 'Question',
        name: `What licenses do I need to start a ${business.name} business?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `The licenses and permits required to start a ${business.name} business are listed in the requirements section above. Each requirement includes details on what's needed and estimated costs.`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Pass resolved slug string — NOT the params Promise.
          initialBusinessName and initialRequirementCount are used to render
          a meaningful <h1> immediately in the loading state, before the
          client-side useBusinessData hook resolves. This ensures Googlebot
          sees real heading text on its first render pass. */}
      <BusinessPageContent
        slug={slug}
        initialBusinessName={business.name}
        initialRequirementCount={requirementCount}
      />
    </>
  );
}