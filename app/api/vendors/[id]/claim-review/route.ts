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
    const { action, rejectionReason } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject".' }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { claimRequestedBy: { select: { id: true, name: true, email: true } } },
    });

    if (!vendor || vendor.claimStatus !== 'PENDING' || !vendor.claimRequestedById) {
      return NextResponse.json({ error: 'No pending claim on this vendor.' }, { status: 400 });
    }

    if (action === 'reject') {
      if (!rejectionReason?.trim()) {
        return NextResponse.json({ error: 'A reason is required to reject a claim.' }, { status: 400 });
      }
      await prisma.vendor.update({
        where: { id: vendorId },
        data: {
          claimStatus: 'REJECTED',
          claimReviewedAt: new Date(),
          claimReviewedBy: session.user.id,
          claimRejectionReason: rejectionReason.trim(),
        },
      });

      await notify({
        userId: vendor.claimRequestedById,
        title: 'Vendor claim not approved',
        message: `Your claim on "${vendor.name}" wasn't approved: ${rejectionReason.trim()}`,
        type: 'WARNING',
      });

      return NextResponse.json({ message: 'Claim rejected.' });
    }

    // APPROVE
    await prisma.$transaction(async (tx) => {
      await tx.vendor.update({
        where: { id: vendorId },
        data: {
          userId: vendor.claimRequestedById,
          claimStatus: 'NONE',
          claimRequestedById: null,
          claimMessage: null,
          claimReviewedAt: new Date(),
          claimReviewedBy: session.user.id,
          claimRejectionReason: null,
        },
      });
      await tx.user.update({
        where: { id: vendor.claimRequestedById! },
        data: { role: 'vendor' },
      });
    });

    await notify({
      userId: vendor.claimRequestedById,
      title: 'Vendor claim approved 🎉',
      message: `You now manage "${vendor.name}" on Hustlecare. Head to your vendor dashboard to get started.`,
      type: 'SUCCESS',
      link: '/vendor/dashboard',
    });

    return NextResponse.json({ message: 'Claim approved. Vendor profile handed over.' });
  } catch (error) {
    console.error('Error reviewing vendor claim:', error);
    return NextResponse.json({ error: 'Failed to process claim.' }, { status: 500 });
  }
}