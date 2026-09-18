// lib/cost-engine.ts
//
// THE single source of truth for every startup-cost figure on the site.
// Pure — no Prisma, no fetch, no React.
//
// BUG FIX (this revision): buildCategoryBreakdown used to be built from
// the FULL, unfiltered line list — every line regardless of isStock or
// isRequired — while the headline summary (oneTime/cashToOpen) correctly
// excludes stock always, and excludes optional lines unless
// includeOptional is set. That meant a required-only breakdown's
// .categories total could be HIGHER than its own .oneTime total: the
// category cards were silently including stock and optional costs the
// headline number above them didn't. filterInScope is now the single
// filter both summariseCostLines and buildCostBreakdown use, so
// `.categories` and `.oneTime`/`.cashToOpen` always describe the same
// set of lines for a given set of options.

import type { MarketCode } from '@/lib/markets';

export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';
export type SizeBand = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';
export type CostRecurrence = 'ONE_TIME' | 'MONTHLY' | 'ANNUAL';

export const ALL_SIZE_BANDS: SizeBand[] = ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'];

export type PriceBasis = 'PRODUCT' | 'FEE_SCHEDULE' | 'NONE';
export type CostSource = 'COMPUTED' | 'EDITORIAL' | 'NONE';

export interface MoneyRange {
  low: number;
  typical: number;
  high: number;
}

export const ZERO_RANGE: MoneyRange = { low: 0, typical: 0, high: 0 };
export const DEFAULT_SIZE_BAND: SizeBand = 'MEDIUM';
export const DEFAULT_WORKING_CAPITAL_MONTHS = 3;

export interface CostEngineProduct {
  id?: number;
  name?: string;
  image?: string | null;
  price: number | null | undefined;
  billingPeriod?: BillingPeriod | null;
  bulkPricing?: { minQty: number; price: number }[] | null;
  priceCheckedAt?: string | Date | null;
}

export interface CostEngineRequirement {
  id: number;
  templateId?: number | null;
  name: string;
  category?: string | null;
  necessity: string;
  excludedFromTotals?: boolean;
  slug?: string | null;
  quantity?: number;
  quantityByBand?: Partial<Record<SizeBand, number>>;
  recurrence?: CostRecurrence;
  feeSchedule?: { low: number; high: number } | null;
}

export interface CostEngineOptions {
  market?: MarketCode;
  sizeBand?: SizeBand;
  includeOptional?: boolean;
  includeStock?: boolean;
  workingCapitalMonths?: number;
  editorialFallback?: { min: number | null; max: number | null } | null;
}

export interface RepresentativeProduct {
  id: number;
  name: string;
  price: number;
  image: string | null;
}

export interface CostLine {
  requirementId: number;
  templateId: number | null;
  name: string;
  category: string;
  necessity: string;
  isRequired: boolean;
  isStock: boolean;
  quantity: number;
  recurrence: CostRecurrence;
  priceBasis: PriceBasis;
  slug: string | null;
  unit: MoneyRange | null;
  total: MoneyRange;
  productCount: number;
  hasPricing: boolean;
  priceCheckedAt: Date | string | null;
  representativeProduct: RepresentativeProduct | null;
}

export interface CategoryBreakdown {
  name: string;
  lineCount: number;
  linesWithPricing: number;
  oneTime: MoneyRange;
  monthlyRecurring: MoneyRange;
}

export interface CostCoverage {
  totalRequirements: number;
  requirementsWithPricing: number;
  requirementsMissingPricing: number;
  ratio: number;
}

export interface CostSummary {
  oneTime: MoneyRange;
  monthlyRecurring: MoneyRange;
  workingCapital: MoneyRange;
  stock: MoneyRange;
  stockCount: number;
  cashToOpen: MoneyRange;
  coverage: CostCoverage;
  hasPricing: boolean;
  source: CostSource;
  editorialDrift: number | null;
  workingCapitalMonths: number;
  sizeBand: SizeBand;
  pricesLastVerifiedAt: Date | string | null;
}

