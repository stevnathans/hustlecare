// /api/cart/clear-category/route.ts
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
    const { businessId, category } = await request.json();
   
    if (!businessId || !category) {
      return NextResponse.json(
        { error: 'Business ID and category are required' },
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
      // Cart doesn't exist, nothing to clear
      return NextResponse.json({ items: [] });
    }

    // Delete all cart items for this category
    await prisma.cartItem.deleteMany({
      where: {
        cartId: cart.id,
        category: category,
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
    console.error('Error clearing category:', error);
    return NextResponse.json(
      { error: 'Failed to clear category' },
      { status: 500 }
    );
  }
}