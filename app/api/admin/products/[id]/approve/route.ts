// app/api/admin/products/[id]/approve/route.ts
// This is the ONLY route that can set a product to ACTIVE.
// Vendors cannot set their own products to ACTIVE.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

type Params = { params: Promise<{ id: string }> };

// FIX: Validate route param consistently with other routes.
function parseId(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const VALID_ACTIONS = new Set(['approve', 'reject']);

// POST body: { action: 'approve' | 'reject', rejectReason?: string }
export async function POST(request: Request, { params }: Params) {
  try {
    // FIX: Replaced manual getServerSession + role check with requirePermission,
    // consistent with every other admin route. The previous pattern checked
    // session.user.role === 'admin' directly from the session object rather than
    // re-fetching from the DB, meaning a recently-demoted admin could still
    // approve products until their token expired. requirePermission re-fetches
    // from DB on every call via getCurrentUser() in admin-utils.
    const user = await requirePermission('products.update');

    const { id } = await params;
    const productId = parseId(id);
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 });
    }

    const body = await request.json();
    const { action, rejectReason } = body;

    // FIX: Use Set lookup instead of array includes for action validation.
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject".' }, { status: 400 });
    }

    // FIX: Validate rejectReason length when provided.
    if (action === 'reject' && rejectReason && String(rejectReason).length > 1000) {
      return NextResponse.json({ error: 'Reject reason must be 1000 characters or fewer.' }, { status: 400 });
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

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

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
          status:       'REJECTED',
          rejectedAt:   new Date(),
          rejectReason: rejectReason ? String(rejectReason).trim().slice(0, 1000) : null,
        },
      });

      // FIX: Added audit log — previously neither approve nor reject was logged,
      // meaning there was no record of who reviewed a product and when.
      await createAuditLog({
        action:   'REJECT',
        entity:   'Product',
        entityId: productId.toString(),
        changes:  { rejectReason: rejectReason?.trim() || null, reviewedBy: user.id },
      });

      return NextResponse.json({ message: 'Product rejected.' });
    }

    // APPROVE
    const autoTags   = product.template?.businesses.map((b) => b.businessId) ?? [];
    const manualTags = product.businessTags.filter((id) => !autoTags.includes(id));
    const finalTags  = [...new Set([...autoTags, ...manualTags])];

    await prisma.product.update({
      where: { id: productId },
      data: {
        status:       'ACTIVE',
        publishedAt:  new Date(),
        businessTags: finalTags,
        rejectedAt:   null,
        rejectReason: null,
      },
    });

    await createAuditLog({
      action:   'APPROVE',
      entity:   'Product',
      entityId: productId.toString(),
      changes:  { businessTags: finalTags, reviewedBy: user.id },
    });

    return NextResponse.json({ message: 'Product approved and live in marketplace.' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error('Error reviewing product:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to process product review.' }, { status: 500 });
  }
}