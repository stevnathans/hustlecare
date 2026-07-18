// app/api/admin/vendors/[id]/claim/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    const body = await request.json();
    const { action, rejectionReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject".' }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { claimRequestedBy: { select: { id: true, name: true, email: true } } },
    });

    if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
    if (vendor.claimStatus !== 'PENDING' || !vendor.claimRequestedById) {
      return NextResponse.json({ error: 'There is no pending claim on this vendor.' }, { status: 400 });
    }

    const claimant = vendor.claimRequestedBy;

    if (action === 'reject') {
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: 'A reason is required to reject a claim.' }, { status: 400 });
      }

      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          claimStatus: 'REJECTED',
          claimRejectionReason: rejectionReason.trim(),
          claimReviewedAt: new Date(),
          claimReviewedBy: session.user.id,
        },
      });

      if (claimant) {
        await notify({
          userId: claimant.id,
          title: 'Vendor claim not approved',
          message: `Your request to claim "${vendor.name}" was not approved: ${rejectionReason.trim()}`,
          type: 'WARNING',
          link: `/vendors/${vendor.slug}`,
        });
      }

      return NextResponse.json({ message: 'Claim rejected.' });
    }

    // APPROVE
    if (!claimant) {
      return NextResponse.json({ error: 'The account that requested this claim no longer exists.' }, { status: 400 });
    }

    // Re-check the claimant hasn't picked up another vendor profile since requesting.
    const claimantVendor = await prisma.vendor.findUnique({ where: { userId: claimant.id }, select: { id: true } });
    if (claimantVendor && claimantVendor.id !== vendorId) {
      return NextResponse.json({ error: 'This user already manages a different vendor profile.' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.vendor.update({
        where: { id: vendorId },
        data: {
          userId: claimant.id,
          claimStatus: 'NONE',
          claimedAt: new Date(),
          claimReviewedAt: new Date(),
          claimReviewedBy: session.user.id,
          claimRejectionReason: null,
        },
      });
      await tx.user.update({ where: { id: claimant.id }, data: { role: 'vendor' } });
      return updated;
    });

    await notify({
      userId: claimant.id,
      title: 'Vendor claim approved 🎉',
      message: `You're now the owner of "${result.name}". Manage its products and storefront from your vendor dashboard.`,
      type: 'SUCCESS',
      link: '/vendor/dashboard',
    });

    return NextResponse.json({ message: 'Claim approved. Vendor profile transferred.', vendor: result });
  } catch (error) {
    console.error('Error resolving vendor claim:', error);
    return NextResponse.json({ error: 'Failed to process claim.' }, { status: 500 });
  }
}