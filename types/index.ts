import { Vendor } from "./vendor";

export interface Product {
  unit: number;
  inCart: boolean; 
  id: string;
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