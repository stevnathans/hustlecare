// app/businesses/[slug]/how-to-start/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import HowToStartContent from './HowToStartContent';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// ── Data Fetching ─────────────────────────────────────────────────────────────

async function fetchGuideData(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug, published: true },
    // Switch from select to include — mixing select+include on nested
    // relations causes the nested include to be silently ignored
    include: {
      category: { select: { name: true } },
      howToGuide: {
        include: {
          steps:      { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
          sections:   { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
          faqs:       { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
          references: { orderBy: { refNumber: 'asc' } },
        },
      },
    },
  });

  return business;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const business = await fetchGuideData(slug);

  if (!business || !business.howToGuide?.isPublished) {
    return {
      title: 'Guide Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const { name, howToGuide: guide } = business;
  const year = new Date().getFullYear();

  const title =
  guide.metaTitle ||
  guide.title ||
  `How to Start a ${name} Business in Kenya (${year}) — Step-by-Step Guide | HustleCare`;

  const description =
    guide.metaDescription ||
    `A complete ${guide.steps.length}-step guide to starting a ${name} business in Kenya. Learn what to do, what to buy, and how to get your first customers.`;

  const pageUrl = `${SITE_URL}/businesses/${slug}/how-to-start`;
  const ogImage = guide.imageUrl || business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    keywords:
      guide.keywords.length > 0
        ? guide.keywords.join(', ')
        : [
            `how to start a ${name} business in Kenya`,
            `${name} business guide`,
            `${name} step by step Kenya`,
            `start ${name} business Kenya`,
            `${name} business tips Kenya`,
          ].join(', '),
    authors:   [{ name: 'HustleCare' }],
    creator:   'HustleCare',
    publisher: 'HustleCare',
    openGraph: {
      title,
      description,
      url:      pageUrl,
      siteName: 'HustleCare',
      type:     'article',
      locale:   'en_KE',
      images:   [{ url: ogImage, width: 1200, height: 630, alt: `How to start a ${name} business` }],
    },
    twitter: {
      card:    'summary_large_image',
      title,
      description,
      images:  [ogImage],
      creator: '@HustleCare',
      site:    '@HustleCare',
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:  true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
    alternates: { canonical: pageUrl },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    // Only pre-render slugs that actually have a published guide
    const guides = await prisma.howToGuide.findMany({
      where: { isPublished: true },
      include: { business: { select: { slug: true } } },
    });
    return guides.map((g) => ({ slug: g.business.slug }));
  } catch {
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function HowToStartPage({ params }: Props) {
  const { slug } = await params;
  const business = await fetchGuideData(slug);

  if (!business || !business.howToGuide?.isPublished) notFound();

  const { name, howToGuide: guide, category } = business;
  const pageUrl  = `${SITE_URL}/businesses/${slug}/how-to-start`;
  const hubUrl   = `${SITE_URL}/businesses/${slug}`;
  const ogImage  = business.image || `${SITE_URL}/images/default-business.jpg`;
  const year     = new Date().getFullYear();

  const title =
    guide.metaTitle ||
    `How to Start a ${name} Business in Kenya (${year}) — Step-by-Step Guide | HustleCare`;

  const description =
    guide.metaDescription ||
    `A complete ${guide.steps.length}-step guide to starting a ${name} business in Kenya.`;

  // ── JSON-LD Structured Data ───────────────────────────────────────────────
  //
  // Three schemas work together here:
  //   1. HowTo  — unlocks the step-by-step rich result in Google Search
  //   2. FAQPage — unlocks accordion rich results for the FAQ section
  //   3. Article + BreadcrumbList — editorial signals and site structure
  //
  // All emitted server-side so crawlers see them in raw HTML.

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      
      // 1. BreadcrumbList
{
  '@type': 'BreadcrumbList',
  '@id': `${pageUrl}#breadcrumb`,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: SITE_URL,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Businesses',
      item: `${SITE_URL}/businesses`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: name,
      item: hubUrl,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'How to Start',
      item: pageUrl,
    },
  ],
},

      // 2. Article
      {
        '@type': 'Article',
        '@id':   `${pageUrl}#article`,
        headline:    title,
        description,
        url:         pageUrl,
        image: {
          '@type': 'ImageObject',
          url:    ogImage,
          width:  1200,
          height: 630,
        },
        author: {
          '@type': 'Organization',
          name:    'HustleCare',
          url:     SITE_URL,
        },
        publisher: {
          '@type': 'Organization',
          name:    'HustleCare',
          url:     SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        datePublished: guide.publishedAt?.toISOString() ?? business.createdAt.toISOString(),
        dateModified:  business.updatedAt.toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb:       { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
        keywords: (guide.keywords.length > 0 ? guide.keywords : [`how to start a ${name} business`]).join(', '),
      },

      // 3. HowTo — the main money schema for this page
      //    Google uses this for the rich step-by-step carousel in Search.
      ...(guide.steps.length > 0
        ? [{
            '@type':       'HowTo',
            '@id':         `${pageUrl}#howto`,
            name:          `How to Start a ${name} Business in Kenya`,
            description:   guide.intro || description,
            image: {
              '@type': 'ImageObject',
              url:    ogImage,
              width:  1200,
              height: 630,
            },
            inLanguage:  'en-KE',
            totalTime:   'P30D', // rough estimate; refine if timeToLaunch data is available
            supply: [],          // physical supplies — left empty; requirements page covers this
            tool:   [],
            step: guide.steps.map((step, i) => ({
              '@type':    'HowToStep',
              position:   i + 1,
              name:       step.title,
              text:       step.description,
              url:        `${pageUrl}#step-${i + 1}`,
              ...(step.imageUrl
                ? { image: { '@type': 'ImageObject', url: step.imageUrl } }
                : {}),
            })),
          }]
        : []),

      // 4. FAQPage
      ...(guide.faqs.length > 0
        ? [{
            '@type': 'FAQPage',
            '@id':   `${pageUrl}#faq`,
            mainEntity: guide.faqs.map((faq) => ({
              '@type': 'Question',
              name:    faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text:    faq.answer,
              },
            })),
          }]
        : []),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HowToStartContent
        slug={slug}
        name={name}
        category={category?.name}
        image={guide.imageUrl || business.image}
        guide={{
          intro:      guide.intro,
          steps:      guide.steps,
          sections:   guide.sections,
          faqs:       guide.faqs,
          references: guide.references,
        }}
      />
    </>
  );
}