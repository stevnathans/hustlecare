import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId, name } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    // Find user's cart for this business
    const cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId: session.user.id,
          businessId,
        },
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    if (cart.items.length === 0) {
      return NextResponse.json({ error: 'Cannot finalize an empty cart' }, { status: 400 });
    }

    // Update cart's name and updatedAt timestamp
    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: {
        name: name || `Cart for business ${businessId}`,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: 'Cart finalized successfully', cart: updatedCart });
  } catch (error) {
    console.error('[CART_FINALIZE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
