// lib/legalFeeSchedule.ts
//
// Pure resolver for LegalFeeSchedule rows — no Prisma import, safe for
// both client and server use. A row is either fixed-price (`price` set)
// or a range (`priceMin`/`priceMax` set) — resolved accordingly. When
// the query is under-specified and multiple equally-specific rows exist
// with disagreeing prices, they're aggregated into a range too.

import { LegalFeeSchedule, BusinessSizeBand } from '@/types';

export interface FeeScheduleQuery {
  businessCategoryId?: number | null;
  sizeBand?: BusinessSizeBand | null;
  tradeClassId?: number | null;
}

export type FeeScheduleResolution =
  | { status: 'unavailable'; candidateRows: LegalFeeSchedule[] }
  | { status: 'exact'; price: number; matchedRow: LegalFeeSchedule; candidateRows: LegalFeeSchedule[] }
  | {
      status: 'range';
      lowPrice: number;
      highPrice: number;
      /** Present when the range comes from a single row's own priceMin/priceMax; absent when aggregated across multiple disagreeing rows. */
      matchedRow?: LegalFeeSchedule;
      candidateRows: LegalFeeSchedule[];
    };

type RowPriceInfo =
  | { kind: 'exact'; price: number }
  | { kind: 'range'; low: number; high: number };

function rowPriceInfo(row: LegalFeeSchedule): RowPriceInfo {
  if (row.price != null) return { kind: 'exact', price: row.price };
  return { kind: 'range', low: row.priceMin ?? 0, high: row.priceMax ?? row.priceMin ?? 0 };
}

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
    const categoryOk = row.businessCategoryId == null || row.businessCategoryId === query.businessCategoryId;
    const sizeOk = row.sizeBand == null || row.sizeBand === query.sizeBand;
    const tradeClassOk = row.tradeClassId == null || row.tradeClassId === query.tradeClassId;
    return categoryOk && sizeOk && tradeClassOk;
  });

  if (eligible.length === 0) {
    return { status: 'unavailable', candidateRows: countyRows };
  }

  const scored = eligible.map((row) => {
    let score = 0;
    if (row.tradeClassId != null) score += 4;
    if (row.businessCategoryId != null) score += 2;
    if (row.sizeBand != null) score += 1;
    return { row, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const topScore = scored[0].score;
  const topMatches = scored.filter((s) => s.score === topScore).map((s) => s.row);

  // Single most-specific row: resolve directly from its own pricing mode.
  if (topMatches.length === 1) {
    const row = topMatches[0];
    const info = rowPriceInfo(row);
    if (info.kind === 'exact') {
      return { status: 'exact', price: info.price, matchedRow: row, candidateRows: countyRows };
    }
    return { status: 'range', lowPrice: info.low, highPrice: info.high, matchedRow: row, candidateRows: countyRows };
  }

  // Multiple equally-specific rows (under-specified query) — aggregate.
  const infos = topMatches.map(rowPriceInfo);
  const allExactSamePrice =
    infos.every((i) => i.kind === 'exact') &&
    new Set(infos.map((i) => (i as { kind: 'exact'; price: number }).price)).size === 1;

  if (allExactSamePrice) {
    const price = (infos[0] as { kind: 'exact'; price: number }).price;
    return { status: 'exact', price, matchedRow: topMatches[0], candidateRows: countyRows };
  }

  const lows = infos.map((i) => (i.kind === 'exact' ? i.price : i.low));
  const highs = infos.map((i) => (i.kind === 'exact' ? i.price : i.high));
  return {
    status: 'range',
    lowPrice: Math.min(...lows),
    highPrice: Math.max(...highs),
    candidateRows: countyRows,
  };
}

/**
 * Aggregate a fee schedule across EVERY county present in `allSchedules`,
 * for the "no county selected yet" default. Runs resolveFeeSchedule() per
 * distinct county and takes the min/max of whatever resolves — this is
 * the one true source for that aggregate, used identically by:
 *   - lib/cost-data.ts, server-side, for the hub page, the cost API, the
 *     business cards and the requirements page's SSR fallback
 *   - BusinessPageContent.tsx, client-side, once the person's browser has
 *     fetched the same raw fee-schedule rows via
 *     /api/business/[slug]/products
 * Both call sites reusing this function (rather than each aggregating
 * independently) is what keeps the SSR figure and the post-hydration
 * figure from ever disagreeing.
 *
 * Returns null when no county has resolvable data at all — a genuinely
 * unpriced requirement, which callers should treat the same as "no
 * products" rather than inventing a number.
 */
export interface FeeScheduleCountyRange {
  low: number;
  high: number;
  /** How many counties actually had a resolvable price — for a coverage note. */
  countiesWithData: number;
}

export function resolveFeeScheduleAcrossCounties(
  allSchedules: LegalFeeSchedule[],
  query: FeeScheduleQuery = {}
): FeeScheduleCountyRange | null {
  const countyIds = Array.from(new Set(allSchedules.map((r) => r.countyId)));
  if (countyIds.length === 0) return null;

  let low = Infinity;
  let high = -Infinity;
  let countiesWithData = 0;

  for (const countyId of countyIds) {
    const resolution = resolveFeeSchedule(allSchedules, countyId, query);
    if (resolution.status === 'unavailable') continue;

    countiesWithData += 1;
    if (resolution.status === 'exact') {
      low = Math.min(low, resolution.price);
      high = Math.max(high, resolution.price);
    } else {
      low = Math.min(low, resolution.lowPrice);
      high = Math.max(high, resolution.highPrice);
    }
  }

  if (countiesWithData === 0) return null;
  return { low, high, countiesWithData };
}

/** Flatten a single-county FeeScheduleResolution to a plain {low, high} range, or null when unavailable. */
export function feeResolutionToRange(
  resolution: FeeScheduleResolution
): { low: number; high: number } | null {
  if (resolution.status === 'exact') return { low: resolution.price, high: resolution.price };
  if (resolution.status === 'range') return { low: resolution.lowPrice, high: resolution.highPrice };
  return null;
}

/** Synthesized display name for the "vendor" of a county-issued permit — no DB row needed. */
export function countyGovernmentName(countyName: string): string {
  return `County Government of ${countyName}`;
}