// app/businesses/[slug]/requirements/[category]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { fetchBusinessWithRequirements } from '@/lib/business-data';
import { selectTemplateDescription } from '@/lib/requirement-description';
import { isExcludedFromTotals } from '@/lib/necessity';
import type { Business as BusinessData, Requirement as RequirementData } from 'hooks/useBusinessData';
import CategoryChecklistContent from '@/components/DetailsPage/CategoryChecklistContent';
import { type MarketCode } from '@/lib/markets';

export const revalidate = 300; // regenerate at most every 5 minutes
const market: MarketCode = 'KE';

// Must stay in sync with the identical constant in
// app/businesses/[slug]/requirements/page.tsx, which decides whether to
// link to this route at all — a business/category pair below this bar
// has no page here (see generateStaticParams below), and the "View all"
// link on the main requirements page never points at one either.
const CATEGORY_PAGE_THRESHOLD = 3;

interface Props {
  params: Promise<{ slug: string; category: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

/**
 * Resolves a business slug + category slug into the matching business
 * record and its requirements for that category, enforcing the ≥3-item
 * threshold. Returns null if the business doesn't exist, the category
 * slug doesn't match any RequirementCategory the business actually uses,
 * or the threshold isn't met — all three cases 404 identically, since a
 * category/business pair below the bar was never meant to have a URL at
 * all (see the anti-thin-content discipline throughout this project).
 */
async function getEligibleCategoryForBusiness(businessSlug: string, categorySlug: string) {
  const business = await fetchBusinessWithRequirements(businessSlug, market);
  if (!business) return null;

  const categoryRequirements = (business.requirements ?? []).filter(
    (r) => r.template.categoryRef?.slug === categorySlug
  );

  if (categoryRequirements.length < CATEGORY_PAGE_THRESHOLD) return null;

  const categoryName = categoryRequirements[0]?.template.category ?? null;
  if (!categoryName) return null;

  return { business, categoryRequirements, categoryName };
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, category } = await params;
  const result = await getEligibleCategoryForBusiness(slug, category);

  if (!result) {
    return {
      title: 'Requirements Not Found | HustleCare',
      robots: { index: false, follow: true },
    };
  }

  const { business, categoryRequirements, categoryName } = result;
  const count = categoryRequirements.length;
  const year = new Date().getFullYear();

  const title = `${count} ${categoryName} Requirements for a ${business.name} Business in Kenya (${year})`;
  const description = `Every ${categoryName.toLowerCase()} requirement for a ${business.name} business in Kenya, with costs and options — part of the full ${business.name} requirements checklist.`;
  const pageUrl = `${SITE_URL}/businesses/${slug}/requirements/${category}`;
  const ogImage = business.image || `${SITE_URL}/images/default-business.jpg`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1 },
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'HustleCare',
      type: 'article',
      locale: 'en_KE',
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${categoryName} requirements for a ${business.name} business` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: '@HustleCare',
      site: '@HustleCare',
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

// ── Static Params ─────────────────────────────────────────────────────────────
// Iterates published businesses × RequirementCategory rows, keeping only
// pairs that clear CATEGORY_PAGE_THRESHOLD. Reuses
// fetchBusinessWithRequirements per business (already the standard data
// path — see lib/business-data.ts) rather than a bespoke aggregate query;
// at current scale (~60 published businesses) this is a handful of extra
// queries at build time, not a concern.

export async function generateStaticParams() {
  try {
    const businesses = await prisma.business.findMany({
      where: { published: true },
      select: { slug: true },
    });

    const params: { slug: string; category: string }[] = [];

    for (const { slug } of businesses) {
      const business = await fetchBusinessWithRequirements(slug, market);
      if (!business) continue;

      const countsBySlug = new Map<string, number>();
      for (const req of business.requirements ?? []) {
        const catSlug = req.template.categoryRef?.slug;
        if (!catSlug) continue;
        countsBySlug.set(catSlug, (countsBySlug.get(catSlug) ?? 0) + 1);
      }

      for (const [catSlug, count] of countsBySlug.entries()) {
        if (count >= CATEGORY_PAGE_THRESHOLD) {
          params.push({ slug, category: catSlug });
        }
      }
    }

    return params;
  } catch (error) {
    console.error('Error generating category checklist static params:', error);
    return [];
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CategoryChecklistPage({ params }: Props) {
  const { slug, category } = await params;
  const result = await getEligibleCategoryForBusiness(slug, category);

  if (!result) notFound();

  const { business, categoryName } = result;

  const effectiveTradeClassId = business.tradeClassId ?? business.category?.defaultTradeClassId ?? null;

  const initialBusiness: BusinessData = {
    id: business.id,
    name: business.name,
    slug: business.slug,
    description: business.description,
    image: business.image,
    published: business.published,
    categoryId: business.categoryId,
    userId: business.userId,
    createdAt: business.createdAt,
    updatedAt: business.updatedAt,
    costMin: business.costMin,
    costMax: business.costMax,
    timeToLaunchMin: business.timeToLaunchMin,
    timeToLaunchMax: business.timeToLaunchMax,
    profitPotential: business.profitPotential,
    skillLevel: business.skillLevel,
    bestLocations: business.bestLocations,
    tradeClassId: business.tradeClassId,
    effectiveTradeClassId,
  };

  // Passes the FULL requirements list (not just this category) into
  // useBusinessData's initial state — CategoryChecklistContent slices out
  // the target category client-side via groupedRequirements, the same way
  // BusinessPageContent does for the full checklist page. This keeps
  // useBusinessData/useFilterState's contract identical across both pages
  // rather than inventing a category-scoped variant of the hook.
  const initialRequirements: RequirementData[] = (business.requirements ?? []).map((req) => ({
    id: req.id,
    templateId: req.templateId,
    name: req.template.name,
    description: req.descriptionOverride ?? selectTemplateDescription(req.template, market) ?? null,
    category: req.template.category ?? null,
    necessity: req.necessityOverride ?? req.template.necessity,
    image: req.template.image ?? null,
    slug: req.template.published ? req.template.slug : null,
    excludedFromTotals:
      req.template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(req.template.category ?? ''),
    usesLegalCountyFilter:
      req.template.categoryRef?.usesLegalCountyFilter ?? (req.template.category === 'Legal'),
  }));

  const pageUrl = `${SITE_URL}/businesses/${slug}/requirements/${category}`;
  const hubUrl = `${SITE_URL}/businesses/${slug}`;
  const requirementsUrl = `${hubUrl}/requirements`;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Businesses', item: `${SITE_URL}/businesses` },
          { '@type': 'ListItem', position: 3, name: business.name, item: hubUrl },
          { '@type': 'ListItem', position: 4, name: 'Requirements', item: requirementsUrl },
          { '@type': 'ListItem', position: 5, name: categoryName, item: pageUrl },
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
      <CategoryChecklistContent
        slug={slug}
        categoryName={categoryName}
        initialBusiness={initialBusiness}
        initialRequirements={initialRequirements}
        market="KE"
      />
    </>
  );
}