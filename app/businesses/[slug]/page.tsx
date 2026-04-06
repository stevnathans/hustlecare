// app/businesses/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import HubPageContent from './HubPageContent';
import RelatedBusinesses from './RelatedBusinesses';

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatKES(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDays(days: number) {
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/** Build auto-generated FAQs from business data. */
function buildAutoFaqs(
  name: string,
  costMin: number | null,
  costMax: number | null,
  timeMin: number | null,
  timeMax: number | null,
  profitPotential: string | null,
  skillLevel: string | null,
  requirementCount: number,
  bestLocations: string[],
): AutoFaq[] {
  const faqs: AutoFaq[] = [];

  if (costMin && costMax) {
    faqs.push({
      question: `How much does it cost to start a ${name} business in Kenya?`,
      answer: `Starting a ${name} business in Kenya costs between ${formatKES(costMin)} and ${formatKES(costMax)} depending on your scale and location. This covers the key requirements such as equipment, licences, and initial operating expenses.`,
    });
  }

  if (timeMin && timeMax) {
    faqs.push({
      question: `How long does it take to launch a ${name} business in Kenya?`,
      answer: `You can expect to launch your ${name} business within ${formatDays(timeMin)} to ${formatDays(timeMax)}. This includes registration, sourcing requirements, and getting your first customers.`,
    });
  }

  if (requirementCount > 0) {
    faqs.push({
      question: `What are the requirements to start a ${name} business in Kenya?`,
      answer: `A ${name} business in Kenya has ${requirementCount} requirements covering documents, equipment, licences, and operational needs. Some are mandatory while others are optional depending on your business scale.`,
    });
  }

  if (profitPotential) {
    const label = profitPotential.replace(/_/g, ' ');
    faqs.push({
      question: `Is a ${name} business profitable in Kenya?`,
      answer: `A ${name} business has ${label} profit potential in Kenya. Profitability depends on your location, scale of operation, and how well you manage costs and customer acquisition.`,
    });
  }

  if (skillLevel) {
    faqs.push({
      question: `Do I need special skills to start a ${name} business?`,
      answer: `The skill level required for a ${name} business is ${skillLevel}. ${
        skillLevel === 'low'
          ? 'Most people can start with basic training and learn on the job.'
          : skillLevel === 'moderate'
          ? 'Some prior experience or short training will give you a strong advantage.'
          : 'Significant experience or professional training is recommended before starting.'
      }`,
    });
  }

  if (bestLocations.length > 0) {
    const locationList = bestLocations.join(', ');
    faqs.push({
      question: `Where is the best place to start a ${name} business in Kenya?`,
      answer: `The best locations for a ${name} business in Kenya include ${locationList}. These areas offer strong customer demand, good infrastructure, or proximity to key suppliers.`,
    });
  }

  return faqs;
}

interface AutoFaq {
  question: string;
  answer: string;
}

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
      faqs: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' },
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
  const title = `${name} Business in Kenya [${year}] - How to Start, Requirements, and Costs | HustleCare`;
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
  const title = `${name} Business in Kenya [${year}] - How to Start, Requirements, and Costs | HustleCare`;
  const description =
    business.description ||
    `Complete guide to starting a ${name} business in Kenya with ${requirementCount} requirements and cost estimates.`;

  // ── Requirement grouping ──────────────────────────────────────────────────

  const grouped = business.requirements.reduce<Record<string, typeof business.requirements>>(
    (acc, req) => {
      const cat = req.template.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(req);
      return acc;
    },
    {}
  );

  const previewRequirements = business.requirements.slice(0, 4).map((r) => ({
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

  // ── FAQs: merge DB overrides on top of auto-generated ────────────────────

  const autoFaqs = buildAutoFaqs(
    name,
    business.costMin,
    business.costMax,
    business.timeToLaunchMin,
    business.timeToLaunchMax,
    business.profitPotential,
    business.skillLevel,
    requirementCount,
    business.bestLocations,
  );

  // DB FAQs completely replace auto ones when present
  const dbFaqs = business.faqs.map((f) => ({ question: f.question, answer: f.answer }));
  const finalFaqs = dbFaqs.length > 0 ? dbFaqs : autoFaqs;

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
        image: {
          '@type': 'ImageObject',
          url: business.image || `${SITE_URL}/images/default-business.jpg`,
          width: 1200,
          height: 630,
        },
        author: { '@type': 'Organization', name: 'HustleCare', url: SITE_URL },
        publisher: {
          '@type': 'Organization',
          name: 'HustleCare',
          url: SITE_URL,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/logo.png` },
        },
        datePublished:
          (business as { createdAt?: Date }).createdAt?.toISOString() ??
          new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        breadcrumb: { '@id': `${pageUrl}#breadcrumb` },
        inLanguage: 'en-KE',
      },
      // FAQPage schema — only emit when we have FAQs
      ...(finalFaqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: finalFaqs.map((faq) => ({
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

        timeToLaunchMin={business.timeToLaunchMin}
        timeToLaunchMax={business.timeToLaunchMax}
        profitPotential={business.profitPotential}
        skillLevel={business.skillLevel}
        bestLocations={business.bestLocations}
        faqs={finalFaqs}
      />

      {business.category && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <RelatedBusinesses
            categoryId={business.category.id}
            currentSlug={slug}
            categoryName={business.category.name}
          />
        </div>
      )}
    </>
  );
}