// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('templateId');
    const adminMode  = url.searchParams.get('admin') === 'true';

    // ── Admin mode: return ALL products regardless of status ─────────────
    // Requires an authenticated admin session.
    if (adminMode) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
      }

      const products = await prisma.product.findMany({
        include: {
          vendor:   true,
          template: { select: { id: true, name: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      });
      return NextResponse.json(products);
    }

    // ── Public: ACTIVE products only ─────────────────────────────────────
    if (templateId) {
      const products = await prisma.product.findMany({
        where: {
          templateId: Number(templateId),
          status:     'ACTIVE',          // ← only live products
        },
        include: { vendor: true },
        orderBy: { price: 'asc' },
        take: 200,
      });
      return NextResponse.json(products);
    }

    // No filter — still only ACTIVE (used by admin catalog via ?admin=true above;
    // this path is only hit by public pages, so enforce the status guard).
    const products = await prisma.product.findMany({
      where:   { status: 'ACTIVE' },
      include: { vendor: true, template: { select: { id: true, name: true } } },
      orderBy: { price: 'asc' },
      take: 200,
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST removed — creation now happens exclusively via:
//   - /api/vendors/products      (vendor self-service, PENDING_REVIEW)
//   - /api/admin/products        (admin-authored, requires vendor + requirement)
// This route bypassed review entirely, skipped every enum/schema validation
// added since the original 5-field Product model, and had no auth check
// (anyone could create ACTIVE products with no login). Do not reintroduce
// a POST handler here — add new product-creation needs to one of the two
// routes above instead.