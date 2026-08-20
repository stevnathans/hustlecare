import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { cartId } = await params;
   
    if (!cartId) {
      return NextResponse.json(
        { error: 'Cart ID is required' },
        { status: 400 }
      );
    }


    // Fetch the cart with its items and related business
    const cart = await prisma.cart.findUnique({
      where: {
        id: cartId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        business: true,
      },
    });


    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }


    // Transform cart data for the client
    const transformedCart = {
      id: cart.id,
      name: cart.name || `${cart.business.name} Cart`,
      businessName: cart.business.name,
      businessId: cart.businessId,
      // Was `cart.totalCost || ...`, which falls through to recomputing
      // from items whenever totalCost is a genuine 0 (e.g. an
      // all-free/productless cart), not just when it's null/undefined —
      // same class of truthiness bug fixed earlier in
      // /api/cart/save/route.ts. Explicit null/undefined check preserves
      // a real saved zero.
      totalCost: cart.totalCost !== null && cart.totalCost !== undefined
        ? cart.totalCost
        : cart.items.reduce(
            (sum, item) => sum + (item.unitPrice * item.quantity),
            0
          ),
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.unitPrice,
        // Currency this line's price is denominated in — was missing
        // entirely, so SharedCartPage always fell back to its KES
        // default regardless of the actual product's market.
        currency: item.currency,
        quantity: item.quantity,
        image: item.product.image || undefined,
        // Also previously dropped despite being on CartItem and used by
        // SharedCartPage's category grouping/badges.
        category: item.category || undefined,
        requirementName: item.requirementName || undefined,
      })),
    };


    return NextResponse.json(transformedCart);
  } catch (error) {
    console.error('Error fetching shared cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared cart' },
      { status: 500 }
    );
  }
}