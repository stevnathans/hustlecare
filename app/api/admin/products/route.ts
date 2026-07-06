/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/products/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { validateProductEnums, validateBulkPricing, mapProductCreateFields } from '@/lib/product-validation';

const VALID_STATUSES = new Set(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'ARCHIVED']);

export async function GET(request: Request) {
  try {
    await requirePermission('products.view');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${[...VALID_STATUSES].join(', ')}` },
        { status: 400 }
      );
    }

    const products = await prisma.product.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        vendor: true,
        template: { select: { id: true, name: true, category: true } },
        bulkPricing: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return NextResponse.json(products);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching admin products:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
}

// POST — admin-authored product. Every product still needs a vendor
// (house vendor or a real vendor the admin is managing on their behalf).
export async function POST(request: Request) {
  try {
    const user = await requirePermission('products.create');

    const body = await request.json();
    const { templateId, vendorId, businessTags, bulkPricing, publishImmediately } = body;

    if (!body.name?.trim()) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    if (!templateId) return NextResponse.json({ error: 'Please select a requirement this product fulfils.' }, { status: 400 });
    if (!vendorId) return NextResponse.json({ error: 'Please select a vendor. Use the house vendor if this is a platform-managed product.' }, { status: 400 });

    const enumErrors = validateProductEnums(body);
    if (enumErrors.length) return NextResponse.json({ error: enumErrors[0] }, { status: 400 });

    const { errors: bulkErrors, tiers } = validateBulkPricing(bulkPricing);
    if (bulkErrors.length) return NextResponse.json({ error: bulkErrors[0] }, { status: 400 });

    const vendor = await prisma.vendor.findUnique({ where: { id: Number(vendorId) }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 400 });

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(templateId) },
      include: { businesses: { where: { isActive: true }, select: { businessId: true } } },
    });
    if (!template || template.isDeprecated) {
      return NextResponse.json({ error: 'Selected requirement does not exist or has been deprecated.' }, { status: 400 });
    }

    const autoTags = template.businesses.map((b) => b.businessId);
    const manualTags: number[] = Array.isArray(businessTags) ? businessTags : [];
    const finalTags = [...new Set([...autoTags, ...manualTags])];

    // Admins can publish straight to ACTIVE — no need to review your own content.
    const status = publishImmediately ? 'ACTIVE' : (body.status && VALID_STATUSES.has(body.status) ? body.status : 'DRAFT');

    const product = await prisma.product.create({
      data: {
        ...mapProductCreateFields(body),
        vendorId: Number(vendorId),
        templateId: Number(templateId),
        businessTags: finalTags,
        status,
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        ...(tiers.length > 0 ? { bulkPricing: { create: tiers } } : {}),
      },
      include: {
        template: { select: { id: true, name: true, category: true } },
        vendor: { select: { id: true, name: true, slug: true, logo: true } },
        bulkPricing: true,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id.toString(),
      changes: { name: product.name, vendorId: product.vendorId, status: product.status, createdBy: user.id },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating admin product:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}