// app/businesses/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import HubPageContent from './HubPageContent';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchBusiness(slug: string) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      category: true,
      requirements: {
        where: { isActive: true, template: { isDeprecated: false } },
        include: {
          template: {
            select: { id: true, name: true, category: true, necessity: true, image: true },
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
      },
    },
  });
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchBusiness(slug);

  if (!business) {
    return {
      title: 'Business Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const year = new Date().getFullYear();
  const name = business.name;
  const title = `How to Start a ${name} Business in Kenya (${year}) | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in Kenya. Explore requirements, startup costs, licences, and everything you need to launch.`;

  const pageUrl = `${SITE_URL}/businesses/${slug}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

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
    alternates: { canonical: pageUrl },
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
  const business = await fetchBusiness(slug);

  if (!business) notFound();

  const year = new Date().getFullYear();
  const name = business.name;
  const pageUrl = `${SITE_URL}/businesses/${slug}`;
  const requirementCount = business.requirements.length;
  const title = `How to Start a ${name} Business in Kenya (${year}) | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in Kenya with ${requirementCount} requirements and cost estimates.`;

  // Group requirements for the preview
  const grouped = business.requirements.reduce<Record<string, typeof business.requirements>>(
    (acc, req) => {
      const cat = req.template.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(req);
      return acc;
    },
    {}
  );

  const previewRequirements = business.requirements
    .slice(0, 4)
    .map((r) => ({
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

  // ── Structured Data ───────────────────────────────────────────────────────

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_URL}/businesses` },
          { '@type': 'ListItem', position: 3, name: name, item: pageUrl },
        ],
      },
      {
        '@type': 'Article',
        '@id': `${pageUrl}#article`,
        headline: title,
        description,
        url: pageUrl,
        image: { '@type': 'ImageObject', url: business.image || `${SITE_URL}/images/default-business.jpg`, width: 1200, height: 630 },
        author: { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        datePublished: (business as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
      },
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
      />
    </>
  );
}