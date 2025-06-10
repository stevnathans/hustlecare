import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const carts = await prisma.cart.findMany({
      where: { userId: user.id },
      include: {
        business: {
          select: { id: true, name: true, image: true, slug: true },
        },
        items: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const formattedLists = carts.map((cart) => ({
      cartId: cart.id,
      businessId: cart.business.id,
      businessName: cart.business.name,
      businessImage: cart.business.image,
      businessSlug: cart.business.slug,
      totalItems: cart.items.length,
      totalCost: cart.totalCost ?? 0,
      updatedAt: cart.updatedAt,
    }));

    return NextResponse.json({ lists: formattedLists });
  } catch (error) {
    console.error('Error fetching profile lists:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
