// app/api/admin/products/[id]/route.ts  
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { validateProductEnums, validateBulkPricing } from '@/lib/product-validation';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update');
    const { id } = await params;
    const productId = parseInt(id);

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    const body = await request.json();
    const enumErrors = validateProductEnums(body);
    if (enumErrors.length) return NextResponse.json({ error: enumErrors[0] }, { status: 400 });

    const { errors: bulkErrors, tiers } = validateBulkPricing(body.bulkPricing);
    if (bulkErrors.length) return NextResponse.json({ error: bulkErrors[0] }, { status: 400 });

    if (body.vendorId !== undefined) {
      const vendor = await prisma.vendor.findUnique({ where: { id: Number(body.vendorId) }, select: { id: true } });
      if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 400 });
    }

    let finalTags = existing.businessTags;
    if (body.templateId && body.templateId !== existing.templateId) {
      const template = await prisma.requirementTemplate.findUnique({
        where: { id: Number(body.templateId) },
        include: { businesses: { where: { isActive: true }, select: { businessId: true } } },
      });
      if (!template || template.isDeprecated) {
        return NextResponse.json({ error: 'Invalid requirement template.' }, { status: 400 });
      }
      const autoTags = template.businesses.map((b) => b.businessId);
      const manualTags: number[] = Array.isArray(body.businessTags) ? (body.businessTags as number[]) : [];
      finalTags = [...new Set([...autoTags, ...manualTags])];
    } else if (Array.isArray(body.businessTags)) {
      finalTags = [...new Set(body.businessTags as number[])];
    }

    const isUsed = body.condition === 'USED' || (body.condition === undefined && existing.condition === 'USED');
    const hasWarranty = body.warrantyType ? body.warrantyType !== 'NONE' : existing.warrantyType !== 'NONE';

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name: body.name?.trim() || undefined,
          description: body.description?.trim() ?? undefined,
          price: body.price !== undefined ? (body.price === null ? null : Number(body.price)) : undefined,
          priceMin: body.priceMin !== undefined ? (body.priceMin === null ? null : Number(body.priceMin)) : undefined,
          priceMax: body.priceMax !== undefined ? (body.priceMax === null ? null : Number(body.priceMax)) : undefined,
          currency: body.currency || undefined,
          image: body.image?.trim() ?? undefined,
          url: body.url?.trim() ?? undefined,
          sku: body.sku?.trim() ?? undefined,
          stock: body.stock !== undefined ? (body.stock === null ? null : Number(body.stock)) : undefined,
          vendorId: body.vendorId !== undefined ? Number(body.vendorId) : undefined,
          templateId: body.templateId || undefined,
          businessTags: finalTags,
          // Admins can move a product to any status directly (unlike vendors,
          // who are restricted to DRAFT/REJECTED editing + PENDING_REVIEW resubmit).
          status: body.status || undefined,
          ...(body.status === 'ACTIVE' ? { publishedAt: new Date(), rejectedAt: null, rejectReason: null } : {}),

          condition: body.condition ?? undefined,
          usedDurationValue: isUsed ? (body.usedDurationValue != null ? Number(body.usedDurationValue) : undefined) : (body.usedDurationValue === undefined ? undefined : null),
          usedDurationUnit: isUsed ? (body.usedDurationUnit ?? undefined) : (body.usedDurationUnit === undefined ? undefined : null),
          hasReceipt: isUsed ? (body.hasReceipt || undefined) : (body.hasReceipt === undefined ? undefined : null),

          brand: body.brand?.trim() ?? undefined,
          modelNumber: body.model?.trim() ?? undefined,
          voltage: body.voltage?.trim() ?? undefined,
          wattage: body.wattage?.trim() ?? undefined,
          dimensions: body.dimensions?.trim() ?? undefined,
          weight: body.weight !== undefined ? (body.weight === null ? null : Number(body.weight)) : undefined,
          weightUnit: body.weightUnit !== undefined ? (body.weightUnit || null) : undefined,

          warrantyType: body.warrantyType ?? undefined,
          warrantyDurationValue: hasWarranty ? (body.warrantyDurationValue != null ? Number(body.warrantyDurationValue) : undefined) : (body.warrantyDurationValue === undefined ? undefined : null),
          warrantyDurationUnit: hasWarranty ? (body.warrantyDurationUnit ?? undefined) : (body.warrantyDurationUnit === undefined ? undefined : null),

          deliveryAvailable: body.deliveryAvailable !== undefined ? Boolean(body.deliveryAvailable) : undefined,
          pickupLocation: body.pickupLocation?.trim() ?? undefined,
          leadTime: body.leadTime || undefined,

          negotiable: body.negotiable !== undefined ? Boolean(body.negotiable) : undefined,
        },
        include: { template: { select: { id: true, name: true, category: true } }, vendor: true, bulkPricing: true },
      });

      if (body.bulkPricing !== undefined) {
        await tx.bulkPriceTier.deleteMany({ where: { productId } });
        if (tiers.length > 0) {
          await tx.bulkPriceTier.createMany({ data: tiers.map((t) => ({ productId, ...t })) });
        }
        return tx.product.findUnique({
          where: { id: productId },
          include: { template: { select: { id: true, name: true, category: true } }, vendor: true, bulkPricing: true },
        });
      }
      return product;
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Product',
      entityId: productId.toString(),
      changes: { fields: Object.keys(body), updatedBy: user.id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating admin product:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.delete');
    const { id } = await params;
    const productId = parseInt(id);

    const existing = await prisma.product.findUnique({ where: { id: productId } });
    if (!existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    if (existing.status === 'DRAFT') {
      await prisma.product.delete({ where: { id: productId } });
    } else {
      await prisma.product.update({ where: { id: productId }, data: { status: 'ARCHIVED' } });
    }

    await createAuditLog({
      action: 'DELETE',
      entity: 'Product',
      entityId: productId.toString(),
      changes: { name: existing.name, hardDeleted: existing.status === 'DRAFT', deletedBy: user.id },
    });

    return NextResponse.json({ message: existing.status === 'DRAFT' ? 'Product permanently deleted.' : 'Product archived.' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting admin product:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to delete product.' }, { status: 500 });
  }
}