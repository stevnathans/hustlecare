
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/product-validation.ts
export const VALID_LEAD_TIMES = ['IN_STOCK', '1_3_DAYS', '1_WEEK', '2_WEEKS_PLUS'];
export const VALID_DURATION_UNITS = ['days', 'months', 'years'];
export const VALID_WEIGHT_UNITS = ['kg', 'g', 'lb'];
export const VALID_RECEIPT_STATUSES = ['YES', 'NO', 'UNKNOWN'];
export const VALID_WARRANTY_TYPES = ['NONE', 'MANUFACTURER', 'VENDOR'];
export const VALID_CONDITIONS = ['NEW', 'USED'];
export const VALID_PRODUCT_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'ARCHIVED'];
export const VALID_BILLING_PERIODS = ['MONTHLY', 'QUARTERLY', 'YEARLY', 'ONE_TIME'];
export const MAX_CSV_IMPORT_ROWS = 100;
export const MAX_PENDING_PRODUCTS_PER_VENDOR = 150;

export interface BulkTierInput { minQty: number | string; price: number | string }

export interface SoftwarePackageInput {
  name: string;
  description?: string | null;
  price: number | string;
  billingPeriod: string;
  features?: unknown;
  isPopular?: unknown;
  displayOrder?: number | string;
}

/**
 * Validates every enum-ish field on a product payload. Used by both the
 * vendor and admin product routes so the two can't silently diverge on
 * what's allowed — previously each route hand-rolled its own copy of
 * these checks.
 */
export function validateProductEnums(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const {
    condition, usedDurationUnit, hasReceipt, weightUnit, warrantyType,
    warrantyDurationUnit, leadTime, status, validityUnit, billingPeriod,
  } = body as any;

  if (condition !== undefined && condition !== null && !VALID_CONDITIONS.includes(condition)) {
    errors.push('Invalid condition.');
  }
  if (usedDurationUnit !== undefined && usedDurationUnit !== null && !VALID_DURATION_UNITS.includes(usedDurationUnit)) {
    errors.push('Invalid used-duration unit.');
  }
  if (hasReceipt !== undefined && hasReceipt !== null && hasReceipt !== '' && !VALID_RECEIPT_STATUSES.includes(hasReceipt)) {
    errors.push('Invalid receipt status.');
  }
  if (weightUnit !== undefined && weightUnit !== null && !VALID_WEIGHT_UNITS.includes(weightUnit)) {
    errors.push('Invalid weight unit.');
  }
  if (warrantyType !== undefined && warrantyType !== null && !VALID_WARRANTY_TYPES.includes(warrantyType)) {
    errors.push('Invalid warranty type.');
  }
  if (warrantyDurationUnit !== undefined && warrantyDurationUnit !== null && !VALID_DURATION_UNITS.includes(warrantyDurationUnit)) {
    errors.push('Invalid warranty-duration unit.');
  }
  if (leadTime !== undefined && leadTime !== null && !VALID_LEAD_TIMES.includes(leadTime)) {
    errors.push('Invalid lead time.');
  }
  if (status !== undefined && status !== null && !VALID_PRODUCT_STATUSES.includes(status)) {
    errors.push('Invalid status.');
  }
  if (validityUnit !== undefined && validityUnit !== null && !VALID_DURATION_UNITS.includes(validityUnit)) {
    errors.push('Invalid validity unit.');
  }
  // Simple-case (no packages) software billing cadence. When packages are
  // present the route clears this to null before it gets here in practice,
  // but validate it defensively regardless of who's calling.
  if (billingPeriod !== undefined && billingPeriod !== null && !VALID_BILLING_PERIODS.includes(billingPeriod)) {
    errors.push('Invalid billing period.');
  }
  return errors;
}

/**
 * Validates and normalizes bulk pricing tiers. Returns either errors or
 * clean numeric tiers ready for Prisma.
 */
