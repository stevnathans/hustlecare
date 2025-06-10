'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import {prisma} from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Types for cart operations
type CartItem = {
  id: string;
  productId: number;
  cartId: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    description: string | null;
    price: number | null;
    image: string | null;
  };
};

type Cart = {
  id: string;
  name: string | null;
  userId: string;
  businessId: number;
  totalCost: number | null;
  items: CartItem[];
  business: {
    id: number;
    name: string;
    slug: string;
    image: string | null;
  };
};

/**
 * Get or create a cart for a specific business
 */
export async function getOrCreateCart(businessId: number): Promise<Cart | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    const userId = session.user.id;

    // Check if user already has a cart for this business
    let cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // If no cart exists, create one
    if (!cart) {
      // First get the business
      const business = await prisma.business.findUnique({
        where: { id: businessId },
      });

      if (!business) {
        throw new Error('Business not found');
      }

      cart = await prisma.cart.create({
        data: {
          name: `${business.name} Requirements`,
          userId,
          businessId,
          totalCost: 0,
        },
        include: {
          business: {
            select: {
              id: true,
              name: true,
              slug: true,
              image: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return cart;
  } catch (error) {
    console.error('Error in getOrCreateCart:', error);
    return null;
  }
}

/**
 * Get cart for a specific business
 */
export async function getCartForBusiness(businessId: number): Promise<Cart | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    const userId = session.user.id;

    const cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId,
        },
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return cart;
  } catch (error) {
    console.error('Error in getCartForBusiness:', error);
    return null;
  }
}

/**
 * Get all carts for the current user
 */
export async function getUserCarts(): Promise<Cart[]> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    const userId = session.user.id;

    const carts = await prisma.cart.findMany({
      where: {
        userId,
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return carts;
  } catch (error) {
    console.error('Error in getUserCarts:', error);
    return [];
  }
}

/**
 * Add a product to the cart
 */
export async function addToCart(
  businessId: number,
  productId: number,
  quantity: number = 1
): Promise<{ success: boolean; message: string; cartItem?: CartItem }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    const userId = session.user.id;

    // Get or create cart for this business
    let cart = await getOrCreateCart(businessId);
    
    if (!cart) {
      return { success: false, message: 'Failed to access or create cart' };
    }

    // Get product price
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    const price = product.price || 0;

    // Check if product already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: true,
        },
      });
    } else {
      // Add new item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          unitPrice: price,
        },
        include: {
          product: true,
        },
      });
    }

    // Update total cost
    await updateCartTotal(cart.id);

    // Revalidate the path to update UI
    revalidatePath(`/businesses/${businessId}`);
    
    return { 
      success: true,
      message: 'Product added to cart',
      cartItem,
    };
  } catch (error) {
    console.error('Error in addToCart:', error);
    return { success: false, message: 'Failed to add product to cart' };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  cartId: string,
  itemId: string,
  quantity: number
): Promise<{ success: boolean; message: string; cartItem?: CartItem }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    // Verify cart belongs to user
    const cart = await prisma.cart.findUnique({
      where: {
        id: cartId,
      },
    });

    if (!cart || cart.userId !== session.user.id) {
      return { success: false, message: 'Cart not found or access denied' };
    }

    // Find the cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
    });

    if (!existingItem) {
      return { success: false, message: 'Item not found in cart' };
    }

    let result;
    
    if (quantity <= 0) {
      // Remove item if quantity is zero or negative
      await prisma.cartItem.delete({
        where: {
          id: itemId,
        },
      });
      result = { success: true, message: 'Item removed from cart' };
    } else {
      // Update quantity
      const cartItem = await prisma.cartItem.update({
        where: {
          id: itemId,
        },
        data: {
          quantity,
        },
        include: {
          product: true,
        },
      });
      
      result = { 
        success: true, 
        message: 'Cart updated', 
        cartItem 
      };
    }

    // Update total cost
    await updateCartTotal(cartId);

    // Revalidate the path
    revalidatePath(`/businesses/${cart.businessId}`);
    
    return result;
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    return { success: false, message: 'Failed to update cart' };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  cartId: string,
  itemId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    // Verify cart belongs to user
    const cart = await prisma.cart.findUnique({
      where: {
        id: cartId,
      },
    });

    if (!cart || cart.userId !== session.user.id) {
      return { success: false, message: 'Cart not found or access denied' };
    }

    // Find the cart item
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId,
      },
    });

    if (!existingItem) {
      return { success: false, message: 'Item not found in cart' };
    }

    // Delete the item
    await prisma.cartItem.delete({
      where: {
        id: itemId,
      },
    });

    // Update total cost
    await updateCartTotal(cartId);

    // Revalidate the path
    revalidatePath(`/businesses/${cart.businessId}`);
    
    return { success: true, message: 'Item removed from cart' };
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return { success: false, message: 'Failed to remove item from cart' };
  }
}

/**
 * Update cart total cost
 */
async function updateCartTotal(cartId: string): Promise<void> {
  try {
    // Get all cart items
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId,
      },
    });

    // Calculate total cost
    const totalCost = cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    // Update cart with new total
    await prisma.cart.update({
      where: {
        id: cartId,
      },
      data: {
        totalCost,
      },
    });
  } catch (error) {
    console.error('Error updating cart total:', error);
  }
}

/**
 * Clear all items from a cart
 */
export async function clearCart(
  cartId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, message: 'Authentication required' };
    }

    // Verify cart belongs to user
    const cart = await prisma.cart.findUnique({
      where: {
        id: cartId,
      },
    });

    if (!cart || cart.userId !== session.user.id) {
      return { success: false, message: 'Cart not found or access denied' };
    }

    // Delete all items in cart
    await prisma.cartItem.deleteMany({
      where: {
        cartId,
      },
    });

    // Reset total cost
    await prisma.cart.update({
      where: {
        id: cartId,
      },
      data: {
        totalCost: 0,
      },
    });

    // Revalidate the path
    revalidatePath(`/businesses/${cart.businessId}`);
    
    return { success: true, message: 'Cart cleared successfully' };
  } catch (error) {
    console.error('Error in clearCart:', error);
    return { success: false, message: 'Failed to clear cart' };
  }
}