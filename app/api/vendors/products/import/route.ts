/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/vendors/products/import/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateProductEnums, mapProductCreateFields, MAX_CSV_IMPORT_ROWS, MAX_PENDING_PRODUCTS_PER_VENDOR } from '@/lib/product-validation';

type VendorSessionUser = { id: string; role: string; vendorId?: string | null };

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as VendorSessionUser | undefined;
    if (!user?.id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    if (user.role !== 'vendor') return NextResponse.json({ error: 'Vendor access required.' }, { status: 403 });

    const vendorId = user.vendorId;
    const vendorIdNum = vendorId ? Number(vendorId) : undefined;
    if (!vendorIdNum) return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });

    const vendor = await prisma.vendor.findUnique({ where: { id: vendorIdNum }, select: { status: true, suspendReason: true } });
    if (!vendor) return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });
    if (vendor.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account is suspended. You cannot import products until reinstated.', code: 'VENDOR_SUSPENDED', suspendReason: vendor.suspendReason },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { templateId, products } = body as { templateId: number | null; products: Record<string, any>[] };

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'No products to import.' }, { status: 400 });
    }
    if (products.length > MAX_CSV_IMPORT_ROWS) {
      return NextResponse.json({ error: `Cannot import more than ${MAX_CSV_IMPORT_ROWS} products at once.` }, { status: 400 });
    }

    // Pending-queue cap — checked against the vendor's CURRENT pending count,
    // not just this batch, so repeated smaller imports can't sidestep it.
    const currentPending = await prisma.product.count({ where: { vendorId: vendorIdNum, status: 'PENDING_REVIEW' } });
    if (currentPending + products.length > MAX_PENDING_PRODUCTS_PER_VENDOR) {
      return NextResponse.json(
        { error: `This import would put you at ${currentPending + products.length} products awaiting review (limit ${MAX_PENDING_PRODUCTS_PER_VENDOR}). Wait for existing submissions to be reviewed, or import fewer at once.` },
        { status: 400 }
      );
    }

    // Resolve requirement + auto-tags once for the whole batch.
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

    // Validate every row up front — fail the whole batch with row-level
    // feedback rather than partially importing and leaving the vendor
    // guessing which rows silently failed.
    const rowErrors: { row: number; error: string }[] = [];
    products.forEach((p, i) => {
      if (!p.name?.trim()) rowErrors.push({ row: i + 1, error: 'Missing product name.' });
      const enumErrs = validateProductEnums(p);
      enumErrs.forEach((e) => rowErrors.push({ row: i + 1, error: e }));
    });
    if (rowErrors.length > 0) {
      return NextResponse.json({ error: 'Some rows failed validation.', rowErrors }, { status: 400 });
    }

    const created = await prisma.$transaction(
      products.map((p) =>
        prisma.product.create({
          data: {
            ...mapProductCreateFields(p),
            vendorId: vendorIdNum,
            templateId: templateId ? Number(templateId) : null,
            businessTags: autoTags,
            status: 'PENDING_REVIEW', // forced — CSV imports never skip review
            publishedAt: null,
          },
          select: { id: true, name: true },
        })
      )
    );

    return NextResponse.json({ imported: created.length, products: created }, { status: 201 });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json({ error: 'Import failed. No products were created.' }, { status: 500 });
  }
}