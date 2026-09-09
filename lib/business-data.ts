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
            },
          },
        },
      },
    },
  });
  return business;
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