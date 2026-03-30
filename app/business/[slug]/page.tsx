// app/business/[slug]/page.tsx
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
      requirements: { select: { id: true } },
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
  const pageUrl = `${siteUrl}/business/${slug}`;
  const ogImage = business.image || `${siteUrl}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords: [
      `how to start a ${business.name} business`,
      `how to start a ${business.name} business in Kenya`,
      `${business.name} business requirements`,
      `${business.name} startup cost`,
      `${business.name} startup cost in Kenya`,
      `${business.name} cost calculator`,
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
      locale: 'en_US',
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

  const requirementCount = business.requirements?.length ?? 0;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
  const pageUrl = `${siteUrl}/business/${slug}`;
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

      // 3. Service — describes Hustlecare's startup-guide service for this business
      //    (previously emitted from BusinessHeader.tsx, a client component where
      //    it was not reliably seen by crawlers)
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