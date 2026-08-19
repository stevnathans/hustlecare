// lib/markets.ts
//
// Single source of truth for the markets Hustlecare operates in. Everything
// that needs to filter or label data by country/market should import from
// here rather than hard-coding "KE"/"US" strings, so adding a future market
// (e.g. UK) is a one-place change.

export const MARKETS = {
  KE: { code: 'KE', label: 'Kenya' },
  US: { code: 'US', label: 'United States' },
} as const;

export type MarketCode = keyof typeof MARKETS;

export const DEFAULT_MARKET: MarketCode = 'KE';

export function isMarketCode(value: unknown): value is MarketCode {
  return typeof value === 'string' && value in MARKETS;
}

export function marketLabel(code: MarketCode): string {
  return MARKETS[code].label;
}