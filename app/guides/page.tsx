// app/guides/page.tsx
import { Suspense } from 'react';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import GuidesContent from './GuidesContent';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const PAGE_URL = `${SITE_URL}/guides`;
const OG_IMAGE = `${SITE_URL}/images/business-ideas-hustlecare.jpg`;

// ── Data ──────────────────────────────────────────────────────────────────────

async function getGuideCount(): Promise<number> {
  try {
    return await prisma.howToGuide.count({ where: { isPublished: true } });
  } catch {
    return 0;
  }
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const count = await getGuideCount();
  const year  = new Date().getFullYear();

  const title = count > 0
    ? `${count} Step-by-Step Business Guides for Kenya (${year}) | HustleCare`
    : `How to Start a Business in Kenya — Step-by-Step Guides (${year}) | HustleCare`;

  const description = `Browse ${count > 0 ? count : 'detailed'} free step-by-step guides on how to start a business in Kenya. Each guide covers registration, sourcing, hiring, and getting your first customers — written specifically for Kenyan entrepreneurs.`;

  return {
    title,
    description,
    keywords: [
      'how to start a business in Kenya',
      'business startup guide Kenya',
      'step by step business guide Kenya',
      'start a business Kenya 2024',
      'business registration Kenya guide',
      'how to start a small business Kenya',
      'Kenya entrepreneur guide',
      'business ideas with steps Kenya',
      'startup checklist Kenya',
    ].join(', '),
    authors:   [{ name: 'HustleCare' }],
    creator:   'HustleCare',
    publisher: 'HustleCare',
    openGraph: {
      type:     'website',
      url:      PAGE_URL,
      siteName: 'HustleCare',
      title,
      description,
      locale:   'en_KE',
      images:   [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'How to start a business in Kenya — HustleCare Guides' }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [OG_IMAGE],
      site:        '@HustleCare',
      creator:     '@HustleCare',
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: { canonical: PAGE_URL },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function GuidesPage() {
  const count = await getGuideCount();
  const year  = new Date().getFullYear();

  const title = count > 0
    ? `${count} Step-by-Step Business Guides for Kenya (${year}) | HustleCare`
    : `How to Start a Business in Kenya — Step-by-Step Guides (${year}) | HustleCare`;

  const description = `Browse ${count > 0 ? count : 'detailed'} free step-by-step guides on how to start a business in Kenya.`;

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id':   `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',   item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: PAGE_URL },
        ],
      },
      {
        '@type':       'CollectionPage',
        '@id':         `${PAGE_URL}#page`,
        name:          title,
        description,
        url:           PAGE_URL,
        inLanguage:    'en-KE',
        breadcrumb:    { '@id': `${PAGE_URL}#breadcrumb` },
        author:        { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name:    'HustleCare',
          url:     SITE_URL,
          logo:    { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        ...(count > 0 && { numberOfItems: count }),
      },
      {
        '@type': 'FAQPage',
        '@id':   `${PAGE_URL}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name:    'How do I use HustleCare business guides?',
            acceptedAnswer: { '@type': 'Answer', text: 'Each guide breaks the business launch process into clear numbered steps. Follow them in order — from registration through to getting your first customers. Every step is specific to Kenya.' },
          },
          {
            '@type': 'Question',
            name:    'Are these guides free?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. All HustleCare step-by-step guides are completely free. We also provide free requirements checklists and startup cost calculators for each business.' },
          },
          {
            '@type': 'Question',
            name:    'How long does it take to start a business in Kenya?',
            acceptedAnswer: { '@type': 'Answer', text: 'It depends on the business. Simple micro-businesses can launch in days. Businesses requiring formal registration, premises, and licences typically take 4–12 weeks. Each guide includes an estimated timeline.' },
          },
          {
            '@type': 'Question',
            name:    'Do the guides cover legal requirements?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Each guide includes a step on registration and licensing specific to that business type in Kenya, covering BRS registration, county permits, and any sector-specific licences.' },
          },
        ],
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
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">Loading guides…</p>
            </div>
          </div>
        }
      >
        <GuidesContent />
      </Suspense>
    </>
  );
}