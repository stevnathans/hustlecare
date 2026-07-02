// types/index.ts
import { Vendor, ProductCondition, DurationUnit, ReceiptStatus, WeightUnit, WarrantyType, LeadTime, BulkPriceTier } from "./vendor";

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

  // Condition
  condition?: ProductCondition;
  usedDurationValue?: number | null;
  usedDurationUnit?: DurationUnit | null;
  hasReceipt?: ReceiptStatus | null;

  // Specifications (structured — distinct from the free-text `specifications` list above)
  brand?: string | null;
  modelNumber?: string | null;
  voltage?: string | null;
  wattage?: string | null;
  dimensions?: string | null;
  weight?: number | null;
  weightUnit?: WeightUnit | null;

  // Warranty
  warrantyType?: WarrantyType;
  warrantyDurationValue?: number | null;
  warrantyDurationUnit?: DurationUnit | null;

  // Delivery / logistics
  deliveryAvailable?: boolean;
  pickupLocation?: string | null;
  leadTime?: LeadTime | null;

  // Commercial terms
  negotiable?: boolean;
  bulkPricing?: BulkPriceTier[];
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
  quantity: number; // This 'quantity' will represent the number of this item in the cart.
  category: string;
}

export type CartItems = CartItem[];