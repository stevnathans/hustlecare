/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/products/import/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { validateProductEnums, mapProductCreateFields, MAX_CSV_IMPORT_ROWS } from '@/lib/product-validation';

export async function POST(request: Request) {
  try {
    const user = await requirePermission('products.create');
    const body = await request.json();
    const { templateId, vendorId, products, publishImmediately } = body as {
      templateId: number | null; vendorId: number; products: Record<string, any>[]; publishImmediately?: boolean;
    };

    if (!vendorId) return NextResponse.json({ error: 'Please select a vendor for this batch.' }, { status: 400 });
    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products to import.' }, { status: 400 });
    }
    if (products.length > MAX_CSV_IMPORT_ROWS) {
      return NextResponse.json({ error: `Cannot import more than ${MAX_CSV_IMPORT_ROWS} products at once.` }, { status: 400 });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: Number(vendorId) }, select: { id: true } });
    if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 400 });

    let autoTags: number[] = [];
    if (templateId) {
      const template = await prisma.requirementTemplate.findUnique({
        where: { id: Number(templateId) },
        include: { businesses: { where: { isActive: true }, select: { businessId: true } } },
      });
      if (!template || template.isDeprecated) {
        return NextResponse.json({ error: 'Selected requirement does not exist or has been deprecated.' }, { status: 400 });
      }
      autoTags = template.businesses.map((b) => b.businessId);
    }

    const rowErrors: { row: number; error: string }[] = [];
    products.forEach((p, i) => {
      if (!p.name?.trim()) rowErrors.push({ row: i + 1, error: 'Missing product name.' });
      validateProductEnums(p).forEach((e) => rowErrors.push({ row: i + 1, error: e }));
    });
    if (rowErrors.length > 0) {
      return NextResponse.json({ error: 'Some rows failed validation.', rowErrors }, { status: 400 });
    }

    const status = publishImmediately ? 'ACTIVE' : 'PENDING_REVIEW';

    const created = await prisma.$transaction(
      products.map((p) =>
        prisma.product.create({
          data: {
            ...mapProductCreateFields(p),
            vendorId: Number(vendorId),
            templateId: templateId ? Number(templateId) : null,
            businessTags: autoTags,
            status,
            publishedAt: status === 'ACTIVE' ? new Date() : null,
          },
          select: { id: true, name: true },
        })
      )
    );

    await createAuditLog({
      action: 'CREATE',
      entity: 'Product',
      entityId: created.map((c) => c.id).join(','),
      changes: { batchSize: created.length, vendorId, status, createdBy: user.id },
    });

    return NextResponse.json({ imported: created.length, products: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error importing admin products:', error);
    return NextResponse.json({ error: 'Import failed. No products were created.' }, { status: 500 });
  }
}