// app/requirements/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchRequirementBySlug,
  getIndexableRequirementSlugs,
  hasIndexableContent,
  isRequirementUSMarketEligible,
} from '@/lib/requirement-data';
import {
  buildPriceContent,
  getPriceSummary,
  isProductSchemaEligible,
} from '@/lib/requirement-pricing';
import { currencyCode, formatCurrency } from '@/lib/currency';
import { pickWithinLimit, TITLE_MAX } from '@/lib/seo-fit';
import RequirementPageContent from './RequirementPageContent';
import { DEFAULT_MARKET } from '@/lib/markets';

export const revalidate = 300; // regenerate at most every 5 minutes

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

function formatTypeLabel(type: string | null): string | null {
  if (!type) return null;
  return type.charAt(0) + type.slice(1).toLowerCase();
}

/** Trim to a meta-description-friendly length without cutting mid-word. */
function clip(text: string, max = 158): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const requirement = await fetchRequirementBySlug(slug, DEFAULT_MARKET);

  if (!requirement || !hasIndexableContent(requirement)) {
    return {
      title: 'Requirement Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const pageUrl = `${SITE_URL}/requirements/${slug}`;
  const typeLabel = formatTypeLabel(requirement.type);
  const name = requirement.name;
  const year = new Date().getFullYear();
  const money = (n: number) => formatCurrency(n, DEFAULT_MARKET);

  // The title promises a price, so only claim one when we can show one
  // (see getPriceSummary — null when there is no usable price data).
  const summary = getPriceSummary(requirement);
  const rangeText = summary
    ? summary.isSinglePrice
      ? money(summary.low)
      : `${money(summary.low)} – ${money(summary.high)}`
    : null;

  const title = summary
    ? pickWithinLimit(
        [
          `${name} Price in Kenya (${year}): ${rangeText} | HustleCare`,
          `${name} Price in Kenya (${year}) | HustleCare`,
          `${name} Price in Kenya | HustleCare`,
        ],
        TITLE_MAX
      )
    : `${name} Requirement in Kenya | HustleCare`;

  let description: string;
  if (summary?.source === 'county') {
    description = clip(
      `${name} price in Kenya: ${rangeText}, depending on the county. See the fee in each county and which businesses need it.`
    );
  } else if (summary) {
    description = clip(
      `${name} price in Kenya: ${rangeText}. Compare ${summary.count} ${
        summary.count === 1 ? 'option' : 'options'
      } from Kenyan vendors and see which businesses need it.`
    );
  } else {
    description =
      requirement.description ||
      `${name} explained: what it is, whether your business needs it, typical costs in Kenya, and which business types require it.`;
  }

  const ogImage = requirement.image || `${SITE_URL}/images/default-requirement.jpg`;

  // Only advertise a US alternate if this requirement actually has a live
  // US page — see isRequirementUSMarketEligible() in
  // lib/requirement-data.ts. Without this check, hreflang could point
  // Google at a slug the US route's own anti-orphan guard would 404.
  const usEligible = await isRequirementUSMarketEligible(slug);

  return {
    title,
    description,
    keywords: [
      name,
      `${name} price in Kenya`,
      `${name} price`,
      `how much is ${name} in Kenya`,
      `${name} cost in Kenya`,
      `${name} Kenya`,
      `${name} requirements`,
      ...(typeLabel ? [`${name} ${typeLabel.toLowerCase()}`] : []),
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${name} price in Kenya` }],
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
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: pageUrl,
      languages: {
        'en-KE': pageUrl,
        ...(usEligible ? { 'en-US': `${SITE_URL}/us/requirements/${slug}` } : {}),
      },
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugs = await getIndexableRequirementSlugs(DEFAULT_MARKET);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating requirement static params:', error);
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function RequirementPage({ params }: Props) {
  const { slug } = await params;
  const requirement = await fetchRequirementBySlug(slug, DEFAULT_MARKET);

  if (!requirement) notFound();

  // Anti-orphan guard — mirrors getIndexableRequirementSlugs. A template
  // that slipped through to an on-demand render (dynamicParams defaults to
  // true) but has neither business links nor fee-schedule data has nothing
  // real to show, and would otherwise be an indexable empty page.
  if (!hasIndexableContent(requirement)) notFound();

  const pageUrl = `${SITE_URL}/requirements/${slug}`;
  const businessCount = requirement.businessSummaries.length;

  const summary = getPriceSummary(requirement);
  // Same copy the visible page renders (RequirementPageContent calls the
  // same builder) — FAQ schema must match on-page text.
  const priceContent = summary ? buildPriceContent(requirement, summary, DEFAULT_MARKET) : null;
  const ogImage = requirement.image || `${SITE_URL}/images/default-requirement.jpg`;

  // ── Structured Data ───────────────────────────────────────────────────────
  //
  // DefinedTerm is the closest accurate schema.org type for a reusable
  // requirement entity — there's no "BusinessRequirement" type, and
  // forcing Permit/Product schema onto every requirement regardless of
  // its actual type would misrepresent equipment/software requirements
  // that aren't permits at all. See the SEO architecture doc, Section 11.
  //
  // Product + AggregateOffer is added ONLY for purchasable goods priced
  // from real vendor listings (see isProductSchemaEligible) — never for
  // permits/licences/county fees.
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Requirements', item: `${SITE_URL}/requirements` },
          { '@type': 'ListItem', position: 3, name: requirement.name, item: pageUrl },
        ],
      },
      {
        '@type': 'DefinedTerm',
        '@id': `${pageUrl}#term`,
        name: requirement.name,
        description: requirement.description || `${requirement.name} for businesses in Kenya.`,
        url: pageUrl,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: requirement.category,
        },
      },
      ...(summary && isProductSchemaEligible(requirement, summary)
        ? [
            {
              '@type': 'Product',
              '@id': `${pageUrl}#product`,
              name: requirement.name,
              description: requirement.description || `${requirement.name} for businesses in Kenya.`,
              image: ogImage,
              category: requirement.category,
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: currencyCode(DEFAULT_MARKET),
                lowPrice: round2(summary.low),
                highPrice: round2(summary.high),
                offerCount: summary.count,
              },
            },
          ]
        : []),
      ...(priceContent && priceContent.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${pageUrl}#faq`,
              mainEntity: priceContent.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ]
        : []),
      ...(businessCount > 0
        ? [
            {
              '@type': 'ItemList',
              '@id': `${pageUrl}#businesses`,
              name: `Businesses that need ${requirement.name}`,
              numberOfItems: businessCount,
              itemListElement: requirement.businessSummaries.map((b, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${SITE_URL}/businesses/${b.slug}`,
                name: `${b.name} Business`,
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
      <RequirementPageContent requirement={requirement} market="KE" />
    </>
  );
}