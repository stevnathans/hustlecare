// lib/product-validation.ts
export const VALID_LEAD_TIMES = ['IN_STOCK', '1_3_DAYS', '1_WEEK', '2_WEEKS_PLUS'];
export const VALID_DURATION_UNITS = ['days', 'months', 'years'];
export const VALID_WEIGHT_UNITS = ['kg', 'g', 'lb'];
export const VALID_RECEIPT_STATUSES = ['YES', 'NO', 'UNKNOWN'];
export const VALID_WARRANTY_TYPES = ['NONE', 'MANUFACTURER', 'VENDOR'];
export const VALID_CONDITIONS = ['NEW', 'USED'];
export const VALID_PRODUCT_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'ARCHIVED'];
export const MAX_CSV_IMPORT_ROWS = 100;
export const MAX_PENDING_PRODUCTS_PER_VENDOR = 150;

export interface BulkTierInput { minQty: number | string; price: number | string }

/**
 * Validates every enum-ish field on a product payload. Used by both the
 * vendor and admin product routes so the two can't silently diverge on
 * what's allowed — previously each route hand-rolled its own copy of
 * these checks.
 */
export function validateProductEnums(body: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const { condition, usedDurationUnit, hasReceipt, weightUnit, warrantyType, warrantyDurationUnit, leadTime, status } = body as any;

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

/** Shared field mapper for the "create" shape (undefined → null defaults). */
export function mapProductCreateFields(body: Record<string, any>) {
  const isUsed = body.condition === 'USED';
  const hasWarranty = !!body.warrantyType && body.warrantyType !== 'NONE';
  return {
    name: body.name?.trim(),
    description: body.description?.trim() || null,
    price: body.price !== undefined && body.price !== null ? Number(body.price) : null,
    priceMin: body.priceMin !== undefined && body.priceMin !== null ? Number(body.priceMin) : null,
    priceMax: body.priceMax !== undefined && body.priceMax !== null ? Number(body.priceMax) : null,
    currency: body.currency || 'KES',
    image: body.image?.trim() || null,
    url: body.url?.trim() || null,
    sku: body.sku?.trim() || null,
    stock: body.stock !== undefined && body.stock !== null ? Number(body.stock) : null,

    condition: body.condition || 'NEW',
    usedDurationValue: isUsed && body.usedDurationValue != null ? Number(body.usedDurationValue) : null,
    usedDurationUnit: isUsed ? (body.usedDurationUnit || null) : null,
    hasReceipt: isUsed ? (body.hasReceipt || null) : null,

    brand: body.brand?.trim() || null,
    modelNumber: body.model?.trim() || null,
    voltage: body.voltage?.trim() || null,
    wattage: body.wattage?.trim() || null,
    dimensions: body.dimensions?.trim() || null,
    weight: body.weight != null && body.weight !== '' ? Number(body.weight) : null,
    weightUnit: body.weight != null && body.weight !== '' ? (body.weightUnit || null) : null,

    warrantyType: body.warrantyType || 'NONE',
    warrantyDurationValue: hasWarranty && body.warrantyDurationValue != null ? Number(body.warrantyDurationValue) : null,
    warrantyDurationUnit: hasWarranty ? (body.warrantyDurationUnit || null) : null,

    deliveryAvailable: !!body.deliveryAvailable,
    pickupLocation: body.pickupLocation?.trim() || null,
    leadTime: body.leadTime || 'IN_STOCK',

    negotiable: !!body.negotiable,
  };
}