import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { cartId: string } }
) {
  try {
    const cartId = params.cartId;
    
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
      totalCost: cart.totalCost || cart.items.reduce(
        (sum, item) => sum + (item.unitPrice * item.quantity), 
        0
      ),
      items: cart.items.map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        price: item.unitPrice,
        quantity: item.quantity,
        image: item.product.image || undefined,
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