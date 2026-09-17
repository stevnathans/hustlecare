// lib/cost-data.ts
//
// The Prisma layer under lib/cost-engine.ts.
//
// SIZE-BAND FIX: county-fee resolution used to be baked into the cached
// getBusinessCostInputs() using only trade class, with no size band at
// all — so even a county that genuinely tiers its permit fee by business
// size (LegalFeeSchedule.sizeBand) had that variation silently discarded.
// Fee resolution now happens per-call, inside getBusinessCostBreakdown,
// using whichever sizeBand the caller requested, over the SAME cached raw
// schedule rows — correct, and still cheap (no extra DB round trip).
//
// getCostBreakdownMatrix is new: computes a full breakdown for every
// SizeBand × includeOptional combination (8 calls, all against the same
// cached inputs) so a UI can offer an instant size selector with zero
// client-side fetch — the same trick the optional-items toggle already
// uses, extended across bands. getRequirementsPageCostSummary now returns
// one of these per band instead of a single flat object.

import { unstable_cache } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';
import { isExcludedFromTotals } from '@/lib/necessity';
import {
  resolveFeeSchedule,
  resolveFeeScheduleAcrossCounties,
  type FeeScheduleResolution,
} from '@/lib/legalFeeSchedule';
import type { LegalFeeSchedule } from '@/types';
import {
  buildCostBreakdown,
  ALL_SIZE_BANDS,
  DEFAULT_SIZE_BAND,
  type CostBreakdown,
  type CostEngineOptions,
  type CostEngineProduct,
  type CostEngineRequirement,
  type CostRecurrence,
  type RequirementsPageCostSummary,
  type SizeBand,
} from '@/lib/cost-engine';

const REVALIDATE_SECONDS = 60 * 30;

export const COSTABLE_PRODUCT_WHERE = (market: MarketCode): Prisma.ProductWhereInput => ({
  status: 'ACTIVE',
  price: { not: null },
  isFeeScheduleShell: false,
  vendor: { country: market },
});

export const COSTABLE_REQUIREMENT_WHERE = (market: MarketCode): Prisma.BusinessRequirementWhereInput => ({
  isActive: true,
  template: {
    isDeprecated: false,
    OR: [{ restrictedToCountry: null }, { restrictedToCountry: market }],
  },
});

interface CountyFeeRequirementInput {
  id: number;
  name: string;
  slug: string | null;
  schedules: LegalFeeSchedule[];
}

export interface BusinessCostInputs {
  businessId: number;
  name: string;
  slug: string;
  costMin: number | null;
  costMax: number | null;
  workingCapitalMonths: number;
  effectiveTradeClassId: number | null;
  requirements: CostEngineRequirement[];
  productsByRequirementName: Record<string, CostEngineProduct[]>;
  countyFeeRequirements: CountyFeeRequirementInput[];
}

/**
 * Raw priced data for one business+market, cached. Requirements here
 * carry `feeSchedule: null` unconditionally — see the SIZE-BAND FIX note
 * above. County-fee requirements are ALSO listed separately in
 * countyFeeRequirements (with their raw, unresolved schedule rows and an
 * `id` for matching), which is what getBusinessCostBreakdown resolves
 * per-call, per-sizeBand.
 */
