import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sharedBusinessId: string }> }
) {
  try {
    const { sharedBusinessId } = await params;

    const sharedBusiness = await prisma.sharedBusiness.findUnique({
      where: {
        id: parseInt(sharedBusinessId),
        isActive: true,
      },
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
            image: true,
          },
        },
      },
    });

    if (!sharedBusiness) {
      return NextResponse.json(
        { error: 'Shared business not found' },
        { status: 404 }
      );
    }

    await prisma.sharedBusiness.update({
      where: { id: sharedBusiness.id },
      data: { viewCount: { increment: 1 } },
    });

    // If the visitor is logged in, work out whether this is their own
    // shared list, or one they've already copied, so the client can render
    // the right button/notice state immediately instead of finding out via
    // a failed copy attempt.
    const session = await getServerSession(authOptions);
    let isOwnList = false;
    let alreadyCopied = false;
    if (session?.user?.email) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (currentUser) {
        isOwnList = currentUser.id === sharedBusiness.userId;

        if (!isOwnList) {
          const copyActivity = await prisma.businessCopyActivity.findFirst({
            where: {
              sharedBusinessId: sharedBusiness.id,
              copiedByUserId: currentUser.id,
            },
          });
          alreadyCopied = !!copyActivity;
        }
      }
    }

    const cartItems = await prisma.cartItem.findMany({
      where: {
        cart: {
          userId: sharedBusiness.userId,
          businessId: sharedBusiness.businessId,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            image: true,
            url: true,
          },
        },
      },
      orderBy: { category: 'asc' },
    });

    const itemsByCategory = cartItems.reduce((acc, item) => {
      const category = item.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        id: item.id,
        name: item.product?.name || 'Unknown',
        price: item.unitPrice,
        quantity: item.quantity,
        image: item.product?.image,
        requirementName: item.requirementName,
        productDetails: item.product,
      });
      return acc;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }, {} as Record<string, any[]>);

    const totalCost = cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const categories = Object.keys(itemsByCategory).sort();

    return NextResponse.json({
      id: sharedBusiness.id.toString(),
      name: sharedBusiness.name,
      description: sharedBusiness.description,
      business: {
        id: sharedBusiness.business.id,
        name: sharedBusiness.business.name,
        slug: sharedBusiness.business.slug,
        description: sharedBusiness.business.description,
        image: sharedBusiness.business.image,
      },
      author: {
        name: sharedBusiness.user.name || 'Anonymous',
        avatar: sharedBusiness.user.image || undefined,
        verified: false,
      },
      stats: {
        viewCount: sharedBusiness.viewCount + 1,
        copyCount: sharedBusiness.copyCount,
        totalItems,
        totalCost,
      },
      sharedAt: sharedBusiness.createdAt.toISOString(),
      categories,
      itemsByCategory,
      viewerStatus: {
        isOwnList,
        alreadyCopied,
      },
    });
  } catch (error) {
    console.error('Error fetching shared business details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business details' },
      { status: 500 }
    );
  }
}