export function validateBulkPricing(bulkPricing: unknown): { errors: string[]; tiers: { minQty: number; price: number }[] } {
  if (bulkPricing === undefined || bulkPricing === null) return { errors: [], tiers: [] };
  if (!Array.isArray(bulkPricing)) return { errors: ['bulkPricing must be an array.'], tiers: [] };

  for (const tier of bulkPricing as BulkTierInput[]) {
    if (
      tier == null ||
      typeof tier.minQty === 'undefined' ||
      typeof tier.price === 'undefined' ||
      Number.isNaN(Number(tier.minQty)) ||
      Number.isNaN(Number(tier.price)) ||
      Number(tier.minQty) <= 0 ||
      Number(tier.price) < 0
    ) {
      return { errors: ['Each bulk pricing tier needs a positive minQty and a non-negative price.'], tiers: [] };
    }
  }

  return {
    errors: [],
    tiers: (bulkPricing as BulkTierInput[]).map((t) => ({ minQty: Number(t.minQty), price: Number(t.price) })),
  };
}

/**
 * Validates and normalizes Software package rows (Starter/Pro/Enterprise-
 * style tiers). Same shape convention as validateBulkPricing — returns
 * either errors or clean rows ready for Prisma's nested `create`.
 *
 * Never trust the client's `price` beyond "is this a valid number" — the
 * actual Product.price the rest of the app reads gets computed from these
 * rows server-side by computeDerivedMonthlyPrice, not passed through.
 */
export function validateSoftwarePackages(
  packages: unknown
): { errors: string[]; packages: { name: string; description: string | null; price: number; billingPeriod: string; features: string[]; isPopular: boolean; displayOrder: number }[] } {
  if (packages === undefined || packages === null) return { errors: [], packages: [] };
  if (!Array.isArray(packages)) return { errors: ['packages must be an array.'], packages: [] };

  const cleaned: { name: string; description: string | null; price: number; billingPeriod: string; features: string[]; isPopular: boolean; displayOrder: number }[] = [];

  for (let i = 0; i < packages.length; i++) {
    const pkg = (packages as SoftwarePackageInput[])[i];
    if (pkg == null || typeof pkg.name !== 'string' || !pkg.name.trim()) {
      return { errors: ['Each software package needs a name.'], packages: [] };
    }
    if (Number.isNaN(Number(pkg.price)) || Number(pkg.price) < 0) {
      return { errors: [`Package "${pkg.name}" needs a non-negative price.`], packages: [] };
    }
    if (!pkg.billingPeriod || !VALID_BILLING_PERIODS.includes(pkg.billingPeriod)) {
      return { errors: [`Package "${pkg.name}" has an invalid billing period.`], packages: [] };
    }
    const features = Array.isArray(pkg.features)
      ? pkg.features.filter((f): f is string => typeof f === 'string' && f.trim() !== '').map((f) => f.trim())
      : [];

    cleaned.push({
      name: pkg.name.trim(),
      description: typeof pkg.description === 'string' && pkg.description.trim() ? pkg.description.trim() : null,
      price: Number(pkg.price),
      billingPeriod: pkg.billingPeriod,
      features,
      isPopular: !!pkg.isPopular,
      displayOrder: pkg.displayOrder != null && !Number.isNaN(Number(pkg.displayOrder)) ? Number(pkg.displayOrder) : i,
    });
  }

  return { errors: [], packages: cleaned };
}

/**
 * Product.price for a Software product with packages is always derived
 * server-side, never trusted from the client — this is the single source
 * of truth for that formula, called from both the create and update
 * routes so they can't drift apart.
 *
 * Normalizes QUARTERLY (÷3) and YEARLY (÷12) against MONTHLY to find the
 * lowest monthly-equivalent price. ONE_TIME packages are excluded from
 * that comparison — a one-off cost isn't a fair "per month" figure — UNLESS
 * every package is ONE_TIME, in which case falls back to the lowest raw
 * ONE_TIME price so the product still gets a sensible "starting from".
 *
 * Returns null only when `packages` is empty (nothing to derive from).
 */
export function computeDerivedMonthlyPrice(packages: { price: number; billingPeriod: string }[]): number | null {
  if (!packages || packages.length === 0) return null;

  const monthlyEquivalents = packages
    .filter((p) => p.billingPeriod !== 'ONE_TIME')
    .map((p) => {
      if (p.billingPeriod === 'QUARTERLY') return p.price / 3;
      if (p.billingPeriod === 'YEARLY') return p.price / 12;
      return p.price; // MONTHLY
    });

  if (monthlyEquivalents.length > 0) {
    return Math.min(...monthlyEquivalents);
  }

  // Every package is ONE_TIME — fall back to the lowest raw price.
  const oneTimePrices = packages.map((p) => p.price);
  return Math.min(...oneTimePrices);
}

