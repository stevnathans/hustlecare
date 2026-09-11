// lib/requirement-data.ts
//
// Server-side data-fetching for the public requirement entity pages
// (app/requirements/[slug]/page.tsx and the /requirements index). Mirrors
// the pattern already established in lib/business-data.ts: plain async
// functions wrapping Prisma calls, taking an explicit market argument.
//
// The core idea (see the SEO architecture doc, Section 2): a
// RequirementTemplate is reused across many businesses via
// BusinessRequirement, so this module does the reverse lookup — given a
// requirement, which businesses need it — plus a "related requirements"
// computation based on which other requirements share the most businesses
// with this one.

import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';

const RELATED_LIMIT = 8;

export interface RequirementBusinessSummary {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  categoryName: string | null;
  necessity: string;
}

export interface RequirementProductSummary {
  id: number;
  name: string;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  image: string | null;
  url: string | null;
  vendor: {
    id: number;
    name: string;
    slug: string;
    isVerified: boolean;
  } | null;
}

export interface RequirementFeeScheduleSummary {
  id: number;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  validityValue: number | null;
  validityUnit: string | null;
  processingTimeMinDays: number | null;
  processingTimeMaxDays: number | null;
  applyUrl: string | null;
  notes: string | null;
  issuingAuthority: string | null;
  verifiedAt: Date | null;
  county: { id: number; name: string; slug: string };
  tradeClass: { id: number; name: string } | null;
  businessCategory: { id: number; name: string } | null;
}

export interface RequirementRelatedSummary {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  type: string | null;
  overlapCount: number;
}

export interface RequirementDetail {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  descriptionUS: string | null;
  image: string | null;
  category: string;
  type: string | null;
  necessity: string;
  isCountyFeeSchedule: boolean;
  sourceName: string | null;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  businessSummaries: RequirementBusinessSummary[];
  products: RequirementProductSummary[];
  feeSchedules: RequirementFeeScheduleSummary[];
  related: RequirementRelatedSummary[];
}

/**
 * Fetches everything the public /requirements/{slug} page needs: the
 * template itself, the businesses that actively use it (only published
 * businesses, only active links — mirrors the market filtering already
 * used in lib/business-data.ts), its products, its county fee schedule
 * rows if it's a Legal county-fee requirement, and a computed "related
 * requirements" list.
 *
 * Returns null if no published, non-deprecated template with this slug
 * exists for the given market — the caller (the page component) is
 * responsible for calling notFound() in that case, and additionally for
 * checking the anti-orphan condition (see hasIndexableContent below)
 * since an orphaned template that still resolves here shouldn't render
 * as a real page either.
 */
export async function fetchRequirementBySlug(
  slug: string,
  market: MarketCode = DEFAULT_MARKET
): Promise<RequirementDetail | null> {
  const template = await prisma.requirementTemplate.findFirst({
    where: {
      slug,
      published: true,
      isDeprecated: false,
      OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
    },
    include: {
      businesses: {
        where: {
          isActive: true,
          business: { published: true },
        },
        select: {
          necessityOverride: true,
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
              category: { select: { name: true } },
            },
          },
        },
        orderBy: { business: { name: 'asc' } },
      },
      products: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          name: true,
          price: true,
          priceMin: true,
          priceMax: true,
          currency: true,
          image: true,
          url: true,
          vendor: {
            select: { id: true, name: true, slug: true, isVerified: true },
          },
        },
        orderBy: { price: 'asc' },
      },
      feeSchedules: {
        select: {
          id: true,
          price: true,
          priceMin: true,
          priceMax: true,
          validityValue: true,
          validityUnit: true,
          processingTimeMinDays: true,
          processingTimeMaxDays: true,
          applyUrl: true,
          notes: true,
          issuingAuthority: true,
          verifiedAt: true,
          county: { select: { id: true, name: true, slug: true } },
          tradeClass: { select: { id: true, name: true } },
          businessCategory: { select: { id: true, name: true } },
        },
        orderBy: { county: { name: 'asc' } },
      },
    },
  });

  if (!template || !template.slug) return null;

  const businessSummaries: RequirementBusinessSummary[] = template.businesses.map((br) => ({
    id: br.business.id,
    name: br.business.name,
    slug: br.business.slug,
    image: br.business.image,
    categoryName: br.business.category?.name ?? null,
    necessity: br.necessityOverride ?? template.necessity,
  }));

  const related = await fetchRelatedRequirements(
    template.id,
    businessSummaries.map((b) => b.id),
    market
  );

  return {
    id: template.id,
    slug: template.slug,
    name: template.name,
    description: template.description,
    descriptionUS: template.descriptionUS,
    image: template.image,
    category: template.category,
    type: template.type,
    necessity: template.necessity,
    isCountyFeeSchedule: template.isCountyFeeSchedule,
    sourceName: template.sourceName,
    sourceUrl: template.sourceUrl,
    verifiedAt: template.verifiedAt,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    businessSummaries,
    products: template.products,
    feeSchedules: template.feeSchedules,
    related,
  };
}

