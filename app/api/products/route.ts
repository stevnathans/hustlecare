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
      });
      return NextResponse.json(products);
    }

    // No filter — still only ACTIVE (used by admin catalog via ?admin=true above;
    // this path is only hit by public pages, so enforce the status guard).
    const products = await prisma.product.findMany({
      where:   { status: 'ACTIVE' },
      include: { vendor: true, template: { select: { id: true, name: true } } },
      orderBy: { price: 'asc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, image, url, vendorId, templateId } = body;

    // Products created directly via this admin endpoint are set to ACTIVE
    // immediately (admin-managed catalog, not vendor submissions).
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
        url,
        status:     'ACTIVE',
        publishedAt: new Date(),
        vendorId:   vendorId   ? parseInt(vendorId)   : null,
        templateId: templateId ? parseInt(templateId) : null,
      },
      include: {
        vendor:   true,
        template: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}