/** True if `v` is present and not an empty string (but 0 and false both count as present). */
export function hasValue(v: unknown): boolean {
  return v !== undefined && v !== null && v !== '';
}

/** Shared field mapper for the "create" shape (undefined/blank → null defaults).
 *
 *  BUGFIX: every optional numeric field here must check `hasValue()` (which
 *  excludes '') and NOT just `!= null` — an empty string is neither undefined
 *  nor null, so `Number('')` silently evaluates to 0 instead of staying null.
 *  That previously affected price, priceMin, priceMax, stock,
 *  usedDurationValue, and warrantyDurationValue (e.g. an admin marking a
 *  product USED but leaving "how long used" blank would save it as
 *  "used for 0 months" instead of leaving it unset). weight, validityValue,
 *  and processingTimeMinDays/MaxDays were already guarded correctly — this
 *  just brings the rest of the function in line with that same pattern.
 *
 *  NOTE on billingPeriod/price for Software products with packages: this
 *  function has no knowledge of packages (it's a pure field mapper), so it
 *  maps price/billingPeriod exactly as given. The route is responsible for
 *  overriding `price` with computeDerivedMonthlyPrice(...) and forcing
 *  `billingPeriod: null` whenever packages.length > 0 — the client already
 *  sends billingPeriod: null in that case, but the route should not rely
 *  on that alone.
 */
export function mapProductCreateFields(body: Record<string, any>) {
  const isUsed = body.condition === 'USED';
  const hasWarranty = !!body.warrantyType && body.warrantyType !== 'NONE';
  const hasValidity = hasValue(body.validityValue);
  return {
    name: body.name?.trim(),
    description: body.description?.trim() || null,
    price: hasValue(body.price) ? Number(body.price) : null,
    priceMin: hasValue(body.priceMin) ? Number(body.priceMin) : null,
    priceMax: hasValue(body.priceMax) ? Number(body.priceMax) : null,
    currency: body.currency || 'KES',
    image: body.image?.trim() || null,
    url: body.url?.trim() || null,
    sku: body.sku?.trim() || null,
    stock: hasValue(body.stock) ? Number(body.stock) : null,

    condition: body.condition || 'NEW',
    usedDurationValue: isUsed && hasValue(body.usedDurationValue) ? Number(body.usedDurationValue) : null,
    usedDurationUnit: isUsed ? (body.usedDurationUnit || null) : null,
    hasReceipt: isUsed ? (body.hasReceipt || null) : null,

    brand: body.brand?.trim() || null,
    modelNumber: body.model?.trim() || null,
    voltage: body.voltage?.trim() || null,
    wattage: body.wattage?.trim() || null,
    dimensions: body.dimensions?.trim() || null,
    weight: hasValue(body.weight) ? Number(body.weight) : null,
    weightUnit: hasValue(body.weight) ? (body.weightUnit || null) : null,

    warrantyType: body.warrantyType || 'NONE',
    warrantyDurationValue: hasWarranty && hasValue(body.warrantyDurationValue) ? Number(body.warrantyDurationValue) : null,
    warrantyDurationUnit: hasWarranty ? (body.warrantyDurationUnit || null) : null,

    deliveryAvailable: !!body.deliveryAvailable,
    pickupLocation: body.pickupLocation?.trim() || null,
    leadTime: body.leadTime || 'IN_STOCK',

    negotiable: !!body.negotiable,

    // Legal — validity + processing time only. County availability is NOT
    // a product field; it's derived from the product's Vendor.
    validityValue: hasValidity ? Number(body.validityValue) : null,
    validityUnit: hasValidity ? (body.validityUnit || null) : null,
    processingTimeMinDays: hasValue(body.processingTimeMinDays) ? Number(body.processingTimeMinDays) : null,
    processingTimeMaxDays: hasValue(body.processingTimeMaxDays) ? Number(body.processingTimeMaxDays) : null,

    // Software — simple flat-price cadence. Only meaningful when the
    // product has no packages; see NOTE above for how the route overrides
    // this when it does.
    billingPeriod: hasValue(body.billingPeriod) ? body.billingPeriod : null,
  };
}