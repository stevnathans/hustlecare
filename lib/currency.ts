// lib/currency.ts
//
// Shared currency formatting, keyed by market — single source of truth so
// no component hardcodes KES/USD formatting independently. Add a new
// market here (and to lib/markets.ts) when expanding to a new country.

import type { MarketCode } from '@/lib/markets';
import type { MoneyRange } from '@/lib/cost-engine';

export const MARKET_CURRENCY: Record<MarketCode, { code: string; locale: string; symbol: string }> = {
  KE: { code: 'KES', locale: 'en-KE', symbol: 'KSh' },
  US: { code: 'USD', locale: 'en-US', symbol: '$' },
};

// Reverse lookup: currency code -> locale, derived from MARKET_CURRENCY so
// it can't drift out of sync. Used by formatCurrencyByCode below for
// contexts that only have a raw currency string (e.g. CartItem.currency,
// Product.currency) rather than a MarketCode.
const LOCALE_BY_CURRENCY: Record<string, string> = Object.fromEntries(
  Object.values(MARKET_CURRENCY).map(({ code, locale }) => [code, locale])
);

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

/**
 * Same as formatCurrency, but for contexts that only have a raw currency
 * code string (not a MarketCode) — e.g. a persisted CartItem.currency or
 * Product.currency value. Falls back to 'en-US' locale for an unrecognized
 * code rather than throwing, since Intl.NumberFormat itself will throw on
 * a genuinely invalid ISO currency code.
 */
export function formatCurrencyByCode(
  amount: number,
  currencyCodeValue: string,
  options?: Intl.NumberFormatOptions
): string {
  const locale = LOCALE_BY_CURRENCY[currencyCodeValue] ?? 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCodeValue,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options,
  }).format(amount);
}

/**
 * Locale to use for non-currency formatting (e.g. dates) alongside a raw
 * currency code, so a page doesn't hardcode 'en-KE' independent of the
 * currency it's actually displaying.
 */
export function localeForCurrencyCode(currencyCodeValue: string): string {
  return LOCALE_BY_CURRENCY[currencyCodeValue] ?? 'en-US';
}

export function currencyCode(market: MarketCode): string {
  return MARKET_CURRENCY[market].code;
}

/**
 * Format a cost-engine MoneyRange as "low – high", or a single figure when
 * low equals high (e.g. an exact county fee). Added for the /cost page and
 * its supporting components, which render MoneyRange values throughout —
 * keeps that formatting in one place instead of every component building
 * its own "${low} – ${high}" string.
 */
export function formatMoneyRange(
  range: MoneyRange,
  market: MarketCode,
  options?: Intl.NumberFormatOptions
): string {
  if (range.low === range.high) return formatCurrency(range.low, market, options);
  return `${formatCurrency(range.low, market, options)} – ${formatCurrency(range.high, market, options)}`;
}