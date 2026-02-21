// app/api/user/delete-account/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      // ── User's own data ──────────────────────────────────────────────────

      // Cart items reference carts, so delete items first
      await tx.cartItem.deleteMany({
        where: { cart: { userId: user.id } },
      });

      await tx.cart.deleteMany({
        where: { userId: user.id },
      });

      await tx.review.deleteMany({
        where: { userId: user.id },
      });

      // Comments are now on BusinessRequirement, not Requirement.
      // The userId FK is still on Comment directly, so this is unchanged.
      await tx.comment.deleteMany({
        where: { userId: user.id },
      });

      await tx.searchLog.deleteMany({
        where: { userId: user.id },
      });

      // NextAuth
      await tx.session.deleteMany({
        where: { userId: user.id },
      });

      await tx.account.deleteMany({
        where: { userId: user.id },
      });

      // ── Businesses owned by the user ─────────────────────────────────────

      const userBusinesses = await tx.business.findMany({
        where: { userId: user.id },
        select: { id: true },
      });

      if (userBusinesses.length > 0) {
        const businessIds = userBusinesses.map((b) => b.id);

        // Comments cascade-delete from BusinessRequirement, which cascade-deletes
        // from Business. But we delete them explicitly here to be safe and clear.
        // Comment → BusinessRequirement.businessId → business
        await tx.comment.deleteMany({
          where: {
            businessRequirement: {
              businessId: { in: businessIds },
            },
          },
        });

        // BusinessRequirement links for these businesses
        // (cascade would handle this too, but explicit is clearer)
        await tx.businessRequirement.deleteMany({
          where: { businessId: { in: businessIds } },
        });

        // Search logs tied to these businesses
        await tx.searchLog.deleteMany({
          where: { businessId: { in: businessIds } },
        });

        // SharedBusiness records and their copy activity (cascade handles copies)
        await tx.sharedBusiness.deleteMany({
          where: { businessId: { in: businessIds } },
        });

        await tx.business.deleteMany({
          where: { userId: user.id },
        });
      }

      // ── Community sharing activity by this user ───────────────────────────

      await tx.businessCopyActivity.deleteMany({
        where: { copiedByUserId: user.id },
      });

      await tx.sharedBusiness.deleteMany({
        where: { userId: user.id },
      });

      // ── Audit logs ────────────────────────────────────────────────────────

      await tx.auditLog.deleteMany({
        where: { userId: user.id },
      });

      // ── Finally, the user record itself ──────────────────────────────────

      await tx.user.delete({
        where: { id: user.id },
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
  }
}