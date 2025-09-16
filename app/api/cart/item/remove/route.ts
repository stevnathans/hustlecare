import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
    const { businessId, productId } = await request.json();
    
    if (!businessId || !productId) {
      return NextResponse.json(
        { error: 'Business ID and product ID are required' },
        { status: 400 }
      );
    }

    // Find the user's cart for this business
    const cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id as string,
          businessId: parseInt(businessId.toString()),
        },
      },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    // Find the cart item
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: parseInt(productId.toString()),
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    // Remove the item
    await prisma.cartItem.delete({
      where: {
        id: cartItem.id,
      },
    });

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

    // 🔧 FIX: Added category and requirementName fields
    const items = updatedCart?.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.unitPrice,
      quantity: item.quantity,
      image: item.product.image || undefined,
      category: item.category || "Uncategorized",                    // ✅ Added
      requirementName: item.requirementName || "Unspecified Requirement", // ✅ Added
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}