export interface CostBreakdown extends CostSummary {
  lines: CostLine[];
  categories: CategoryBreakdown[];
}

export interface RequirementsPageCostSummary {
  requiredSource: CostSource;
  allSource: CostSource;
  requiredCount: number;
  optionalCount: number;
  totalRequirements: number;
  unfilteredRequiredLowPrice: number;
  unfilteredRequiredMediumPrice: number;
  unfilteredRequiredHighPrice: number;
  unfilteredLowPrice: number;
  unfilteredMediumPrice: number;
  unfilteredHighPrice: number;
  unfilteredRequirementsWithProducts: number;
  unfilteredRequiredRequirementsWithProducts: number;
  unfilteredStockCount: number;
  unfilteredStockLowPrice: number;
  unfilteredStockMedianPrice: number;
  unfilteredStockHighPrice: number;
}

function median(sortedAscending: number[]): number {
  if (sortedAscending.length === 0) return 0;
  const mid = Math.floor(sortedAscending.length / 2);
  return sortedAscending.length % 2 !== 0 ? sortedAscending[mid] : sortedAscending[mid - 1];
}

function monthlyFactor(recurrence: CostRecurrence): number {
  if (recurrence === 'MONTHLY') return 1;
  if (recurrence === 'ANNUAL') return 1 / 12;
  return 0;
}

function unitPriceForQuantity(product: CostEngineProduct, quantity: number): number {
  const base = product.price ?? 0;
  const tiers = product.bulkPricing ?? [];
  if (quantity <= 1 || tiers.length === 0) return base;
  const applicable = tiers.filter((t) => t.minQty <= quantity && t.price > 0).sort((a, b) => b.minQty - a.minQty);
  return applicable.length > 0 ? applicable[0].price : base;
}

function resolveRecurrence(requirement: CostEngineRequirement, products: CostEngineProduct[]): CostRecurrence {
  const periods = products.map((p) => p.billingPeriod).filter((p): p is BillingPeriod => !!p && p !== 'ONE_TIME');
  if (periods.length > 0) {
    if (periods.includes('YEARLY') && periods.every((p) => p === 'YEARLY')) return 'ANNUAL';
    return 'MONTHLY';
  }
  return requirement.recurrence ?? 'ONE_TIME';
}

function resolveLinePriceCheckedAt(products: CostEngineProduct[]): Date | string | null {
  if (products.length === 0) return null;
  if (products.some((p) => !p.priceCheckedAt)) return null;
  return products.reduce<Date | string | null>((oldest, p) => {
    const date = p.priceCheckedAt as Date | string;
    if (!oldest) return date;
    return new Date(date).getTime() < new Date(oldest).getTime() ? date : oldest;
  }, null);
}

function resolveRepresentativeProduct(
  products: CostEngineProduct[],
  quantity: number,
  cheapestUnitPrice: number,
): RepresentativeProduct | null {
  const winner = products.find((p) => unitPriceForQuantity(p, quantity) === cheapestUnitPrice) ?? products[0];
  if (!winner || winner.id == null || !winner.name) return null;
  return { id: winner.id, name: winner.name, price: cheapestUnitPrice, image: winner.image ?? null };
}

function addRange(a: MoneyRange, b: MoneyRange): MoneyRange {
  return { low: a.low + b.low, typical: a.typical + b.typical, high: a.high + b.high };
}

function scaleRange(r: MoneyRange, factor: number): MoneyRange {
  return { low: r.low * factor, typical: r.typical * factor, high: r.high * factor };
}

function isRequiredNecessity(necessity: string): boolean {
  return (necessity || '').toLowerCase() === 'required';
}

/**
 * The one filter defining "which lines count toward the headline figures"
 * for a given set of options: never stock, and optional lines only when
 * includeOptional is set. Used identically by summariseCostLines (for the
 * money totals) and buildCostBreakdown (for the category rollup), so the
 * two can never disagree about which lines they're describing.
 */
