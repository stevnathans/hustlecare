import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {prisma} from '@/lib/prisma';

export async function GET(
  req: Request, 
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { businessId } = await params;
    if (!businessId) {
      return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
    }

    const userId = session.user.id;

    const cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId,
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

    if (!cart) {
      return NextResponse.json({ cart: null }, { status: 200 });
    }

    return NextResponse.json({ cart });
  } catch (error) {
    console.error('[CART_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}