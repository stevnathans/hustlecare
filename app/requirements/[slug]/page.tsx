// app/requirements/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  fetchRequirementBySlug,
  getIndexableRequirementSlugs,
  hasIndexableContent,
} from '@/lib/requirement-data';
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
  const businessCount = requirement.businessSummaries.length;
  const typeLabel = formatTypeLabel(requirement.type);

  const title = `${requirement.name}${
    businessCount > 0 ? ` — Cost, Requirements & Which Businesses Need It` : ''
  } | HustleCare`;

  const description =
    requirement.description ||
    `${requirement.name} explained: what it is, whether your business needs it, typical costs in Kenya, and which business types require it.`;

  const ogImage = requirement.image || `${SITE_URL}/images/default-requirement.jpg`;

  return {
    title,
    description,
    keywords: [
      requirement.name,
      `${requirement.name} Kenya`,
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
      locale: 'en_KE',
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
    alternates: { canonical: pageUrl },
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

  // ── Structured Data ───────────────────────────────────────────────────────
  //
  // DefinedTerm is the closest accurate schema.org type for a reusable
  // requirement entity — there's no "BusinessRequirement" type, and
  // forcing Permit/Product schema onto every requirement regardless of
  // its actual type would misrepresent equipment/software requirements
  // that aren't permits at all. See the SEO architecture doc, Section 11.
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
      <RequirementPageContent requirement={requirement} />
    </>
  );
}