function filterInScope(lines: CostLine[], options: CostEngineOptions): CostLine[] {
  const includeOptional = options.includeOptional ?? false;
  return lines.filter((line) => {
    if (line.isStock) return false;
    if (!includeOptional && !line.isRequired) return false;
    return true;
  });
}

export function buildCostLines(
  requirements: CostEngineRequirement[],
  productsByRequirementName: Record<string, CostEngineProduct[]>,
  options: CostEngineOptions = {},
): CostLine[] {
  const sizeBand = options.sizeBand ?? DEFAULT_SIZE_BAND;

  return requirements.map((requirement) => {
    const bandQuantity = requirement.quantityByBand?.[sizeBand];
    const quantity = Math.max(1, Math.round(bandQuantity ?? requirement.quantity ?? 1));
    const category = requirement.category || 'Uncategorized';
    const isStock = requirement.excludedFromTotals === true;
    const isRequired = isRequiredNecessity(requirement.necessity);
    const slug = requirement.slug ?? null;

    const rawProducts = productsByRequirementName[requirement.name] ?? [];
    const products = rawProducts.filter((p) => typeof p.price === 'number' && (p.price as number) > 0);
    const recurrence = resolveRecurrence(requirement, products);

    if (requirement.feeSchedule) {
      const { low, high } = requirement.feeSchedule;
      const unit: MoneyRange = { low, typical: (low + high) / 2, high };
      return {
        requirementId: requirement.id,
        templateId: requirement.templateId ?? null,
        name: requirement.name,
        category,
        necessity: requirement.necessity,
        isRequired,
        isStock,
        quantity,
        recurrence,
        priceBasis: 'FEE_SCHEDULE' as const,
        slug,
        unit,
        total: scaleRange(unit, quantity),
        productCount: 0,
        hasPricing: true,
        priceCheckedAt: null,
        representativeProduct: null,
      };
    }

    if (products.length === 0) {
      return {
        requirementId: requirement.id,
        templateId: requirement.templateId ?? null,
        name: requirement.name,
        category,
        necessity: requirement.necessity,
        isRequired,
        isStock,
        quantity,
        recurrence,
        priceBasis: 'NONE' as const,
        slug,
        unit: null,
        total: ZERO_RANGE,
        productCount: 0,
        hasPricing: false,
        priceCheckedAt: null,
        representativeProduct: null,
      };
    }

    const effectivePrices = products.map((p) => unitPriceForQuantity(p, quantity)).sort((a, b) => a - b);
    const unit: MoneyRange = {
      low: effectivePrices[0],
      typical: median(effectivePrices),
      high: effectivePrices[effectivePrices.length - 1],
    };

    return {
      requirementId: requirement.id,
      templateId: requirement.templateId ?? null,
      name: requirement.name,
      category,
      necessity: requirement.necessity,
      isRequired,
      isStock,
      quantity,
      recurrence,
      priceBasis: 'PRODUCT' as const,
      slug,
      unit,
      total: scaleRange(unit, quantity),
      productCount: products.length,
      hasPricing: true,
      priceCheckedAt: resolveLinePriceCheckedAt(products),
      representativeProduct: resolveRepresentativeProduct(products, quantity, unit.low),
    };
  });
}

