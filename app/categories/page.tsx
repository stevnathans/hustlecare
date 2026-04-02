// app/categories/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import CategoriesPage from './CategoriesPage';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const PAGE_URL = `${SITE_URL}/categories`;

// ── Counts (shared between metadata + structured data) ────────────────────────

async function getCounts() {
  try {
    const [categoryCount, businessCount] = await Promise.all([
      prisma.businessCategory.count(),
      prisma.business.count({ where: { published: true } }),
    ]);
    return { categoryCount, businessCount };
  } catch {
    return { categoryCount: 0, businessCount: 0 };
  }
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const { categoryCount, businessCount } = await getCounts();

  const title = `${categoryCount > 0 ? `${categoryCount} ` : ''}Business Categories in Kenya | HustleCare`;
  const description = `Browse ${categoryCount > 0 ? categoryCount : 'all'} business categories covering ${businessCount > 0 ? `${businessCount}+ ` : ''}opportunities in Kenya. Find the right industry — from food & beverage to tech, agriculture, beauty, and more.`;

  return {
    title,
    description,
    keywords: [
      'business categories Kenya',
      'types of businesses in Kenya',
      'industry categories Kenya',
      'business ideas by category Kenya',
      'profitable business sectors Kenya',
      'small business categories Kenya',
    ].join(', '),

    authors: [{ name: 'HustleCare' }],
    creator: 'HustleCare',
    publisher: 'HustleCare',

    openGraph: {
      type: 'website',
      url: PAGE_URL,
      siteName: 'HustleCare',
      title,
      description,
      locale: 'en_KE',
      images: [
        {
          url: `${SITE_URL}/images/categories-hustlecare.jpg`,
          width: 1200,
          height: 630,
          alt: `Business categories in Kenya — HustleCare`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${SITE_URL}/images/categories-hustlecare.jpg`],
      site: '@HustleCare',
      creator: '@HustleCare',
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    alternates: { canonical: PAGE_URL },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoriesServerPage() {
  const { categoryCount, businessCount } = await getCounts();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Business Categories', item: PAGE_URL },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        name: `Business Categories in Kenya | HustleCare`,
        description: `Browse ${categoryCount} business categories covering ${businessCount}+ opportunities in Kenya.`,
        url: PAGE_URL,
        inLanguage: 'en-KE',
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
        author: { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        ...(categoryCount > 0 && { numberOfItems: categoryCount }),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        }
      >
        <CategoriesPage />
      </Suspense>
    </>
  );
}