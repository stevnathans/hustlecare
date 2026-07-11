import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

    // Community browsing doesn't require auth, but if the visitor is
    // logged in we use their identity to flag which listed templates are
    // their own and which they've already copied, so the UI can render the
    // right state up front instead of the visitor discovering it via a
    // failed copy attempt.
    const session = await getServerSession(authOptions);
    let currentUserId: string | null = null;
    if (session?.user?.email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      currentUserId = currentUser?.id ?? null;
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

    // Batch-fetch which of these the current viewer has already copied,
    // rather than querying per-card.
    let copiedSharedBusinessIds = new Set<number>();
    if (currentUserId) {
      const activities = await prisma.businessCopyActivity.findMany({
        where: {
          copiedByUserId: currentUserId,
          sharedBusinessId: { in: sharedBusinesses.map((s) => s.id) },
        },
        select: { sharedBusinessId: true },
      });
      copiedSharedBusinessIds = new Set(activities.map((a) => a.sharedBusinessId));
    }

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
          isOwnList: currentUserId === shared.userId,
          alreadyCopied: copiedSharedBusinessIds.has(shared.id),
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