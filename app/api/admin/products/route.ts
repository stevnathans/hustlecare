// app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

// FIX: Whitelist valid status values. Previously the raw query param string was
// cast directly to the Prisma enum type with no validation — an unexpected value
// would cause a Prisma error that bubbles up as a 500 rather than a clean 400.
// It also prevented callers from probing what status values exist.
const VALID_STATUSES = new Set(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'ARCHIVED']);

export async function GET(request: Request) {
  try {
    // FIX: Replaced manual getServerSession + role check with requirePermission,
    // consistent with every other admin route. Same stale-role risk as approve
    // route — session.user.role comes from the JWT, not a fresh DB read.
    await requirePermission('products.view');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // FIX: Reject unrecognised status values with a clear 400.
    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(', ')}` },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where:   status ? { status: status as 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED' } : undefined,
      include: {
        vendor:   true,
        template: { select: { id: true, name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      // FIX: Added a result cap. Without this, an admin listing all products
      // with no status filter returns every row in the table in one response.
      take: 200,
    });

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error('Error fetching admin products:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
}