// types/vendor.ts
import { County } from './index';

export type Vendor = {
  id: number;
  name: string;
  website: string;
  logo: string;
  slug?: string;

  // County coverage — defaults to "serves everywhere" (see schema comment
  // on Vendor.servesAllCounties). `counties` is only meaningful when
  // servesAllCounties is false.
  servesAllCounties?: boolean;
  counties?: { countyId: number; county?: County }[];
};

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED';

export type ProductCondition = 'NEW' | 'USED';
export type DurationUnit = 'days' | 'months' | 'years';
export type ReceiptStatus = 'YES' | 'NO' | 'UNKNOWN';
export type WeightUnit = 'kg' | 'g' | 'lb';
export type WarrantyType = 'NONE' | 'MANUFACTURER' | 'VENDOR';
export type LeadTime = 'IN_STOCK' | '1_3_DAYS' | '1_WEEK' | '2_WEEKS_PLUS';

export type BulkPriceTier = {
  id?: number;
  minQty: number;
  price: number;
};

export type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  priceMin: number | null;
  priceMax: number | null;
  currency: string;
  image: string;
  url: string;
  sku: string | null;
  stock: number | null;
  status: ProductStatus;
  rejectReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  vendorId: number | null;
  vendor: Vendor | null;
  templateId: number | null;
  template: { id: number; name: string; category?: string } | null;

  // Condition
  condition: ProductCondition;
  usedDurationValue: number | null;
  usedDurationUnit: DurationUnit | null;
  hasReceipt: ReceiptStatus | null;

  // Specifications
  brand: string | null;
  modelNumber: string | null;
  voltage: string | null;
  wattage: string | null;
  dimensions: string | null;
  weight: number | null;
  weightUnit: WeightUnit | null;

  // Warranty
  warrantyType: WarrantyType;
  warrantyDurationValue: number | null;
  warrantyDurationUnit: DurationUnit | null;

  // Delivery / logistics
  deliveryAvailable: boolean;
  pickupLocation: string | null;
  leadTime: LeadTime | null;

  // Commercial terms
  negotiable: boolean;
  bulkPricing: BulkPriceTier[];

  // Legal (Legal-category products) — validity + processing time only.
  // County availability is derived from `vendor`, not stored on Product.
  validityValue?: number | null;
  validityUnit?: DurationUnit | null;
  processingTimeMinDays?: number | null;
  processingTimeMaxDays?: number | null;
};

export type SortField = 'name' | 'price' | 'vendor' | 'id' | 'status';
export type SortDir = 'asc' | 'desc';
export type ViewMode = 'table' | 'grid';

export type VendorTuple = [string, string]; // [id, name]