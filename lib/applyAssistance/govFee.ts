// lib/applyAssistance/govFee.ts
//
// ESTIMATED government fee for a county-issued requirement, using the same
// resolver (lib/legalFeeSchedule.ts) as the rest of the site, so the figure
// here can never disagree with the requirements page. Always shown to the
// customer as an estimate — the fee schedules are still being verified.
//
// Business size is pinned to MEDIUM, matching the cost page for now.

import { prisma } from '@/lib/prisma';
import { resolveFeeSchedule, feeResolutionToRange } from '@/lib/legalFeeSchedule';
import type { LegalFeeSchedule, BusinessSizeBand } from '@/types';

export interface GovFeeEstimate {
  low: number;
  high: number;
}

/** { [countyId]: estimate } for every county that has a usable price. Empty when none. */
export async function estimateGovFeeByCounty(opts: {
  templateId: number | null;
  businessId?: number | null;
}): Promise<Record<number, GovFeeEstimate>> {
  if (!opts.templateId) return {};

  const template = await prisma.requirementTemplate.findUnique({
    where: { id: opts.templateId },
    select: { isCountyFeeSchedule: true },
  });
  if (!template?.isCountyFeeSchedule) return {};

  const rows = await prisma.legalFeeSchedule.findMany({ where: { templateId: opts.templateId } });
  if (rows.length === 0) return {};

  let businessCategoryId: number | null = null;
  let tradeClassId: number | null = null;
  if (opts.businessId) {
    const business = await prisma.business.findUnique({
      where: { id: opts.businessId },
      select: { categoryId: true, tradeClassId: true, category: { select: { defaultTradeClassId: true } } },
    });
    businessCategoryId = business?.categoryId ?? null;
    tradeClassId = business?.tradeClassId ?? business?.category?.defaultTradeClassId ?? null;
  }

  // The resolver's row type lives in @/types; the Prisma rows have the same fields.
  const schedules = rows as unknown as LegalFeeSchedule[];
  const out: Record<number, GovFeeEstimate> = {};

  for (const countyId of new Set(rows.map((r) => r.countyId))) {
    const range = feeResolutionToRange(
      resolveFeeSchedule(schedules, countyId, {
        businessCategoryId,
        tradeClassId,
        sizeBand: 'MEDIUM' as unknown as BusinessSizeBand,
      }),
    );
    if (range) out[countyId] = range;
  }
  return out;
}