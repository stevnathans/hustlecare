// app/us/requirements/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchRequirementBySlug,
  getIndexableRequirementSlugs,
  hasIndexableContent,
} from '@/lib/requirement-data';
import RequirementPageContent from '../../../requirements/[slug]/RequirementPageContent';

export const revalidate = 300; // regenerate at most every 5 minutes

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

function formatTypeLabel(type: string | null): string | null {
  if (!type) return null;
  return type.charAt(0) + type.slice(1).toLowerCase();
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const requirement = await fetchRequirementBySlug(slug, 'US');

  if (!requirement || !hasIndexableContent(requirement)) {
    return {
      title: 'Requirement Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const pageUrl = `${SITE_URL}/us/requirements/${slug}`;
  const businessCount = requirement.businessSummaries.length;
  const typeLabel = formatTypeLabel(requirement.type);

  const title = `${requirement.name}${
    businessCount > 0 ? ` — Cost, Requirements & Which Businesses Need It` : ''
  } | HustleCare`;

  const description =
    requirement.descriptionUS ||
    requirement.description ||
    `${requirement.name} explained: what it is, whether your business needs it, typical costs in the US, and which business types require it.`;

  const ogImage = requirement.image || `${SITE_URL}/images/default-requirement.jpg`;

  return {
    title,
    description,
    keywords: [
      requirement.name,
      `${requirement.name} US`,
      `${requirement.name} cost`,
      `${requirement.name} requirements`,
      ...(typeLabel ? [`${requirement.name} ${typeLabel.toLowerCase()}`] : []),
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
      images: [{ url: ogImage, width: 1200, height: 630, alt: requirement.name }],
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
      // The Kenya page for this slug is guaranteed to exist — Kenya is
      // the unrestricted default market and isn't gated by the same
      // business-eligibility bar the US side is — so no eligibility
      // check is needed in this direction. Same convention already used
      // by the US business hub/requirements pages.
      languages: {
        'en-US': pageUrl,
        'en-KE': `${SITE_URL}/requirements/${slug}`,
      },
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const slugs = await getIndexableRequirementSlugs('US');
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error('Error generating US requirement static params:', error);
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function USRequirementPage({ params }: Props) {
  const { slug } = await params;
  const requirement = await fetchRequirementBySlug(slug, 'US');

  if (!requirement) notFound();

  // Anti-orphan guard — mirrors getIndexableRequirementSlugs('US'). A
  // template that slipped through to an on-demand render (dynamicParams
  // defaults to true) but has no US-eligible business link has nothing
  // real to show on this market — fee-schedule rows never count here,
  // since LegalFeeSchedule is Kenya-only (see lib/requirement-data.ts).
  if (!hasIndexableContent(requirement)) notFound();

  const pageUrl = `${SITE_URL}/us/requirements/${slug}`;
  const businessCount = requirement.businessSummaries.length;

  // ── Structured Data ───────────────────────────────────────────────────────
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/us` },
          { '@type': 'ListItem', position: 2, name: 'Requirements', item: `${SITE_URL}/us/requirements` },
          { '@type': 'ListItem', position: 3, name: requirement.name, item: pageUrl },
        ],
      },
      {
        '@type': 'DefinedTerm',
        '@id': `${pageUrl}#term`,
        name: requirement.name,
        description: requirement.descriptionUS || requirement.description || `${requirement.name} for businesses in the US.`,
        url: pageUrl,
        inDefinedTermSet: {
          '@type': 'DefinedTermSet',
          name: requirement.category,
        },
      },
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
                url: `${SITE_URL}/us/businesses/${b.slug}`,
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
      <RequirementPageContent requirement={requirement} market="US" />
    </>
  );
}