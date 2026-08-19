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
    const { businessId, name, totalCost } = await request.json();
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
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
      include: {
        items: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Update the cart with a name and total cost for sharing
    const updatedCart = await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        name: name || `Business ${businessId} Cart`,
        // Was `totalCost || null` — a genuinely $0 total (e.g. an
        // all-free/productless cart) would fail the truthiness check and
        // get silently stored as null instead of 0. Explicit null/undefined
        // check preserves a real zero.
        totalCost: totalCost === null || totalCost === undefined ? null : totalCost,
      },
    });

    return NextResponse.json({ 
      success: true, 
      cartId: updatedCart.id
    });
  } catch (error) {
    console.error('Error saving cart:', error);
    return NextResponse.json(
      { error: 'Failed to save cart' },
      { status: 500 }
    );
  }
}