// app/api/vendors/products/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type VendorSessionUser = {
  id: string;
  role: string;
  vendorId?: string | null;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as VendorSessionUser | undefined;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (user.role !== 'vendor') return NextResponse.json({ error: 'Vendor access required.' }, { status: 403 });

    const vendorId = user.vendorId;
    const vendorIdNum = vendorId ? (typeof vendorId === 'string' ? parseInt(vendorId, 10) : vendorId) : undefined;
    if (!vendorId) return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const products = await prisma.product.findMany({
      where: {
        vendorId: vendorIdNum,
        ...(status ? { status: status as 'DRAFT' | 'PENDING_REVIEW' | 'ACTIVE' | 'REJECTED' | 'ARCHIVED' } : {}),
      },
      include: {
        template: { select: { id: true, name: true, category: true } },
        _count: { select: { reviews: true, cartItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as VendorSessionUser | undefined;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (user.role !== 'vendor') return NextResponse.json({ error: 'Vendor access required.' }, { status: 403 });

    const vendorId = user.vendorId;
    const vendorIdNum = vendorId ? (typeof vendorId === 'string' ? parseInt(vendorId, 10) : vendorId) : undefined;
    if (!vendorId) return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });

    // ── Suspension check ───────────────────────────────────────────────────────
    // Suspended vendors cannot create new products until reinstated by an admin.
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorIdNum as number },
      select: { status: true, suspendReason: true },
    });

    if (!vendor) return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });

    if (vendor.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          error: 'Your account is currently suspended. You cannot add new products until your account is reinstated.',
          code: 'VENDOR_SUSPENDED',
          suspendReason: vendor.suspendReason,
        },
        { status: 403 }
      );
    }
    // ──────────────────────────────────────────────────────────────────────────

    const body = await request.json();
    const {
      name, description, price, priceMin, priceMax, currency,
      image, url, sku, stock, templateId, businessTags,
      submitForReview,
    } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    if (!templateId) return NextResponse.json({ error: 'Please select a requirement this product fulfils.' }, { status: 400 });

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(templateId) },
      include: {
        businesses: { where: { isActive: true }, select: { businessId: true } },
      },
    });

    if (!template || template.isDeprecated) {
      return NextResponse.json({ error: 'Selected requirement does not exist or has been deprecated.' }, { status: 400 });
    }

    const autoTags = template.businesses.map((b) => b.businessId);
    const manualTags: number[] = Array.isArray(businessTags) ? businessTags : [];
    const finalTags = [...new Set([...autoTags, ...manualTags])];

    const status = submitForReview === true ? 'PENDING_REVIEW' : 'DRAFT';

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: price !== undefined && price !== null ? Number(price) : null,
        priceMin: priceMin !== undefined && priceMin !== null ? Number(priceMin) : null,
        priceMax: priceMax !== undefined && priceMax !== null ? Number(priceMax) : null,
        currency: currency || 'KES',
        image: image?.trim() || null,
        url: url?.trim() || null,
        sku: sku?.trim() || null,
        stock: stock !== undefined && stock !== null ? Number(stock) : null,
        vendorId: vendorIdNum,
        templateId: Number(templateId),
        businessTags: finalTags,
        status,
        publishedAt: null,
      },
      include: {
        template: { select: { id: true, name: true, category: true } },
        vendor: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}