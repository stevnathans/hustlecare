/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/vendor/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

async function getOwnedProduct(productId: number, vendorId: number) {
  return prisma.product.findFirst({
    where: { id: productId, vendorId },
  });
}

// GET — fetch a single product (vendor must own it)
export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    const vendorId = (session?.user as any)?.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    const { id } = await params;
    const product = await getOwnedProduct(parseInt(id), vendorId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product.' }, { status: 500 });
  }
}

// PATCH — update product (only allowed if DRAFT or REJECTED)
export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    const vendorId = (session?.user as any)?.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const existing = await getOwnedProduct(productId, vendorId);

    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    // Vendors can only edit products that are not under review or active
    // (they must archive first, then edit)
    const editableStatuses = ['DRAFT', 'REJECTED'];
    if (!editableStatuses.includes(existing.status)) {
      return NextResponse.json(
        {
          error: `Cannot edit a product with status "${existing.status}". Archive it first if you need to make changes.`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      price,
      priceMin,
      priceMax,
      currency,
      image,
      url,
      sku,
      stock,
      templateId,
      businessTags,
      submitForReview,
    } = body;

    // If template is changing, recalculate businessTags
    let finalTags = existing.businessTags;
    const targetTemplateId = templateId ?? existing.templateId;

    if (templateId && templateId !== existing.templateId) {
      const template = await prisma.requirementTemplate.findUnique({
        where: { id: templateId },
        include: {
          businesses: { where: { isActive: true }, select: { businessId: true } },
        },
      });
      if (!template || template.isDeprecated) {
        return NextResponse.json({ error: 'Invalid requirement template.' }, { status: 400 });
      }
      const autoTags = template.businesses.map((b) => b.businessId);
      const manualTags: number[] = Array.isArray(businessTags) ? businessTags : [];
      finalTags = [...new Set([...autoTags, ...manualTags])];
    } else if (Array.isArray(businessTags)) {
      // Same template, just updating manual tags
      const template = await prisma.requirementTemplate.findUnique({
        where: { id: targetTemplateId! },
        include: {
          businesses: { where: { isActive: true }, select: { businessId: true } },
        },
      });
      const autoTags = template?.businesses.map((b) => b.businessId) ?? [];
      finalTags = [...new Set([...autoTags, ...businessTags])];
    }

    const newStatus = submitForReview ? 'PENDING_REVIEW' : existing.status;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name?.trim() || undefined,
        description: description?.trim() ?? undefined,
        price: price !== undefined ? Number(price) : undefined,
        priceMin: priceMin !== undefined ? Number(priceMin) : undefined,
        priceMax: priceMax !== undefined ? Number(priceMax) : undefined,
        currency: currency || undefined,
        image: image?.trim() ?? undefined,
        url: url?.trim() ?? undefined,
        sku: sku?.trim() ?? undefined,
        stock: stock !== undefined ? Number(stock) : undefined,
        templateId: templateId || undefined,
        businessTags: finalTags,
        status: newStatus,
        // Clear rejection data if resubmitting
        ...(submitForReview
          ? { rejectedAt: null, rejectReason: null }
          : {}),
      },
      include: {
        template: { select: { id: true, name: true, category: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

// DELETE — archive (soft) or hard-delete if DRAFT
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    const vendorId = (session?.user as any)?.vendorId;
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { id } = await params;
    const productId = parseInt(id);
    const existing = await getOwnedProduct(productId, vendorId);

    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    if (existing.status === 'DRAFT') {
      // Hard delete for drafts — no marketplace impact
      await prisma.product.delete({ where: { id: productId } });
      return NextResponse.json({ deleted: true, message: 'Product permanently deleted.' });
    }

    // Soft archive for anything else — preserves cart/review history
    await prisma.product.update({
      where: { id: productId },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json({ archived: true, message: 'Product archived and removed from marketplace.' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}