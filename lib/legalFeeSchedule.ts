// lib/legalFeeSchedule.ts
//
// Pure resolver for LegalFeeSchedule rows — no Prisma import, so it's safe
// to use both server-side (the calculator/resolve API) and client-side
// (the requirements page, which already has all a business's fee-schedule
// rows in memory and just needs to pick the right one per county/query).
//
// Resolution rule: a row is "eligible" if its tradeClassId and sizeBand
// are each either null (generic — applies to everyone) or match the
// query exactly. Among eligible rows, prefer the MOST SPECIFIC ones (both
// dimensions matched > one matched > fully generic). If all top-scoring
// rows agree on price, return an exact price; if they don't (because the
// query is under-specified, e.g. no trade class/size chosen yet), return
// a range instead of guessing.
//
// The query's tradeClassId is expected to already be the EFFECTIVE trade
// class for a business — i.e. business.tradeClassId ?? business.category
// ?.defaultTradeClassId — resolved by the caller before this function is
// invoked. This function itself only does row matching, not the
// business -> trade-class lookup.

import { LegalFeeSchedule, BusinessSizeBand } from '@/types';

export interface FeeScheduleQuery {
  tradeClassId?: number | null;
  sizeBand?: BusinessSizeBand | null;
}

export type FeeScheduleResolution =
  | { status: 'unavailable'; candidateRows: LegalFeeSchedule[] }
  | { status: 'exact'; price: number; matchedRow: LegalFeeSchedule; candidateRows: LegalFeeSchedule[] }
  | { status: 'range'; lowPrice: number; highPrice: number; candidateRows: LegalFeeSchedule[] };

export function resolveFeeSchedule(
  allSchedules: LegalFeeSchedule[],
  countyId: number,
  query: FeeScheduleQuery = {}
): FeeScheduleResolution {
  const countyRows = allSchedules.filter((r) => r.countyId === countyId);
  if (countyRows.length === 0) {
    return { status: 'unavailable', candidateRows: [] };
  }

  const eligible = countyRows.filter((row) => {
    const tradeClassOk = row.tradeClassId == null || row.tradeClassId === query.tradeClassId;
    const sizeOk = row.sizeBand == null || row.sizeBand === query.sizeBand;
    return tradeClassOk && sizeOk;
  });

  if (eligible.length === 0) {
    return { status: 'unavailable', candidateRows: countyRows };
  }

  const scored = eligible.map((row) => {
    let score = 0;
    if (row.tradeClassId != null) score += 2;
    if (row.sizeBand != null) score += 1;
    return { row, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const topMatches = scored.filter((s) => s.score === topScore).map((s) => s.row);

  const distinctPrices = new Set(topMatches.map((r) => r.price));
  if (distinctPrices.size === 1) {
    return { status: 'exact', price: topMatches[0].price, matchedRow: topMatches[0], candidateRows: countyRows };
  }

  const prices = topMatches.map((r) => r.price);
  return {
    status: 'range',
    lowPrice: Math.min(...prices),
    highPrice: Math.max(...prices),
    candidateRows: countyRows,
  };
}

/** Synthesized display name for the "vendor" of a county-issued permit — no DB row needed. */
export function countyGovernmentName(countyName: string): string {
  return `County Government of ${countyName}`;
}