/**
 * "Related requirements" — computed, not curated (see the SEO
 * architecture doc, Section 4's "Can wait" list): other requirements that
 * co-occur on the most of the same businesses as this one. Needs zero
 * schema, just a groupBy over BusinessRequirement.
 */
async function fetchRelatedRequirements(
  templateId: number,
  businessIds: number[],
  market: MarketCode
): Promise<RequirementRelatedSummary[]> {
  if (businessIds.length === 0) return [];

  const overlap = await prisma.businessRequirement.groupBy({
    by: ['templateId'],
    where: {
      businessId: { in: businessIds },
      templateId: { not: templateId },
      isActive: true,
      template: {
        published: true,
        isDeprecated: false,
        OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
      },
    },
    _count: { templateId: true },
    orderBy: { _count: { templateId: 'desc' } },
    take: RELATED_LIMIT,
  });

  if (overlap.length === 0) return [];

  const relatedTemplates = await prisma.requirementTemplate.findMany({
    where: { id: { in: overlap.map((o) => o.templateId) } },
    select: { id: true, slug: true, name: true, image: true, type: true },
  });

  const overlapById = new Map(overlap.map((o) => [o.templateId, o._count.templateId]));

  return relatedTemplates
    .filter((t): t is typeof t & { slug: string } => t.slug !== null)
    .map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      image: t.image,
      type: t.type,
      overlapCount: overlapById.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.overlapCount - a.overlapCount);
}

/**
 * The anti-orphan rule from the SEO architecture doc, Section 10: a
 * requirement only earns an indexable page if it has real content behind
 * it — at least one active business link, or at least one fee-schedule
 * row (a Legal requirement can have fee data before/without a business
 * link, e.g. while the business side is still being set up).
 */
export function hasIndexableContent(requirement: Pick<RequirementDetail, 'businessSummaries' | 'feeSchedules'>): boolean {
  return requirement.businessSummaries.length > 0 || requirement.feeSchedules.length > 0;
}

/**
 * Slugs eligible for static generation and for the /requirements index —
 * published, non-deprecated, market-matched, AND passing the anti-orphan
 * rule above. Used by generateStaticParams on the entity page and by the
 * index page's listing query.
 */
export async function getIndexableRequirementSlugs(market: MarketCode = DEFAULT_MARKET): Promise<string[]> {
  const templates = await prisma.requirementTemplate.findMany({
    where: {
      published: true,
      isDeprecated: false,
      slug: { not: null },
      OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
      AND: [
        {
          OR: [
            { businesses: { some: { isActive: true, business: { published: true } } } },
            { feeSchedules: { some: {} } },
          ],
        },
      ],
    },
    select: { slug: true },
  });
  return templates
    .map((t) => t.slug)
    .filter((slug): slug is string => slug !== null);
}

export interface RequirementListItem {
  slug: string;
  name: string;
  category: string;
  type: string | null;
  image: string | null;
}

/**
 * Full listing for the /requirements index page, grouped by category in
 * the calling page. Same eligibility bar as getIndexableRequirementSlugs
 * — reimplemented here (rather than calling that function and re-querying)
 * so the index page gets name/category/image in a single round trip.
 */
export async function getIndexableRequirements(market: MarketCode = DEFAULT_MARKET): Promise<RequirementListItem[]> {
  const templates = await prisma.requirementTemplate.findMany({
    where: {
      published: true,
      isDeprecated: false,
      slug: { not: null },
      OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
      AND: [
        {
          OR: [
            { businesses: { some: { isActive: true, business: { published: true } } } },
            { feeSchedules: { some: {} } },
          ],
        },
      ],
    },
    select: { slug: true, name: true, category: true, type: true, image: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });

  return templates
    .filter((t): t is typeof t & { slug: string } => t.slug !== null)
    .map((t) => ({ slug: t.slug, name: t.name, category: t.category, type: t.type, image: t.image }));
}