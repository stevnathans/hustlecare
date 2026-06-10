export type Vendor = {
  id: number;
  name: string;
  website: string;
  logo: string;
  slug?: string;
};

export type ProductStatus = 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED';

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
};

export type SortField = 'name' | 'price' | 'vendor' | 'id' | 'status';
export type SortDir = 'asc' | 'desc';
export type ViewMode = 'table' | 'grid';

export type VendorTuple = [string, string]; // [id, name]