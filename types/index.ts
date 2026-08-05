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

export interface Product {
  unit: number;
  inCart: boolean;
  id: number;
  name: string;
  image?: string;
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