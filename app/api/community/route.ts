import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sort = searchParams.get('sort') || 'trending';

    type OrderBy = { createdAt?: 'desc' | 'asc' } | { viewCount?: 'desc' | 'asc' } | { copyCount?: 'desc' | 'asc' };
    let orderBy: OrderBy = { viewCount: 'desc' };
    switch (sort) {
      case 'recent':
        orderBy = { createdAt: 'desc' };
        break;
      case 'popular':
        orderBy = { viewCount: 'desc' };
        break;
      case 'mostCopied':
        orderBy = { copyCount: 'desc' };
        break;
      case 'trending':
      default:
        orderBy = { viewCount: 'desc' };
        break;
    }

    const sharedBusinesses = await prisma.sharedBusiness.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
      orderBy,
      take: 50,
    });

    const businessesWithDetails = await Promise.all(
      sharedBusinesses.map(async (shared) => {
        const cartItems = await prisma.cartItem.findMany({
          where: {
            cart: {
              userId: shared.userId,
              businessId: shared.businessId,
            },
          },
          include: { product: true },
        });

        const totalCost = cartItems.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );

        const categories = Array.from(
          new Set(cartItems.map((item) => item.category).filter(Boolean))
        );

        return {
          id: shared.id.toString(),
          name: shared.name,
          description: shared.description,
          totalCost,
          itemsCount: cartItems.length,
          sharedAt: shared.createdAt.toISOString(),
          viewCount: shared.viewCount,
          copyCount: shared.copyCount,
          slug: shared.business.slug,
          author: {
            name: shared.user.name || 'Anonymous',
            avatar: shared.user.image || undefined,
            verified: false,
          },
          categories,
        };
      })
    );

    return NextResponse.json({
      businesses: businessesWithDetails,
      count: businessesWithDetails.length,
    });
  } catch (error) {
    console.error('Error fetching community businesses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared businesses' },
      { status: 500 }
    );
  }
}