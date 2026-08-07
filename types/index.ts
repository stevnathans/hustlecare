// types/index.ts
import { Vendor, ProductCondition, DurationUnit, ReceiptStatus, WeightUnit, WarrantyType, LeadTime, BulkPriceTier } from "./vendor";

export interface County {
  id: number;
  name: string;
  slug: string;
}

export type BusinessSizeBand = 'MICRO' | 'SMALL' | 'MEDIUM' | 'LARGE';

export interface TradeClass {
  id: number;
  name: string;
  slug: string;
  description: string | null;
}

export interface LegalFeeSchedule {
  id: number;
  templateId: number;
  countyId: number;
  // Retained alongside tradeClassId — see the comment in
  // lib/legalFeeSchedule.ts. tradeClassId scores higher when both are
  // present on a row, but existing businessCategoryId-tiered rows keep
  // resolving correctly without needing a forced migration.
  businessCategoryId: number | null;
  tradeClassId: number | null;
  sizeBand: BusinessSizeBand | null;
  employeeCountMax: number | null;
  floorAreaSqm: number | null;
  // Exactly one pricing mode is populated: either `price` (fixed), or
  // both `priceMin`/`priceMax` (range) — never both. See
  // lib/legalFeeSchedule.ts for how a row's mode is resolved.
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  validityValue: number | null;
  validityUnit: DurationUnit | null;
  processingTimeMinDays: number | null;
  processingTimeMaxDays: number | null;
  applyUrl: string | null;
  notes: string | null;
}

// Software subscription cadence — shared by Product.billingPeriod (the
// simple flat-price case) and SoftwarePackage.billingPeriod (each tier's
// own cadence).
export type BillingPeriod = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME';

// A purchasable tier for a Software-category product (Starter/Pro/
// Enterprise-style). Only present when Product.packages is non-empty —
// see the comment on Product.price below for how the two interact.
export interface SoftwarePackage {
  id: number;
  name: string;
  description: string | null;
  price: number;
  billingPeriod: BillingPeriod;
  features: string[];
  isPopular: boolean;
  displayOrder: number;
}

export interface Product {
  unit: number;
  inCart: boolean;
  id: number;
  name: string;
  image?: string;
  // For a Software product WITH packages, this is the pre-computed lowest
  // monthly-equivalent price across `packages` ("starting from") — kept in
  // sync server-side on every save, never edited directly. Everywhere else
  // (sorting, filtering, "starting from" displays outside ProductCard)
  // keeps reading this field exactly as before; only ProductCard needs to
  // know about `packages` itself.
  price: number;
  description: string;
  rating: number;
  reviews: number;
  vendorId: number;
  vendor: Vendor;
  url: string;
  specifications?: string[];
  category: string;
  requirementName: string;
  quantity: number;
  business: string;
  createdAt: string;
  updatedAt: string;

  condition?: ProductCondition;
  usedDurationValue?: number | null;
  usedDurationUnit?: DurationUnit | null;
  hasReceipt?: ReceiptStatus | null;

  brand?: string | null;
  modelNumber?: string | null;
  voltage?: string | null;
  wattage?: string | null;
  dimensions?: string | null;
  weight?: number | null;
  weightUnit?: WeightUnit | null;

  warrantyType?: WarrantyType;
  warrantyDurationValue?: number | null;
  warrantyDurationUnit?: DurationUnit | null;

  deliveryAvailable?: boolean;
  pickupLocation?: string | null;
  leadTime?: LeadTime | null;

  negotiable?: boolean;
  bulkPricing?: BulkPriceTier[];

  validityValue?: number | null;
  validityUnit?: DurationUnit | null;
  processingTimeMinDays?: number | null;
  processingTimeMaxDays?: number | null;

  // Software — simple flat-price cadence. Only meaningful when `packages`
  // is empty/absent; a product with packages ignores this (it's cleared
  // to null server-side once packages exist — see
  // lib/product-validation.ts).
  billingPeriod?: BillingPeriod | null;
  packages?: SoftwarePackage[];
}

export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  image: string;
  vendorId: string;
};

export interface CartItem {
  unitPrice: number;
  productId: string;
  business: string;
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

export type CartItems = CartItem[];

export type NecessityFilter = string;