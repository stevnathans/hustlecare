import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/cart?businessId=123
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the business ID from the query params
    const url = new URL(request.url);
    const businessId = url.searchParams.get('businessId');
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Get the user's cart for this business
    const cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id as string,
          businessId: parseInt(businessId),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // If cart doesn't exist yet, return empty items array
    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    // Transform cart items to the format expected by the client
    const items = cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      price: item.unitPrice,
      // Currency this line's price is in — snapshotted at add-time (see
      // /api/cart/item/add). Was missing here entirely, meaning a page
      // refresh silently dropped it even though it was persisted correctly.
      currency: item.currency,
      quantity: item.quantity,
      image: item.product.image || undefined,
      category: item.category || "Uncategorized",
      requirementName: item.requirementName || "Unspecified Requirement",
      // Same gap as currency — persisted on CartItem but not selected here.
      packageId: item.packageId ?? undefined,
      billingPeriodLabel: item.billingPeriodLabel ?? undefined,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}