/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/requirement-data.ts
//
// Server-side data-fetching for the public requirement entity pages
// (app/requirements/[slug]/page.tsx, app/us/requirements/[slug]/page.tsx,
// and the /requirements index). Mirrors the pattern already established in
// lib/business-data.ts: plain async functions wrapping Prisma calls,
// taking an explicit market argument.
//
// The core idea (see the SEO architecture doc, Section 2): a
// RequirementTemplate is reused across many businesses via
// BusinessRequirement, so this module does the reverse lookup — given a
// requirement, which businesses need it — plus a "related requirements"
// computation based on which other requirements share the most businesses
// with this one.
//
// Stage 4 adds market-awareness beyond the simple restrictedToCountry
// filter already present since Stage 2:
//   - A US requirement page must only list businesses that actually have
//     a live /us/businesses/{slug} page — a business can use a US-visible
//     template without itself being US-market-eligible (see
//     isUSMarketEligible in lib/business-data.ts), and linking to a business
//     page that would 404 is worse than not linking at all.
//   - LegalFeeSchedule is a Kenya-only concept (county-issued permits).
//     The US requirement page never shows a county fee table — not an
//     empty one, none at all — and fee-schedule rows never make an
//     otherwise-orphaned template indexable on the US market.

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
  // Forced false when market !== 'KE' — see the module comment above.
  // County fee schedules are a Kenya-only concept regardless of what the
  // template's own flag says, so a US page never renders that UI.
  isCountyFeeSchedule: boolean;
  sourceName: string | null;
  sourceUrl: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  businessSummaries: RequirementBusinessSummary[];
  products: RequirementProductSummary[];
  // Always [] when market !== 'KE'.
  feeSchedules: RequirementFeeScheduleSummary[];
  related: RequirementRelatedSummary[];
}

/**
 * The Prisma `where` clause a business must satisfy to be linked from a
 * requirement page in the given market. Kenya is the unrestricted default
 * market — any published business qualifies. The US market additionally
 * requires the business to be US-market-eligible (the same bar
 * isUSMarketEligible in lib/business-data.ts applies to hub pages): at
 * least one active, non-deprecated, US-visible requirement, so we never
 * link out to a /us/businesses/{slug} page that would 404.
 */
function businessEligibilityWhere(market: MarketCode) {
  if (market === 'US') {
    return {
      published: true,
      requirements: {
        some: {
          isActive: true,
          template: {
            isDeprecated: false,
            OR: [{ restrictedToCountry: null }, { restrictedToCountry: 'US' as const }],
          },
        },
      },
    };
  }
  return { published: true };
}

/**
 * Fetches everything the public /requirements/{slug} (or
 * /us/requirements/{slug}) page needs: the template itself, the
 * businesses that actively use it (only published, market-eligible
 * businesses — see businessEligibilityWhere above), its products, its
 * county fee schedule rows if it's a Legal county-fee requirement AND
 * the market is Kenya, and a computed "related requirements" list.
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
  const isKenya = market === 'KE';

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
          business: businessEligibilityWhere(market),
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
      // Fee schedules are Kenya-only data (county-issued permits) — never
      // fetched for any other market. `include: false` isn't valid
      // Prisma syntax for a relation, so we conditionally include the key
      // at all rather than pass a boolean.
      ...(isKenya
        ? {
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
          }
        : {}),
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

  // `feeSchedules` only exists on `template` when isKenya (see the
  // conditional include above) — Prisma's inferred type doesn't know
  // that statically, so this is read defensively.
  const feeSchedules = isKenya ? ((template as any).feeSchedules ?? []) : [];

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
    // Forced false outside Kenya — see the RequirementDetail comment above.
    isCountyFeeSchedule: isKenya ? template.isCountyFeeSchedule : false,
    sourceName: template.sourceName,
    sourceUrl: template.sourceUrl,
    verifiedAt: template.verifiedAt,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    businessSummaries,
    products: template.products,
    feeSchedules,
    related,
  };
}

/**
 * "Related requirements" — computed, not curated (see the SEO
 * architecture doc, Section 4's "Can wait" list): other requirements that
 * co-occur on the most of the same businesses as this one. Needs zero
 * schema, just a groupBy over BusinessRequirement.
 *
 * `businessIds` is expected to already be market-eligibility-filtered
 * (fetchRequirementBySlug passes the ids from its own businessSummaries,
 * which went through businessEligibilityWhere) — related requirements are
 * therefore only computed from the same businesses that are actually
 * shown on this page for this market.
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
 * it — at least one active, market-eligible business link, or (Kenya
 * only) at least one fee-schedule row. On the US market, fee-schedule
 * rows never count toward this — see the module comment above — so a
 * template with only KE-side fee data and no US-eligible business link
 * correctly has no US page at all, rather than an empty one.
 */
export function hasIndexableContent(requirement: Pick<RequirementDetail, 'businessSummaries' | 'feeSchedules'>): boolean {
  return requirement.businessSummaries.length > 0 || requirement.feeSchedules.length > 0;
}

/**
 * Slugs eligible for static generation and for the /requirements index —
 * published, non-deprecated, market-matched, AND passing the anti-orphan
 * rule above (with the US-specific business-eligibility and no-fee-schedule-
 * credit rules baked into the query itself, mirroring hasIndexableContent).
 * Used by generateStaticParams on the entity page and by the index page's
 * listing query.
 */
export async function getIndexableRequirementSlugs(market: MarketCode = DEFAULT_MARKET): Promise<string[]> {
  const isKenya = market === 'KE';

  const templates = await prisma.requirementTemplate.findMany({
    where: {
      published: true,
      isDeprecated: false,
      slug: { not: null },
      OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
      AND: [
        {
          OR: [
            { businesses: { some: { isActive: true, business: businessEligibilityWhere(market) } } },
            // Fee-schedule rows only establish indexability on Kenya —
            // see the module comment above. On any other market this
            // branch is simply omitted from the OR.
            ...(isKenya ? [{ feeSchedules: { some: {} } }] : []),
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

/**
 * Lightweight per-slug check for whether a requirement has a genuine,
 * indexable US page — i.e. whether getIndexableRequirementSlugs('US')
 * would include it, without fetching the full list. Used by the Kenya
 * entity page's generateMetadata to decide whether to emit an en-US
 * hreflang alternate, so it never points Google at a slug the US route's
 * own anti-orphan guard would 404.
 */
export async function isRequirementUSMarketEligible(slug: string): Promise<boolean> {
  const template = await prisma.requirementTemplate.findFirst({
    where: {
      slug,
      published: true,
      isDeprecated: false,
      OR: [{ restrictedToCountry: null }, { restrictedToCountry: 'US' }],
      businesses: {
        some: { isActive: true, business: businessEligibilityWhere('US') },
      },
    },
    select: { id: true },
  });
  return template !== null;
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
  const isKenya = market === 'KE';

  const templates = await prisma.requirementTemplate.findMany({
    where: {
      published: true,
      isDeprecated: false,
      slug: { not: null },
      OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
      AND: [
        {
          OR: [
            { businesses: { some: { isActive: true, business: businessEligibilityWhere(market) } } },
            ...(isKenya ? [{ feeSchedules: { some: {} } }] : []),
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