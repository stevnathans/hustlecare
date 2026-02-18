import { NextRequest, NextResponse } from 'next/server';
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
    });
  } catch (error) {
    console.error('Error fetching shared business details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business details' },
      { status: 500 }
    );
  }
}