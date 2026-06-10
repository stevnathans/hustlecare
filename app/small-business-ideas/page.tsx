// app/small-business-ideas/page.tsx
import Link from 'next/link';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import SmallBusinessIdeasContent from './SmallBusinessIdeasContent';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const PAGE_URL = `${SITE_URL}/small-business-ideas`;
const OG_IMAGE = `${SITE_URL}/images/small-business-ideas-kenya.jpg`;
const YEAR = new Date().getFullYear();

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getLatestBusinesses() {
  try {
    return await prisma.business.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        category: { select: { name: true } },
      },
    });
  } catch {
    return [];
  }
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const businesses = await getLatestBusinesses();
  const count = businesses.length;

  const title = `${count > 0 ? count : '20'} Profitable Small Business Ideas in Kenya [${YEAR}] — Costs & Requirements | HustleCare`;
  const description =
    `Discover the best small business ideas to start in Kenya in ${YEAR}. Each idea includes startup costs in KES, licensing requirements, time-to-launch estimates, skill level, and location guidance — everything you need to launch with confidence.`;

  return {
    title,
    description,
    keywords: [
      `small business ideas in Kenya ${YEAR}`,
      'profitable business ideas Kenya',
      'business ideas to start in Kenya',
      'small business Kenya startup costs',
      'best businesses to start in Kenya',
      'Kenya entrepreneurship ideas',
      'business ideas Nairobi',
      'how to start a business Kenya',
      'low capital business ideas Kenya',
      'online business ideas Kenya',
      'business ideas with low investment Kenya',
      'side hustle ideas Kenya',
    ].join(', '),
    authors: [{ name: 'HustleCare', url: SITE_URL }],
    creator: 'HustleCare',
    publisher: 'HustleCare',
    openGraph: {
      type: 'article',
      url: PAGE_URL,
      siteName: 'HustleCare',
      title,
      description,
      locale: 'en_KE',
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `Small business ideas in Kenya ${YEAR} — HustleCare`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE],
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
        'max-video-preview': -1,
      },
    },
    alternates: {
      canonical: PAGE_URL,
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// ── Structured Data ───────────────────────────────────────────────────────────

function buildStructuredData(
  businesses: Awaited<ReturnType<typeof getLatestBusinesses>>,
) {
  const count = businesses.length;
  const title = `${count > 0 ? count : '20'} Profitable Small Business Ideas in Kenya [${YEAR}] — Costs & Requirements | HustleCare`;
  const description = `Discover the best small business ideas to start in Kenya in ${YEAR}. Each idea includes startup costs in KES, licensing requirements, time-to-launch, and location guidance.`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // ── BreadcrumbList ──
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Small Business Ideas in Kenya',
            item: PAGE_URL,
          },
        ],
      },

      // ── CollectionPage ──
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        name: title,
        description,
        url: PAGE_URL,
        inLanguage: 'en-KE',
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
        author: { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/images/logo.png`,
          },
        },
        dateModified: new Date().toISOString(),
        ...(count > 0 && { numberOfItems: count }),
        // ItemList of business articles for rich results
        mainEntity: {
          '@type': 'ItemList',
          name: `Small Business Ideas in Kenya ${YEAR}`,
          numberOfItems: count,
          itemListElement: businesses.map((b, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: b.name,
            url: `${SITE_URL}/businesses/${b.slug}`,
            description:
              b.description ||
              `Complete guide to starting a ${b.name} business in Kenya — requirements, costs, and more.`,
          })),
        },
      },

      // ── FAQPage ──
      {
        '@type': 'FAQPage',
        '@id': `${PAGE_URL}#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: `What are the best small business ideas to start in Kenya in ${YEAR}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `The best small business ideas in Kenya for ${YEAR} include M-Pesa agencies, cereals and grocery shops, poultry farming, salon and barbershops, online retail, boda boda logistics, and food delivery services. Each of these has strong local demand, relatively low startup costs, and a clear path to profitability.`,
            },
          },
          {
            '@type': 'Question',
            name: 'How much money do I need to start a small business in Kenya?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Starting capital in Kenya varies widely by business type. Micro-businesses such as phone repair or a food kiosk can start with KES 10,000–50,000. Mid-size ventures like a salon, mini supermarket, or hardware shop typically need KES 100,000–500,000. Each listing on HustleCare shows a verified cost range so you can plan your budget accurately.',
            },
          },
          {
            '@type': 'Question',
            name: 'What licences do I need to start a business in Kenya?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Most Kenyan businesses require a Business Name or Company registration with the Business Registration Service (BRS), a Single Business Permit (SBP) from your county, and a KRA PIN for tax purposes. Sector-specific licences such as KEBS, NEMA, NTSA, or PPB may also apply depending on your industry. HustleCare lists all required documents for each business idea.',
            },
          },
          {
            '@type': 'Question',
            name: 'How long does it take to register a business in Kenya?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Business name registration through eCitizen takes 1–3 business days and costs KES 950 for a sole proprietorship. Company incorporation takes 3–7 days. County business permits are typically issued within 1–5 days once all documents are submitted. The entire process from zero to trading can take as little as one week for simple businesses.',
            },
          },
          {
            '@type': 'Question',
            name: 'Which small businesses are most profitable in Kenya with low capital?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'High-return, low-capital businesses in Kenya include M-Pesa agencies (KES 50,000–100,000 float), mitumba (second-hand clothing) retail, fresh produce hawking, social media management, freelance writing, and mobile phone repair. These can generate strong margins relative to the initial investment, especially in high-foot-traffic urban areas.',
            },
          },
          {
            '@type': 'Question',
            name: 'Where is the best location to start a small business in Kenya?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret are the top cities for most businesses due to population density and purchasing power. However, rural county headquarters like Thika, Nyeri, and Kitale offer lower rents and strong local demand for agriculture-related businesses. HustleCare lists the best locations for each specific business idea.',
            },
          },
        ],
      },
    ],
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SmallBusinessIdeasPage() {
  const businesses = await getLatestBusinesses();
  const structuredData = buildStructuredData(businesses);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Hero — server-rendered for SEO */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-500 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover"
          aria-hidden="true"
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-xs text-emerald-200 flex-wrap">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li aria-hidden="true" className="text-emerald-400">/</li>
              <li>
                <span className="text-white font-medium">Small Business Ideas in Kenya</span>
              </li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 border border-white/20 rounded-full text-xs text-emerald-100 font-medium mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
              Updated {new Date().toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight mb-5 tracking-tight">
              Small Business Ideas in Kenya ({YEAR})
            </h1>

            <p className="text-lg text-emerald-100 leading-relaxed max-w-2xl">
              {businesses.length > 0 ? businesses.length : '20'} verified business ideas — each with startup costs in KES, full requirements checklists, time-to-launch estimates, and location guidance.
            </p>
          </div>
        </div>
      </header>

      {/* Client content */}
      <Suspense
        fallback={
          <div className="min-h-[60vh] bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500">Loading business ideas…</p>
            </div>
          </div>
        }
      >
        <SmallBusinessIdeasContent />
      </Suspense>
    </>
  );
}