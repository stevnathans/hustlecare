// app/api/user/delete-account/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user data in the correct order to handle foreign key constraints
    // The schema shows ON DELETE CASCADE for most relations, but we'll be explicit
    
    await prisma.$transaction(async (tx) => {
      // Delete cart items first (they reference carts and products)
      await tx.cartItem.deleteMany({
        where: {
          cart: {
            userId: user.id
          }
        }
      });

      // Delete carts
      await tx.cart.deleteMany({
        where: { userId: user.id }
      });

      // Delete reviews
      await tx.review.deleteMany({
        where: { userId: user.id }
      });

      // Delete comments
      await tx.comment.deleteMany({
        where: { userId: user.id }
      });

      // Delete search logs
      await tx.searchLog.deleteMany({
        where: { userId: user.id }
      });

      // Delete sessions (NextAuth)
      await tx.session.deleteMany({
        where: { userId: user.id }
      });

      // Delete accounts (NextAuth)
      await tx.account.deleteMany({
        where: { userId: user.id }
      });

      // Delete businesses owned by user (if any)
      // First get business IDs to handle their dependencies
      const userBusinesses = await tx.business.findMany({
        where: { userId: user.id },
        select: { id: true }
      });

      if (userBusinesses.length > 0) {
        const businessIds = userBusinesses.map(b => b.id);

        // Delete comments on requirements of these businesses
        await tx.comment.deleteMany({
          where: {
            requirement: {
              businessId: { in: businessIds }
            }
          }
        });

        // Delete requirements of these businesses
        await tx.requirement.deleteMany({
          where: { businessId: { in: businessIds } }
        });

        // Delete search logs for these businesses
        await tx.searchLog.deleteMany({
          where: { businessId: { in: businessIds } }
        });

        // Delete the businesses
        await tx.business.deleteMany({
          where: { userId: user.id }
        });
      }

      // Finally, delete the user
      await tx.user.delete({
        where: { id: user.id }
      });
    });

    return NextResponse.json(
      { message: 'Account and all associated data deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting account:', error);

    return NextResponse.json(
      { error: 'Internal server error while deleting account' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}