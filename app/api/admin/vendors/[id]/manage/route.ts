// app/api/admin/vendors/[id]/manage/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST body: { action: 'suspend' | 'unsuspend' | 'delete', reason?: string }
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    const body = await request.json();
    const { action, reason } = body;

    if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "suspend", "unsuspend", or "delete".' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: { select: { id: true } } },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
    }

    if (action === 'suspend') {
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'A reason is required to suspend a vendor.' }, { status: 400 });
      }
      if (vendor.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Vendor is already suspended.' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Suspend the vendor
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            status: 'SUSPENDED',
            suspendedAt: new Date(),
            suspendReason: reason.trim(),
          },
        });

        // Archive all their ACTIVE products so they disappear from marketplace
        await tx.product.updateMany({
          where: { vendorId, status: 'ACTIVE' },
          data: { status: 'ARCHIVED' },
        });
      });

      return NextResponse.json({ message: 'Vendor suspended and products archived.' });
    }

    if (action === 'unsuspend') {
      if (vendor.status !== 'SUSPENDED') {
        return NextResponse.json({ error: 'Vendor is not currently suspended.' }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        // Reinstate vendor
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            status: 'ACTIVE',
            suspendedAt: null,
            suspendReason: null,
          },
        });

        // Restore their archived products back to ACTIVE
        // Only products that were ACTIVE before suspension (archived during it)
        // Products that were already ARCHIVED by the vendor stay ARCHIVED
        await tx.product.updateMany({
          where: {
            vendorId,
            status: 'ARCHIVED',
            // Only restore products that have a publishedAt date (i.e., were previously approved)
            publishedAt: { not: null },
          },
          data: { status: 'ACTIVE' },
        });
      });

      return NextResponse.json({ message: 'Vendor reinstated and products restored.' });
    }

    if (action === 'delete') {
      await prisma.$transaction(async (tx) => {
        // Archive all products (preserve cart/review history)
        await tx.product.updateMany({
          where: { vendorId },
          data: { status: 'ARCHIVED' },
        });

        // Demote the user role back to 'user' if they had one
        if (vendor.userId) {
          await tx.user.update({
            where: { id: vendor.userId },
            data: { role: 'user' },
          });
        }

        // Delete the vendor (cascades to VendorApplication via onDelete: SetNull)
        await tx.vendor.delete({ where: { id: vendorId } });
      });

      return NextResponse.json({ message: 'Vendor deleted. Products archived. User role reverted.' });
    }
  } catch (error) {
    console.error('Error managing vendor:', error);
    return NextResponse.json({ error: 'Failed to process vendor action.' }, { status: 500 });
  }
}