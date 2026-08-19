// lib/currency.ts
//
// Shared currency formatting, keyed by market — single source of truth so
// no component hardcodes KES/USD formatting independently. Add a new
// market here (and to lib/markets.ts) when expanding to a new country.

import type { MarketCode } from '@/lib/markets';

export const MARKET_CURRENCY: Record<MarketCode, { code: string; locale: string; symbol: string }> = {
  KE: { code: 'KES', locale: 'en-KE', symbol: 'KSh' },
  US: { code: 'USD', locale: 'en-US', symbol: '$' },
};

/**
 * Format an amount as currency for the given market. Defaults to 0 decimal
 * places since prices on the platform are whole-number amounts in both
 * currencies today — pass `options` to override if that ever changes.
 */
export function formatCurrency(
  amount: number,
  market: MarketCode,
  options?: Intl.NumberFormatOptions
): string {
  const { code, locale } = MARKET_CURRENCY[market];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

export function currencyCode(market: MarketCode): string {
  return MARKET_CURRENCY[market].code;
}