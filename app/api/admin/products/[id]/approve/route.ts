// app/api/admin/products/[id]/approve/route.ts
// This is the ONLY route that can set a product to ACTIVE.
// Vendors cannot set their own products to ACTIVE.
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// POST body: { action: 'approve' | 'reject', rejectReason?: string }
export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const body = await request.json();
    const { action, rejectReason } = body;

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject".' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        template: {
          include: {
            businesses: { where: { isActive: true }, select: { businessId: true } },
          },
        },
      },
    });

    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    if (product.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: `Product status is "${product.status}" — only PENDING_REVIEW products can be reviewed.` },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      await prisma.product.update({
        where: { id: productId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectReason: rejectReason?.trim() || null,
        },
      });
      return NextResponse.json({ message: 'Product rejected.' });
    }

    // APPROVE — re-derive businessTags from current template links + any manual tags
    const autoTags = product.template?.businesses.map((b) => b.businessId) ?? [];
    const existingManualTags = product.businessTags.filter(
      (id) => !autoTags.includes(id)
    );
    const finalTags = [...new Set([...autoTags, ...existingManualTags])];

    await prisma.product.update({
      where: { id: productId },
      data: {
        status: 'ACTIVE',          // ← The ONLY place this is set
        publishedAt: new Date(),   // ← Set only here
        businessTags: finalTags,   // ← Refreshed on approval
        rejectedAt: null,
        rejectReason: null,
      },
    });

    return NextResponse.json({ message: 'Product approved and live in marketplace.' });
  } catch (error) {
    console.error('Error reviewing product:', error);
    return NextResponse.json({ error: 'Failed to process product review.' }, { status: 500 });
  }
}