const getBusinessCostInputs = unstable_cache(
  async (slug: string, market: MarketCode): Promise<BusinessCostInputs | null> => {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        costMin: true,
        costMax: true,
        workingCapitalMonths: true,
        tradeClassId: true,
        category: { select: { defaultTradeClassId: true } },
        requirements: {
          where: COSTABLE_REQUIREMENT_WHERE(market),
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            templateId: true,
            necessityOverride: true,
            defaultQuantity: true,
            quantities: { select: { sizeBand: true, quantity: true } },
            template: {
              select: {
                id: true,
                name: true,
                category: true,
                necessity: true,
                isCountyFeeSchedule: true,
                costRecurrence: true,
                slug: true,
                published: true,
                categoryRef: { select: { excludedFromTotals: true, defaultCostRecurrence: true } },
                products: {
                  where: COSTABLE_PRODUCT_WHERE(market),
                  select: {
                    id: true,
                    price: true,
                    billingPeriod: true,
                    priceCheckedAt: true,
                    bulkPricing: { select: { minQty: true, price: true }, orderBy: { minQty: 'asc' } },
                  },
                  orderBy: { price: 'asc' },
                },
                feeSchedules: {
                  select: {
                    id: true,
                    templateId: true,
                    countyId: true,
                    businessCategoryId: true,
                    tradeClassId: true,
                    sizeBand: true,
                    employeeCountMax: true,
                    floorAreaSqm: true,
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
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!business) return null;

    const effectiveTradeClassId = business.tradeClassId ?? business.category?.defaultTradeClassId ?? null;

    const requirements: CostEngineRequirement[] = [];
    const productsByRequirementName: Record<string, CostEngineProduct[]> = {};
    const countyFeeRequirements: CountyFeeRequirementInput[] = [];

    for (const link of business.requirements) {
      const name = link.template.name;
      const templateSlug = link.template.published ? link.template.slug : null;

      const recurrence: CostRecurrence =
        link.template.costRecurrence ?? link.template.categoryRef?.defaultCostRecurrence ?? 'ONE_TIME';

      const quantityByBand = link.quantities.reduce<Partial<Record<SizeBand, number>>>((acc, row) => {
        acc[row.sizeBand as SizeBand] = row.quantity;
        return acc;
      }, {});

      if (link.template.isCountyFeeSchedule) {
        countyFeeRequirements.push({
          id: link.id,
          name,
          slug: templateSlug,
          schedules: link.template.feeSchedules as LegalFeeSchedule[],
        });
      }

      requirements.push({
        id: link.id,
        templateId: link.template.id,
        name,
        category: link.template.category,
        necessity: link.necessityOverride ?? link.template.necessity,
        excludedFromTotals:
          link.template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(link.template.category ?? ''),
        slug: templateSlug,
        quantity: link.defaultQuantity,
        quantityByBand,
        recurrence,
        feeSchedule: null, // resolved per-call, per-sizeBand — see getBusinessCostBreakdown
      });

      productsByRequirementName[name] = link.template.products.map((p) => ({
        id: p.id,
        price: p.price,
        billingPeriod: p.billingPeriod,
        bulkPricing: p.bulkPricing,
        priceCheckedAt: p.priceCheckedAt,
      }));
    }

    return {
      businessId: business.id,
      name: business.name,
      slug: business.slug,
      costMin: business.costMin,
      costMax: business.costMax,
      workingCapitalMonths: business.workingCapitalMonths,
      effectiveTradeClassId,
      requirements,
      productsByRequirementName,
      countyFeeRequirements,
    };
  },
  ['business-cost-inputs'],
  { revalidate: REVALIDATE_SECONDS },
);

const getAllCounties = unstable_cache(
  async () => prisma.county.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' } }),
  ['all-counties'],
  { revalidate: 60 * 60 * 24 },
);

export type BusinessCostBreakdown = CostBreakdown & {
  businessId: number;
  businessName: string;
  slug: string;
  market: MarketCode;
};

export async function getBusinessCostBreakdown(
  slug: string,
  market: MarketCode = DEFAULT_MARKET,
  options: Omit<CostEngineOptions, 'market' | 'editorialFallback'> = {},
): Promise<BusinessCostBreakdown | null> {
  const inputs = await getBusinessCostInputs(slug, market);
  if (!inputs) return null;

  const sizeBand = options.sizeBand ?? DEFAULT_SIZE_BAND;

  // Resolve county fees for THIS call's size band, over the cached raw
  // schedule rows — see the SIZE-BAND FIX note at the top of the file.
  const feeById = new Map(inputs.countyFeeRequirements.map((r) => [r.id, r]));
  const requirementsForThisCall =
    inputs.countyFeeRequirements.length === 0
      ? inputs.requirements
      : inputs.requirements.map((req) => {
          const feeReq = feeById.get(req.id);
          if (!feeReq) return req;
          const resolved = resolveFeeScheduleAcrossCounties(feeReq.schedules, {
            tradeClassId: inputs.effectiveTradeClassId,
            sizeBand,
          });
          return resolved ? { ...req, feeSchedule: { low: resolved.low, high: resolved.high } } : req;
        });

  const breakdown = buildCostBreakdown(requirementsForThisCall, inputs.productsByRequirementName, {
    workingCapitalMonths: inputs.workingCapitalMonths,
    ...options,
    sizeBand,
    market,
    editorialFallback: { min: inputs.costMin, max: inputs.costMax },
  });

  return {
    ...breakdown,
    businessId: inputs.businessId,
    businessName: inputs.name,
    slug: inputs.slug,
    market,
  };
}

export interface CostBreakdownPair {
  requiredOnly: BusinessCostBreakdown;
  withOptional: BusinessCostBreakdown;
}

export type CostBreakdownMatrix = Record<SizeBand, CostBreakdownPair>;

/**
 * A full requiredOnly/withOptional breakdown for every SizeBand, computed
 * from the same cached inputs (8 pure-function calls, no extra DB work).
 * The shared source for both /cost's size selector and the requirements
 * page's per-band SSR fallback — so the two pages can never disagree
 * about what "Large" means for a given business.
 */
export async function getCostBreakdownMatrix(
  slug: string,
  market: MarketCode = DEFAULT_MARKET,
): Promise<CostBreakdownMatrix | null> {
  const entries = await Promise.all(
    ALL_SIZE_BANDS.map(async (band) => {
      const [requiredOnly, withOptional] = await Promise.all([
        getBusinessCostBreakdown(slug, market, { sizeBand: band, includeOptional: false }),
        getBusinessCostBreakdown(slug, market, { sizeBand: band, includeOptional: true }),
      ]);
      if (!requiredOnly || !withOptional) return null;
      return [band, { requiredOnly, withOptional }] as const;
    }),
  );

  if (entries.some((e) => e === null)) return null;
  return Object.fromEntries(entries as [SizeBand, CostBreakdownPair][]) as CostBreakdownMatrix;
}

/**
 * Server-side headline cost figures for the requirements page, per size
 * band, in the exact flat shape hooks/useFilterState.ts computes
 * client-side for a given band.
 */
export async function getRequirementsPageCostSummary(
  slug: string,
  market: MarketCode = DEFAULT_MARKET,
): Promise<Record<SizeBand, RequirementsPageCostSummary> | null> {
  const matrix = await getCostBreakdownMatrix(slug, market);
  if (!matrix) return null;

  const out = {} as Record<SizeBand, RequirementsPageCostSummary>;

  for (const band of ALL_SIZE_BANDS) {
    const { requiredOnly, withOptional } = matrix[band];
    out[band] = {
      requiredSource: requiredOnly.source,
      allSource: withOptional.source,
      requiredCount: requiredOnly.coverage.totalRequirements,
      optionalCount: withOptional.coverage.totalRequirements - requiredOnly.coverage.totalRequirements,
      totalRequirements: withOptional.coverage.totalRequirements,
      unfilteredRequiredLowPrice: requiredOnly.oneTime.low,
      unfilteredRequiredMediumPrice: requiredOnly.oneTime.typical,
      unfilteredRequiredHighPrice: requiredOnly.oneTime.high,
      unfilteredLowPrice: withOptional.oneTime.low,
      unfilteredMediumPrice: withOptional.oneTime.typical,
      unfilteredHighPrice: withOptional.oneTime.high,
      unfilteredRequirementsWithProducts: withOptional.coverage.requirementsWithPricing,
      unfilteredRequiredRequirementsWithProducts: requiredOnly.coverage.requirementsWithPricing,
      unfilteredStockCount: withOptional.stockCount,
      unfilteredStockLowPrice: withOptional.stock.low,
      unfilteredStockMedianPrice: withOptional.stock.typical,
      unfilteredStockHighPrice: withOptional.stock.high,
    };
  }

  return out;
}

export interface CountyFeeTableRow {
  requirementName: string;
  requirementSlug: string | null;
  countyId: number;
  countyName: string;
  countySlug: string;
  resolution: FeeScheduleResolution;
}

/**
 * Every county's resolved price for every county-fee requirement this
 * business has, at a given size band (defaults to Medium — the /cost
 * page pins its table to this rather than matrixing it across bands,
 * since that would be 4x the table for no visible difference until real
 * quantity data exists; the headline figure is where band selection
 * earns its keep today).
 */
export async function getCountyFeeTable(
  slug: string,
  market: MarketCode = DEFAULT_MARKET,
  sizeBand: SizeBand = DEFAULT_SIZE_BAND,
): Promise<CountyFeeTableRow[]> {
  const inputs = await getBusinessCostInputs(slug, market);
  if (!inputs || inputs.countyFeeRequirements.length === 0) return [];

  const counties = await getAllCounties();
  const rows: CountyFeeTableRow[] = [];

  for (const req of inputs.countyFeeRequirements) {
    for (const county of counties) {
      const resolution = resolveFeeSchedule(req.schedules, county.id, {
        tradeClassId: inputs.effectiveTradeClassId,
        sizeBand,
      });
      if (resolution.status === 'unavailable') continue;

      rows.push({
        requirementName: req.name,
        requirementSlug: req.slug,
        countyId: county.id,
        countyName: county.name,
        countySlug: county.slug,
        resolution,
      });
    }
  }

  return rows;
}