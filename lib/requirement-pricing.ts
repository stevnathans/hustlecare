// lib/requirement-pricing.ts
//
// Turns a RequirementDetail into the price copy shown on the public
// requirement page: a price range, a descriptive paragraph, and the
// price FAQs. Used by BOTH the page (metadata + JSON-LD) and the
// content component (visible text) so the two can never disagree —
// FAQ schema must match what is actually visible on the page.
//
// Price source, in priority order:
//   1. County fee schedules — for county-issued legal requirements
//      (isCountyFeeSchedule). Range runs from the cheapest county to the
//      most expensive county. Kenya only (feeSchedules is [] elsewhere).
//   2. Recommended products (already filtered to this market's vendors by
//      fetchRequirementBySlug).
// Returns null when neither has a usable price, so callers render no
// price section rather than inventing one.

import type { RequirementDetail } from '@/lib/requirement-data';
import { currencyCode, formatCurrency } from '@/lib/currency';
import { marketCountryPhrase, type MarketCode } from '@/lib/markets';

export interface PriceExtreme {
  label: string;
  sub: string | null;
  price: number;
}

export interface PriceSummary {
  source: 'county' | 'products';
  low: number;
  high: number;
  /** Median of the per-item midpoints (counties or products). */
  median: number;
  /** Number of counties (county) or priced products (products). */
  count: number;
  vendorCount: number;
  /** Up to 3 vendor names, cheapest first (products only). */
  vendorNames: string[];
  lowest: PriceExtreme;
  highest: PriceExtreme;
  /** County only: some counties charge different rates by trade class / size. */
  hasTiers: boolean;
  /** True when low === high, so we say "is" rather than "ranges between". */
  isSinglePrice: boolean;
}

export interface PriceFaq {
  question: string;
  answer: string;
}

