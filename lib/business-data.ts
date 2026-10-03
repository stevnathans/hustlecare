// lib/business-data.ts
//
// Shared server-side data-fetching for business hub and requirements
// pages, extracted so both the Kenya routes (app/businesses/[slug]/...)
// and the US routes (app/us/businesses/[slug]/...) query the same way
// instead of maintaining two copies of these Prisma calls. Both accept an
// explicit `market` argument — callers should always pass one, but it
// defaults to Kenya to match the pre-market-aware behavior of the original
// inline functions this was extracted from.

import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';

// ── Hub page data (app/businesses/[slug]/page.tsx) ──────────────────────────

export async function fetchBusiness(slug: string, market: MarketCode = DEFAULT_MARKET) {
  return prisma.business.findUnique({
    where: { slug },
    include: {
      category: true,
      requirements: {
        where: {
          isActive: true,
          template: {
            isDeprecated: false,
            OR: [
              { restrictedToCountry: null },
              { restrictedToCountry: market },
            ],
          },
        },
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
              necessity: true,
              image: true,
              // slug/published — added for internal linking from the
              // requirements preview on this page out to
              // /requirements/{slug}. Only a *published* template
              // actually has a live page, so callers must gate on
              // `published` before using `slug` as a link target — see
              // the requirementSlug computation in
              // app/businesses/[slug]/page.tsx and the US equivalent.
              slug: true,
              published: true,
              // categoryRef (Stage 3 Part B) — the RequirementCategory
              // entity's behavior flags, selected right alongside
              // slug/published above so both travel through the data the
              // same way. Nullable: a template created without a
              // categoryId (e.g. a stale row the backfill script hasn't
              // touched) has no categoryRef, and callers fall back to the
              // legacy `category` string comparison in that case — see
              // isExcludedFromTotals() call sites in the page components.
              categoryRef: {
                select: {
                  excludedFromTotals: true,
                  usesLegalCountyFilter: true,
                },
              },
              // ← needed for server-side cost calculation for FAQs
              products: {
                select: { price: true },
                where: { price: { not: null } },
              },
            },
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

// ── Requirements page data (app/businesses/[slug]/requirements/page.tsx) ────

export async function fetchBusinessWithRequirements(slug: string, market: MarketCode = DEFAULT_MARKET) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      // County-fee trade-class resolution (see lib/legalFeeSchedule.ts).
      // category.defaultTradeClassId is the fallback used downstream to
      // compute effectiveTradeClassId, mirroring
      // /api/business/[slug]/route.ts so SSR and client-side re-fetches
      // resolve fee schedules identically.
      category: {
        select: { defaultTradeClassId: true },
      },
      requirements: {
        where: {
          isActive: true,
          template: {
            isDeprecated: false,
            OR: [
              { restrictedToCountry: null },
              { restrictedToCountry: market },
            ],
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          templateId: true,
          necessityOverride: true,
          descriptionOverride: true,
          template: {
            select: {
              name: true,
              description: true,
              descriptionUS: true,
              category: true,
              necessity: true,
              image: true,
              // slug/published — same internal-linking rationale as
              // fetchBusiness above. Used to build RequirementData.slug
              // for every requirement card on the checklist page.
              slug: true,
              published: true,
              // categoryRef (Stage 3 Part B, extended in Stage 4.5) — see
              // the comment in fetchBusiness above. `slug` is additionally
              // selected here (not needed on the hub page) because the
              // category-scoped checklist sub-route
              // (/businesses/{slug}/requirements/{category-slug}) needs
              // the RequirementCategory's own slug to build its URL and
              // to match an incoming category-slug param back to a
              // category name — see groupRequirementsByCategory below and
              // its callers in app/businesses/[slug]/requirements/page.tsx
              // and app/businesses/[slug]/requirements/[category]/page.tsx.
              categoryRef: {
                select: {
                  slug: true,
                  excludedFromTotals: true,
                  usesLegalCountyFilter: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return business;
}

// ── Category grouping (Stage 4.5) ───────────────────────────────────────────
//
// Groups an already-fetched requirements list (from either fetchBusiness
// or fetchBusinessWithRequirements) by RequirementTemplate.category,
// carrying along the RequirementCategory's own slug for each group so
// callers can build a /requirements/{category-slug} URL without a second
// query. Shared by:
//   - app/businesses/[slug]/requirements/page.tsx and the US equivalent,
//     to decide which categories clear the ≥3-item threshold and link to
//     their own sub-page ("View all N {Category} requirements").
//   - app/businesses/[slug]/requirements/[category]/page.tsx and the US
//     equivalent, both to build generateStaticParams (which business ×
//     category pairs clear the threshold) and to resolve the incoming
//     category-slug param back to a category name + its requirements.
//
// A category with no categoryRef yet (a template created before the
// Stage 3 backfill ran) has `slug: null` in its group — callers should
// treat that group as ineligible for a sub-page link rather than guessing
// a slug, since there's nowhere for such a link to actually resolve to.
export interface CategoryGroup<T> {
  slug: string | null;
  items: T[];
}

export function groupRequirementsByCategory<
  T extends { template: { category: string | null; categoryRef?: { slug: string } | null } }
>(requirements: T[]): Record<string, CategoryGroup<T>> {
  const grouped: Record<string, CategoryGroup<T>> = {};
  for (const req of requirements) {
    const name = req.template.category || 'Uncategorized';
    if (!grouped[name]) {
      grouped[name] = { slug: req.template.categoryRef?.slug ?? null, items: [] };
    }
    grouped[name].items.push(req);
  }
  return grouped;
}

// ── Cross-market eligibility check ──────────────────────────────────────────
//
// Whether a business has at least one active, non-deprecated requirement
// visible in the US market. Two call sites:
//
//  1. The US hub/requirements pages use this same condition (duplicated
//     inline in their own generateStaticParams) to decide whether a slug
//     should render at all — a business with zero qualifying requirements
//     has nothing genuinely US-specific to show, and rendering it anyway
//     produces an indexable near-duplicate of the Kenya page.
//  2. The Kenya hub/requirements pages call this helper directly to decide
//     whether to emit an `en-US` hreflang alternate. Kenya pages don't
//     otherwise fetch any US-scoped data, so this is a lightweight count
//     query rather than a full fetchBusiness(slug, 'US') call just to
//     check eligibility.
export async function isUSMarketEligible(businessId: number): Promise<boolean> {
  const count = await prisma.businessRequirement.count({
    where: {
      businessId,
      isActive: true,
      template: {
        isDeprecated: false,
        OR: [{ restrictedToCountry: null }, { restrictedToCountry: 'US' }],
      },
    },
  });
  return count > 0;
}