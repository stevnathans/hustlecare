import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be logged in to remove a saved business' },
        { status: 401 }
      );
    }

    const { businessId } = await params;
    const parsedBusinessId = parseInt(businessId, 10);

    if (Number.isNaN(parsedBusinessId)) {
      return NextResponse.json(
        { error: 'Invalid business id' },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId: currentUser.id,
          businessId: parsedBusinessId,
        },
      },
      include: { items: true },
    });

    if (!cart) {
      return NextResponse.json(
        { error: 'Saved business not found' },
        { status: 404 }
      );
    }

    // Check whether this list has been shared publicly
    const sharedBusiness = await prisma.sharedBusiness.findUnique({
      where: {
        userId_businessId: {
          userId: currentUser.id,
          businessId: parsedBusinessId,
        },
      },
    });

    const wasShared = !!sharedBusiness?.isActive;

    // Deleting the cart cascades to its cart items
    await prisma.cart.delete({
      where: { id: cart.id },
    });

    // If this list was originally copied from someone else's shared list,
    // clear the copy record too. This is what "already copied" checks are
    // keyed off of, so without this the user would be permanently unable
    // to re-copy this business after removing it. We deliberately do NOT
    // touch copyCount on any SharedBusiness — that's a historical/public
    // stat and should keep reflecting that the copy happened at some point.
    await prisma.businessCopyActivity.deleteMany({
      where: {
        copiedByUserId: currentUser.id,
        sharedBusiness: { businessId: parsedBusinessId },
      },
    });

    // Delist from community (soft delete) instead of hard-deleting, so
    // copy activity / stats for anyone who already copied it are preserved
    // and unaffected.
    if (sharedBusiness && sharedBusiness.isActive) {
      await prisma.sharedBusiness.update({
        where: { id: sharedBusiness.id },
        data: { isActive: false },
      });
    }

    return NextResponse.json({
      success: true,
      itemsRemoved: cart.items.length,
      wasShared,
    });
  } catch (error) {
    console.error('Error removing saved business:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved business' },
      { status: 500 }
    );
  }
}