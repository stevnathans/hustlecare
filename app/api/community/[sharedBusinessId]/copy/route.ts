import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sharedBusinessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to copy a business' },
        { status: 401 }
      );
    }

    const { sharedBusinessId } = await params;

    const sharedBusiness = await prisma.sharedBusiness.findUnique({
      where: {
        id: parseInt(sharedBusinessId),
        isActive: true,
      },
      include: {
        business: true,
        user: true,
      },
    });

    if (!sharedBusiness) {
      return NextResponse.json(
        { error: 'Shared business not found' },
        { status: 404 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent copying your own list
    if (currentUser.id === sharedBusiness.userId) {
      return NextResponse.json(
        { error: 'You cannot copy your own list', code: 'OWN_LIST' },
        { status: 400 }
      );
    }

    // Check if the user has already copied this list
    // We detect this by checking if the user already has a cart for this business
    // that was populated from this shared list. We track this via a CopiedBusiness
    // record if your schema has one, or fall back to checking if a cart already exists.
    // Using a simple approach: check if cart already exists for this business+user combo.
    const existingCart = await prisma.cart.findFirst({
      where: {
        userId: currentUser.id,
        businessId: sharedBusiness.businessId,
      },
      include: { items: true },
    });

    if (existingCart && existingCart.items.length > 0) {
      return NextResponse.json(
        {
          error: 'You have already copied this list',
          code: 'ALREADY_COPIED',
          businessSlug: sharedBusiness.business.slug,
        },
        { status: 400 }
      );
    }

    // Create or reuse the cart
    const userCart =
      existingCart ||
      (await prisma.cart.create({
        data: {
          userId: currentUser.id,
          businessId: sharedBusiness.businessId,
        },
      }));

    const originalCartItems = await prisma.cartItem.findMany({
      where: {
        cart: {
          userId: sharedBusiness.userId,
          businessId: sharedBusiness.businessId,
        },
      },
    });

    // Clear existing items (empty cart case) and copy new ones
    await prisma.cartItem.deleteMany({
      where: { cartId: userCart.id },
    });

    const newCartItems = await Promise.all(
      originalCartItems.map((item) =>
        prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            category: item.category,
            requirementName: item.requirementName,
          },
        })
      )
    );

    await prisma.sharedBusiness.update({
      where: { id: sharedBusiness.id },
      data: { copyCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      message: 'Business copied successfully',
      newBusinessSlug: sharedBusiness.business.slug,
      itemsCopied: newCartItems.length,
    });
  } catch (error) {
    console.error('Error copying business:', error);
    return NextResponse.json(
      { error: 'Failed to copy business' },
      { status: 500 }
    );
  }
}