export interface Product {
  unit: any;
  inCart: any; // It's generally better to be more explicit with types. What is 'inCart' supposed to represent? A boolean? A quantity?
  id: string;
  name: string;
  image?: string;
  price: number;
  description: string;
  rating: number;
  reviews: number;
  vendorLogo?: string;
  specifications?: string[];
  category: string;
  requirement: string;
  quantity: number; // This 'quantity' seems to represent the available quantity of the product, not the quantity in the cart.
  business: string;
}

export interface CartItem {
  business: string;
  id: string;
  name: string;
  price: number;
  quantity: number; // This 'quantity' will represent the number of this item in the cart.
  category: string;
}

export type CartItems = CartItem[];