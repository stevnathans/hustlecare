// app/api/vendors/[id]/claim/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Please sign in to claim this vendor profile.' }, { status: 401 });
    }

    const { id } = await params;
    const vendorId = parseInt(id);
    const body = await request.json().catch(() => ({}));
    const message: string | undefined = body?.message?.trim();

    const [vendor, existingProfile] = await Promise.all([
      prisma.vendor.findUnique({ where: { id: vendorId } }),
      prisma.vendor.findUnique({ where: { userId: session.user.id }, select: { id: true } }),
    ]);

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });
    }
    if (vendor.userId) {
      return NextResponse.json({ error: 'This vendor profile has already been claimed.' }, { status: 400 });
    }
    if (vendor.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'This vendor profile is not available to claim.' }, { status: 400 });
    }
    if (existingProfile) {
      return NextResponse.json(
        { error: 'You already manage a vendor profile. Each account can only manage one.' },
        { status: 400 }
      );
    }
    if (vendor.claimStatus === 'PENDING') {
      return NextResponse.json({ error: 'A claim for this vendor is already pending review.' }, { status: 400 });
    }

    await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        claimStatus: 'PENDING',
        claimRequestedById: session.user.id,
        claimMessage: message || null,
        claimRejectionReason: null,
        claimReviewedAt: null,
        claimReviewedBy: null,
      },
    });

    return NextResponse.json({ message: 'Claim submitted. Our team will review it shortly.' });
  } catch (error) {
    console.error('Error submitting vendor claim:', error);
    return NextResponse.json({ error: 'Failed to submit claim.' }, { status: 500 });
  }
}