import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = await params;
    const { isShared } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userCart = await prisma.cart.findFirst({
      where: {
        businessId: parseInt(businessId),
        userId: user.id,
      },
      include: { business: true },
    });

    if (!userCart) {
      return NextResponse.json(
        { error: 'Business not found or access denied' },
        { status: 404 }
      );
    }

    let sharedBusiness = await prisma.sharedBusiness.findFirst({
      where: {
        userId: user.id,
        businessId: parseInt(businessId),
      },
    });

    if (isShared) {
      if (!sharedBusiness) {
        sharedBusiness = await prisma.sharedBusiness.create({
          data: {
            userId: user.id,
            businessId: parseInt(businessId),
            name: userCart.business.name,
            description: `${userCart.business.name} startup requirements`,
            isActive: true,
          },
        });
      } else {
        sharedBusiness = await prisma.sharedBusiness.update({
          where: { id: sharedBusiness.id },
          data: { isActive: true },
        });
      }
    } else {
      if (sharedBusiness) {
        await prisma.sharedBusiness.update({
          where: { id: sharedBusiness.id },
          data: { isActive: false },
        });
      }
    }

    return NextResponse.json({
      success: true,
      isShared,
      sharedBusinessId: sharedBusiness?.id,
    });
  } catch (error) {
    console.error('Error toggling share status:', error);
    return NextResponse.json(
      { error: 'Failed to update share status' },
      { status: 500 }
    );
  }
}