export interface PriceContent {
  heading: string;
  paragraphs: string[];
  faqs: PriceFaq[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const hasValue = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n) && n > 0;

function rangeOf(row: {
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
}): { low: number; high: number } | null {
  if (hasValue(row.price)) return { low: row.price, high: row.price };
  if (hasValue(row.priceMin) && hasValue(row.priceMax)) {
    return { low: Math.min(row.priceMin, row.priceMax), high: Math.max(row.priceMin, row.priceMax) };
  }
  if (hasValue(row.priceMin)) return { low: row.priceMin, high: row.priceMin };
  return null;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function countyLabel(name: string): string {
  return /\b(county|city)\b/i.test(name) ? name : `${name} County`;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/** Requirement types that are permits/paperwork, not purchasable goods. */
const NON_PRODUCT_TYPES = new Set(['PERMIT', 'LICENCE', 'REGISTRATION', 'CERTIFICATE', 'DOCUMENT', 'SERVICE']);

/** Whether Product/AggregateOffer schema is an honest description of this requirement. */
export function isProductSchemaEligible(requirement: RequirementDetail, summary: PriceSummary | null): boolean {
  return (
    summary?.source === 'products' &&
    !requirement.isCountyFeeSchedule &&
    !(requirement.type && NON_PRODUCT_TYPES.has(requirement.type))
  );
}

// ── Summary ───────────────────────────────────────────────────────────────────

export function getPriceSummary(requirement: RequirementDetail): PriceSummary | null {
  // 1. County fee schedules
  if (requirement.isCountyFeeSchedule && requirement.feeSchedules.length > 0) {
    const byCounty = new Map<number, { name: string; lows: number[]; highs: number[]; rows: number }>();

    for (const fee of requirement.feeSchedules) {
      const r = rangeOf(fee);
      if (!r) continue;
      const entry = byCounty.get(fee.county.id) ?? { name: fee.county.name, lows: [], highs: [], rows: 0 };
      entry.lows.push(r.low);
      entry.highs.push(r.high);
      entry.rows += 1;
      byCounty.set(fee.county.id, entry);
    }

    const counties = [...byCounty.values()].map((c) => ({
      name: countyLabel(c.name),
      low: Math.min(...c.lows),
      high: Math.max(...c.highs),
      tiered: c.rows > 1 && Math.min(...c.lows) !== Math.max(...c.highs),
    }));

    if (counties.length > 0) {
      const lowestC = counties.reduce((a, b) => (b.low < a.low ? b : a));
      const highestC = counties.reduce((a, b) => (b.high > a.high ? b : a));
      return {
        source: 'county',
        low: lowestC.low,
        high: highestC.high,
        median: median(counties.map((c) => (c.low + c.high) / 2)),
        count: counties.length,
        vendorCount: 0,
        vendorNames: [],
        lowest: { label: lowestC.name, sub: null, price: lowestC.low },
        highest: { label: highestC.name, sub: null, price: highestC.high },
        hasTiers: counties.some((c) => c.tiered),
        isSinglePrice: lowestC.low === highestC.high,
      };
    }
  }

  // 2. Recommended products
  const items = requirement.products
    .map((p) => {
      const r = rangeOf(p);
      return r ? { label: p.name, sub: p.vendor?.name ?? null, vendorId: p.vendor?.id ?? null, ...r } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (items.length === 0) return null;

  const lowestP = items.reduce((a, b) => (b.low < a.low ? b : a));
  const highestP = items.reduce((a, b) => (b.high > a.high ? b : a));
  const vendorIds = new Set(items.filter((i) => i.vendorId !== null).map((i) => i.vendorId));
  const vendorNames = [
    ...new Set([...items].sort((a, b) => a.low - b.low).map((i) => i.sub).filter((s): s is string => !!s)),
  ].slice(0, 3);

  return {
    source: 'products',
    low: lowestP.low,
    high: highestP.high,
    median: median(items.map((i) => (i.low + i.high) / 2)),
    count: items.length,
    vendorCount: vendorIds.size,
    vendorNames,
    lowest: { label: lowestP.label, sub: lowestP.sub, price: lowestP.low },
    highest: { label: highestP.label, sub: highestP.sub, price: highestP.high },
    hasTiers: false,
    isSinglePrice: lowestP.low === highestP.high,
  };
}

// ── Copy ──────────────────────────────────────────────────────────────────────

export function buildPriceContent(
  requirement: RequirementDetail,
  summary: PriceSummary,
  market: MarketCode
): PriceContent {
  const name = requirement.name;
  const country = marketCountryPhrase(market); // "Kenya" | "the US"
  const money = (n: number) => formatCurrency(n, market);
  const code = currencyCode(market);
  const s = summary;
  const paragraphs: string[] = [];

  if (s.source === 'county') {
    const lead = s.isSinglePrice
      ? `The price of ${name} in ${country} is ${money(s.low)}.`
      : `The price of ${name} in ${country} ranges between ${money(s.low)} in ${s.lowest.label} and ${money(s.high)} in ${s.highest.label}.`;
    const basis = `This is a county-issued requirement, so the fee is set by each county government rather than one national price. We currently have fee data for ${s.count} ${s.count === 1 ? 'county' : 'counties'}.`;
    const tiers = s.hasTiers
      ? ' Some counties also charge different rates depending on your business type or size, so what you pay depends on your business and where you operate.'
      : '';
    paragraphs.push(`${lead} ${basis}${tiers}`);
    paragraphs.push(
      `County fees are revised from time to time, so always confirm the current amount with the issuing county office before you pay. Amounts are shown in ${code}.`
    );
  } else {
    const lead = s.isSinglePrice
      ? `The price of ${name} in ${country} is ${money(s.low)}.`
      : `The price of ${name} in ${country} ranges between ${money(s.low)} and ${money(s.high)}.`;
    const basis = `This is based on ${s.count} ${s.count === 1 ? 'listing' : 'listings'} from ${s.vendorCount} ${
      s.vendorCount === 1 ? 'vendor' : 'vendors'
    } on Hustlecare.`;

    const extremes =
      !s.isSinglePrice && s.lowest.label !== s.highest.label
        ? ` The most affordable option is ${s.lowest.label}${s.lowest.sub ? ` from ${s.lowest.sub}` : ''} at ${money(s.lowest.price)}, while the most expensive is ${s.highest.label}${s.highest.sub ? ` from ${s.highest.sub}` : ''} at ${money(s.highest.price)}.`
        : '';
    const typical = s.count >= 3 ? ` The typical (median) price is around ${money(s.median)}.` : '';

    paragraphs.push(`${lead} ${basis}${extremes}${typical}`);
    paragraphs.push(
      `Prices vary by brand, specifications, condition and vendor, so it pays to compare a few options before you buy. Prices are shown in ${code} and can change — confirm the current price with the vendor before paying.`
    );
  }

  // ── FAQs (answers reuse the copy above so schema === visible text) ──────────
  const faqs: PriceFaq[] = [
    { question: `How much does ${name} cost in ${country}?`, answer: paragraphs.join(' ') },
  ];

  if (s.source === 'county' && !s.isSinglePrice) {
    faqs.push({
      question: `Which county has the cheapest ${name}?`,
      answer: `${s.lowest.label} has the lowest listed fee at ${money(s.lowest.price)}, while ${s.highest.label} has the highest at ${money(s.highest.price)}.`,
    });
  } else if (s.source === 'products' && s.vendorNames.length > 0) {
    faqs.push({
      question: `Where can I buy ${name} in ${country}?`,
      answer: `You can find ${name} from vendors such as ${joinList(s.vendorNames)} on Hustlecare. Compare the listed prices in the recommended products section of this page.`,
    });
  }

  const businesses = requirement.businessSummaries;
  if (businesses.length > 0) {
    const names = businesses.slice(0, 4).map((b) => b.name);
    faqs.push({
      question: `Which businesses need ${name} in ${country}?`,
      answer: `${businesses.length} business ${businesses.length === 1 ? 'type' : 'types'} on Hustlecare ${
        businesses.length === 1 ? 'needs' : 'need'
      } ${name}, including ${joinList(names)}.`,
    });
  }

  return { heading: `${name} Price in ${country}`, paragraphs, faqs };
}