// app/api/admin/vendors/[id]/approve/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST — approve or reject a vendor application
// Body: { action: 'approve' | 'reject', reviewNote?: string }
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const applicationId = parseInt(id);
    const body = await request.json();
    const { action, reviewNote } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject".' }, { status: 400 });
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    }

    if (application.status === 'APPROVED') {
      return NextResponse.json({ error: 'Application is already approved.' }, { status: 400 });
    }

    if (action === 'reject') {
      await prisma.vendorApplication.update({
        where: { id: applicationId },
        data: {
          status: 'REJECTED',
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          reviewNote: reviewNote?.trim() || null,
        },
      });

      return NextResponse.json({ message: 'Application rejected.' });
    }

    // APPROVE — run as a transaction to keep everything consistent
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Vendor record
      const vendor = await tx.vendor.create({
        data: {
          userId: application.userId,
          name: application.businessName,
          slug: application.slug,
          tagline: application.tagline,
          description: application.description,
          website: application.website,
          logo: application.logo,
          coverImage: application.coverImage,
          location: application.location,
          phone: application.phone,
          twitterUrl: application.twitterUrl,
          instagramUrl: application.instagramUrl,
          facebookUrl: application.facebookUrl,
          linkedinUrl: application.linkedinUrl,
          status: 'ACTIVE',
          isVerified: false,
        },
      });

      // 2. Promote user role to 'vendor'
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'vendor' },
      });

      // 3. Update application — mark approved and link vendor record
      await tx.vendorApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          vendorId: vendor.id,
          reviewedAt: new Date(),
          reviewedBy: session.user.id,
          reviewNote: reviewNote?.trim() || null,
        },
      });

      return vendor;
    });

    return NextResponse.json({
      message: 'Vendor application approved. Vendor profile is now live.',
      vendor: result,
    });
  } catch (error) {
    console.error('Error processing vendor application:', error);
    return NextResponse.json({ error: 'Failed to process application.' }, { status: 500 });
  }
}