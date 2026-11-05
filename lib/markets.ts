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

export function getMarketFromPath(pathname: string): MarketCode {
  return pathname === '/us' || pathname.startsWith('/us/') ? 'US' : 'KE';
}

// Top-level routes that exist under /us (dedicated page or rewrite).
// Anything else falls back to the US home when switching to US, so we
// never send someone to a /us URL that 404s. Keep in sync with the
// /us pages and marketMirroredPaths in next.config.ts.
const US_AVAILABLE_ROOTS = ['businesses', 'marketplace', 'about', 'contact', 'search'];

/** The equivalent URL for `pathname` in the `target` market. */
export function getPathForMarket(pathname: string, target: MarketCode): string {
  const current = getMarketFromPath(pathname);
  if (current === target) return pathname;

  // Strip the /us prefix if we're coming from the US market
  const unprefixed = current === 'US' ? pathname.slice(3) || '/' : pathname;

  if (target === 'KE') return unprefixed;

  const root = unprefixed.split('/')[1];
  if (!US_AVAILABLE_ROOTS.includes(root)) return '/us';
  return `/us${unprefixed === '/' ? '' : unprefixed}`;
}

// ── Market-specific copy/URL metadata ─────────────────────────────────────────
// Everything that differs between markets in SEO text, URLs and schema lives
// here, so no page or component hardcodes "Kenya", "/us", "en-KE" etc.

interface MarketMeta {
  /** Fits "in {phrase}": "in Kenya", "in the US" */
  countryPhrase: string;
  /** URL prefix for this market's routes */
  basePath: string;
  /** OpenGraph locale */
  ogLocale: string;
  /** BCP-47 tag for hreflang and schema inLanguage */
  hreflang: string;
  /** schema.org areaServed sameAs */
  countrySameAs: string;
  /** Spelling variant */
  licenceWord: 'licence' | 'license';
}

const MARKET_META: Record<MarketCode, MarketMeta> = {
  KE: {
    countryPhrase: 'Kenya',
    basePath: '',
    ogLocale: 'en_KE',
    hreflang: 'en-KE',
    countrySameAs: 'https://en.wikipedia.org/wiki/Kenya',
    licenceWord: 'licence',
  },
  US: {
    countryPhrase: 'the US',
    basePath: '/us',
    ogLocale: 'en_US',
    hreflang: 'en-US',
    countrySameAs: 'https://en.wikipedia.org/wiki/United_States',
    licenceWord: 'license',
  },
};

export const marketCountryPhrase = (code: MarketCode) => MARKET_META[code].countryPhrase;
export const marketBasePath = (code: MarketCode) => MARKET_META[code].basePath;
export const marketOgLocale = (code: MarketCode) => MARKET_META[code].ogLocale;
export const marketHreflang = (code: MarketCode) => MARKET_META[code].hreflang;
export const marketCountrySameAs = (code: MarketCode) => MARKET_META[code].countrySameAs;
export const marketLicenceWord = (code: MarketCode) => MARKET_META[code].licenceWord;