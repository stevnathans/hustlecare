// app/api/admin/vendors/route.ts  (updated — includes appeal fields)
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const applications = await prisma.vendorApplication.findMany({
      where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {},
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true, createdAt: true },
        },
        vendor: {
          select: {
            id: true,
            slug: true,
            status: true,
            suspendReason: true,
            suspendedAt: true,
            isVerified: true,
            createdAt: true,
            _count: {
              select: { products: true },  // total products
            },
            // We also want active-only count — use a separate relation filter
            products: {
              where: { status: 'ACTIVE' },
              select: { id: true },
            },

            // ── Suspension appeals ──────────────────────────────
            appealStatus: true,
            appealMessage: true,
            issueResolved: true,
            appealedAt: true,
            appealResponse: true,
            appealRespondedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Shape the response to include activeProducts as a number
    const shaped = applications.map(app => ({
      ...app,
      vendor: app.vendor
        ? {
            ...app.vendor,
            activeProducts: app.vendor.products.length,
            products: undefined, // remove the array, keep only the count
          }
        : null,
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 });
  }
}