import { Cart, CartItem, Product } from "@prisma/client";

export type CartWithItems = Cart & {
  items: CartItemWithProduct[];
};

export type CartItemWithProduct = CartItem & {
  product: Product;
};

export type AddToCartRequest = {
  productId: number;
  quantity?: number;
  businessId: number;
};

export type RemoveFromCartRequest = {
  cartItemId: string;
};