export function summariseCostLines(lines: CostLine[], options: CostEngineOptions = {}): CostSummary {
  const includeStock = options.includeStock ?? false;
  const workingCapitalMonths = options.workingCapitalMonths ?? DEFAULT_WORKING_CAPITAL_MONTHS;
  const sizeBand = options.sizeBand ?? DEFAULT_SIZE_BAND;

  const inScope = filterInScope(lines, options);
  const stockLines = lines.filter((line) => line.isStock);

  let oneTime = ZERO_RANGE;
  let monthlyRecurring = ZERO_RANGE;

  for (const line of inScope) {
    if (line.recurrence === 'ONE_TIME') {
      oneTime = addRange(oneTime, line.total);
    } else {
      monthlyRecurring = addRange(monthlyRecurring, scaleRange(line.total, monthlyFactor(line.recurrence)));
    }
  }

  const stock = stockLines.reduce<MoneyRange>((acc, line) => addRange(acc, line.total), ZERO_RANGE);
  const workingCapital = scaleRange(monthlyRecurring, workingCapitalMonths);

  let cashToOpen = addRange(oneTime, workingCapital);
  if (includeStock) cashToOpen = addRange(cashToOpen, stock);

  const requirementsWithPricing = inScope.filter((l) => l.hasPricing).length;
  const totalRequirements = inScope.length;

  const coverage: CostCoverage = {
    totalRequirements,
    requirementsWithPricing,
    requirementsMissingPricing: totalRequirements - requirementsWithPricing,
    ratio: totalRequirements === 0 ? 0 : requirementsWithPricing / totalRequirements,
  };

  const hasPricing = requirementsWithPricing > 0;

  const editorial = options.editorialFallback;
  const hasEditorial =
    !!editorial && typeof editorial.min === 'number' && typeof editorial.max === 'number' && editorial.max > 0;

  let source: CostSource = hasPricing ? 'COMPUTED' : 'NONE';
  let editorialDrift: number | null = null;

  if (hasEditorial) {
    const min = editorial!.min as number;
    const max = editorial!.max as number;
    const midpoint = (min + max) / 2;

    if (hasPricing && midpoint > 0) {
      editorialDrift = (cashToOpen.typical - midpoint) / midpoint;
    }

    if (!hasPricing) {
      source = 'EDITORIAL';
      oneTime = { low: min, typical: midpoint, high: max };
      cashToOpen = { low: min, typical: midpoint, high: max };
    }
  }

  const pricedInScope = inScope.filter((l) => l.hasPricing);
  const pricesLastVerifiedAt =
    pricedInScope.length > 0 && pricedInScope.every((l) => l.priceCheckedAt)
      ? pricedInScope.reduce<Date | string | null>((oldest, l) => {
          const date = l.priceCheckedAt as Date | string;
          if (!oldest) return date;
          return new Date(date).getTime() < new Date(oldest).getTime() ? date : oldest;
        }, null)
      : null;

  return {
    oneTime,
    monthlyRecurring,
    workingCapital,
    stock,
    stockCount: stockLines.length,
    cashToOpen,
    coverage,
    hasPricing,
    source,
    editorialDrift,
    workingCapitalMonths,
    sizeBand,
    pricesLastVerifiedAt,
  };
}

function buildCategoryBreakdown(inScopeLines: CostLine[]): CategoryBreakdown[] {
  const map = new Map<string, CategoryBreakdown>();

  for (const line of inScopeLines) {
    let entry = map.get(line.category);
    if (!entry) {
      entry = { name: line.category, lineCount: 0, linesWithPricing: 0, oneTime: ZERO_RANGE, monthlyRecurring: ZERO_RANGE };
      map.set(line.category, entry);
    }
    entry.lineCount += 1;
    if (line.hasPricing) entry.linesWithPricing += 1;
    if (line.recurrence === 'ONE_TIME') {
      entry.oneTime = addRange(entry.oneTime, line.total);
    } else {
      entry.monthlyRecurring = addRange(entry.monthlyRecurring, scaleRange(line.total, monthlyFactor(line.recurrence)));
    }
  }

  return Array.from(map.values());
}

export function buildCostBreakdown(
  requirements: CostEngineRequirement[],
  productsByRequirementName: Record<string, CostEngineProduct[]>,
  options: CostEngineOptions = {},
): CostBreakdown {
  const lines = buildCostLines(requirements, productsByRequirementName, options);
  const summary = summariseCostLines(lines, options);
  // Same inScope filter as the summary above — see filterInScope's
  // header comment. This is what fixed .categories disagreeing with
  // .oneTime/.cashToOpen.
  const inScope = filterInScope(lines, options);
  return { ...summary, lines, categories: buildCategoryBreakdown(inScope) };
}

export function isEditorialDriftSignificant(drift: number | null, threshold = 0.3): boolean {
  return drift !== null && Math.abs(drift) > threshold;
}