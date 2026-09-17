// lib/business-data.ts
//
// Shared server-side data-fetching for business hub and requirements
// pages. fetchBusiness's products select was removed in an earlier
// revision — see that file's cost note; do not reintroduce it.
//
// QUANTITY/RECURRENCE (new): fetchBusinessWithRequirements now also
// selects defaultQuantity, quantities (per-band overrides), template
// .costRecurrence and categoryRef.defaultCostRecurrence — the same data
// lib/cost-data.ts already uses server-side. This lets the requirements
// page pass real quantity/recurrence data down to the client
// (app/businesses/[slug]/requirements/page.tsx maps it into
// initialRequirements, and hooks/useBusinessData.ts's Requirement type
// carries it from there). Without this, the client-side cost computation
// would silently diverge from the server the day real per-band
// quantities are entered — the exact class of bug this whole project has
// been fixing. Every value is 1 / ONE_TIME today, so this is inert until
// that data exists, but the plumbing is correct now rather than later.

import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';

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
            OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
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
              slug: true,
              published: true,
              categoryRef: { select: { excludedFromTotals: true, usesLegalCountyFilter: true } },
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

export async function fetchBusinessWithRequirements(slug: string, market: MarketCode = DEFAULT_MARKET) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      category: {
        select: { defaultTradeClassId: true },
      },
      requirements: {
        where: {
          isActive: true,
          template: {
            isDeprecated: false,
            OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
          },
        },
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          templateId: true,
          necessityOverride: true,
          descriptionOverride: true,
          defaultQuantity: true,
          quantities: { select: { sizeBand: true, quantity: true } },
          template: {
            select: {
              name: true,
              description: true,
              descriptionUS: true,
              category: true,
              necessity: true,
              image: true,
              slug: true,
              published: true,
              costRecurrence: true,
              categoryRef: {
                select: {
                  excludedFromTotals: true,
                  usesLegalCountyFilter: true,
                  defaultCostRecurrence: true,
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