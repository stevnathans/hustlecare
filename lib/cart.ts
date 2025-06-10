import { prisma } from "./db";
import { auth } from "@/auth";

// Type for adding/updating a cart item
interface CartItemInput {
  productId: number;
  quantity: number;
  unitPrice: number;
}

// Fetch or create a cart for the current user + business
export async function getOrCreateCart(businessId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  let cart = await prisma.cart.findFirst({
    where: {
      userId: session.user.id,
      businessId: businessId,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: {
        userId: session.user.id,
        businessId: businessId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  return cart;
}

// Add or update item in cart
export async function addOrUpdateCartItem(
  cartId: string,
  item: CartItemInput
) {
  return await prisma.cartItem.upsert({
    where: {
      cartId_productId: {
        cartId,
        productId: item.productId,
      },
    },
    update: {
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    },
    create: {
      cartId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    },
  });
}

// Remove item from cart
export async function removeCartItem(
  cartId: string,
  productId: number
) {
  return await prisma.cartItem.delete({
    where: {
      cartId_productId: {
        cartId,
        productId,
      },
    },
  });
}