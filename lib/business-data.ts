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