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
      // Adjust relation name to match your Prisma schema
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
      title: 'Business Not Found',
      description: 'The requested business could not be found.',
      robots: { index: false, follow: false },
    };
  }

  const requirementCount = business.requirements?.length ?? 0;
  const title = buildTitle(business.name, requirementCount);
  const description =
    business.description ||
    `Explore all ${requirementCount} requirements to start a ${business.name} business. Use our cost calculator to estimate your total investment and get a complete launch plan.`;

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
      `${business.name} cost calculator`,
      'business planning',
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
      type: 'website',
      locale: 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${business.name} business overview` }],
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

  // Rich structured data for Google search results
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: buildTitle(business.name, requirementCount),
    description:
      business.description ||
      `Complete guide to starting a ${business.name} business with ${requirementCount} requirements and cost calculator.`,
    url: `${siteUrl}/business/${slug}`,
    image: business.image || `${siteUrl}/images/default-business.jpg`,
    author: { '@type': 'Organization', name: 'HustleCare', url: siteUrl },
    publisher: {
      '@type': 'Organization',
      name: 'HustleCare',
      url: siteUrl,
      logo: { '@type': 'ImageObject', url: `${siteUrl}/images/logo.png` },
    },
    dateModified: new Date().toISOString(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}/business/${slug}` },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${siteUrl}/businesses` },
        { '@type': 'ListItem', position: 3, name: business.name, item: `${siteUrl}/business/${slug}` },
      ],
    },
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