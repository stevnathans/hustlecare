import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get request body
    const { businessId, product } = await request.json();
    
    if (!businessId || !product || !product.productId) {
      return NextResponse.json(
        { error: 'Business ID and product details are required' },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // Find or create cart for this user and business
    let cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: parseInt(businessId.toString()),
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          businessId: parseInt(businessId.toString()),
        },
      });
    }

    // Check if this product is already in the cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: product.productId,
      },
    });

    if (existingItem) {
      // Update quantity if item already exists
      await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: {
            increment: 1,
          },
        },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.productId,
          quantity: 1,
          unitPrice: product.price,
          category: product.category || "Uncategorized",
          requirementName: product.requirementName || "Unspecified Requirement",
        },
      });
    }

    // Return updated cart items
    const updatedCart = await prisma.cart.findUnique({
      where: {
        id: cart.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const items = updatedCart?.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.unitPrice,
      quantity: item.quantity,
      image: item.product.image || undefined,
      category: item.category || "Uncategorized",
      requirementName: item.requirementName || "Unspecified Requirement",
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}