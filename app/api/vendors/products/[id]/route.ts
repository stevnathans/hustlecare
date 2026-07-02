/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/vendors/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

const VALID_LEAD_TIMES = ['IN_STOCK', '1_3_DAYS', '1_WEEK', '2_WEEKS_PLUS'];
const VALID_DURATION_UNITS = ['days', 'months', 'years'];
const VALID_WEIGHT_UNITS = ['kg', 'g', 'lb'];
const VALID_RECEIPT_STATUSES = ['YES', 'NO', 'UNKNOWN'];
const VALID_WARRANTY_TYPES = ['NONE', 'MANUFACTURER', 'VENDOR'];
const VALID_CONDITIONS = ['NEW', 'USED'];

async function getOwnedProduct(productId: number, vendorId: number) {
  return prisma.product.findFirst({
    where: { id: productId, vendorId },
    include: { bulkPricing: true },
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

      // Condition
      condition,
      usedDurationValue,
      usedDurationUnit,
      hasReceipt,

      // Specifications
      brand,
      model, // maps to modelNumber
      voltage,
      wattage,
      dimensions,
      weight,
      weightUnit,

      // Warranty
      warrantyType,
      warrantyDurationValue,
      warrantyDurationUnit,

      // Delivery / logistics
      deliveryAvailable,
      pickupLocation,
      leadTime,

      // Commercial terms
      negotiable,
      bulkPricing,
    } = body;

    // ── Validate enum-like fields (reject silently-wrong values rather than
    //    letting Prisma throw an opaque error) ──────────────────────────
    if (condition !== undefined && condition !== null && !VALID_CONDITIONS.includes(condition)) {
      return NextResponse.json({ error: 'Invalid condition.' }, { status: 400 });
    }
    if (usedDurationUnit !== undefined && usedDurationUnit !== null && !VALID_DURATION_UNITS.includes(usedDurationUnit)) {
      return NextResponse.json({ error: 'Invalid used-duration unit.' }, { status: 400 });
    }
    if (hasReceipt !== undefined && hasReceipt !== null && hasReceipt !== '' && !VALID_RECEIPT_STATUSES.includes(hasReceipt)) {
      return NextResponse.json({ error: 'Invalid receipt status.' }, { status: 400 });
    }
    if (weightUnit !== undefined && weightUnit !== null && !VALID_WEIGHT_UNITS.includes(weightUnit)) {
      return NextResponse.json({ error: 'Invalid weight unit.' }, { status: 400 });
    }
    if (warrantyType !== undefined && warrantyType !== null && !VALID_WARRANTY_TYPES.includes(warrantyType)) {
      return NextResponse.json({ error: 'Invalid warranty type.' }, { status: 400 });
    }
    if (warrantyDurationUnit !== undefined && warrantyDurationUnit !== null && !VALID_DURATION_UNITS.includes(warrantyDurationUnit)) {
      return NextResponse.json({ error: 'Invalid warranty-duration unit.' }, { status: 400 });
    }
    if (leadTime !== undefined && leadTime !== null && !VALID_LEAD_TIMES.includes(leadTime)) {
      return NextResponse.json({ error: 'Invalid lead time.' }, { status: 400 });
    }
    if (bulkPricing !== undefined && bulkPricing !== null) {
      if (!Array.isArray(bulkPricing)) {
        return NextResponse.json({ error: 'bulkPricing must be an array.' }, { status: 400 });
      }
      for (const tier of bulkPricing) {
        if (
          tier == null ||
          typeof tier.minQty === 'undefined' ||
          typeof tier.price === 'undefined' ||
          Number.isNaN(Number(tier.minQty)) ||
          Number.isNaN(Number(tier.price)) ||
          Number(tier.minQty) <= 0 ||
          Number(tier.price) < 0
        ) {
          return NextResponse.json({ error: 'Each bulk pricing tier needs a positive minQty and a non-negative price.' }, { status: 400 });
        }
      }
    }

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

    const usesUsedFields = condition === 'USED' || (condition === undefined && existing.condition === 'USED');
    const usesWarrantyFields = warrantyType
      ? warrantyType !== 'NONE'
      : existing.warrantyType !== 'NONE';

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name: name?.trim() || undefined,
          description: description?.trim() ?? undefined,
          price: price !== undefined ? (price === null ? null : Number(price)) : undefined,
          priceMin: priceMin !== undefined ? (priceMin === null ? null : Number(priceMin)) : undefined,
          priceMax: priceMax !== undefined ? (priceMax === null ? null : Number(priceMax)) : undefined,
          currency: currency || undefined,
          image: image?.trim() ?? undefined,
          url: url?.trim() ?? undefined,
          sku: sku?.trim() ?? undefined,
          stock: stock !== undefined ? (stock === null ? null : Number(stock)) : undefined,
          templateId: templateId || undefined,
          businessTags: finalTags,
          status: newStatus,
          // Clear rejection data if resubmitting
          ...(submitForReview
            ? { rejectedAt: null, rejectReason: null }
            : {}),

          // Condition
          condition: condition ?? undefined,
          usedDurationValue: usesUsedFields
            ? (usedDurationValue !== undefined && usedDurationValue !== null ? Number(usedDurationValue) : undefined)
            : usedDurationValue === undefined ? undefined : null,
          usedDurationUnit: usesUsedFields
            ? (usedDurationUnit ?? undefined)
            : usedDurationUnit === undefined ? undefined : null,
          hasReceipt: usesUsedFields
            ? (hasReceipt || undefined)
            : hasReceipt === undefined ? undefined : null,

          // Specifications
          brand: brand?.trim() ?? undefined,
          modelNumber: model?.trim() ?? undefined,
          voltage: voltage?.trim() ?? undefined,
          wattage: wattage?.trim() ?? undefined,
          dimensions: dimensions?.trim() ?? undefined,
          weight: weight !== undefined ? (weight === null ? null : Number(weight)) : undefined,
          weightUnit: weightUnit !== undefined ? (weightUnit || null) : undefined,

          // Warranty
          warrantyType: warrantyType ?? undefined,
          warrantyDurationValue: usesWarrantyFields
            ? (warrantyDurationValue !== undefined && warrantyDurationValue !== null ? Number(warrantyDurationValue) : undefined)
            : warrantyDurationValue === undefined ? undefined : null,
          warrantyDurationUnit: usesWarrantyFields
            ? (warrantyDurationUnit ?? undefined)
            : warrantyDurationUnit === undefined ? undefined : null,

          // Delivery / logistics
          deliveryAvailable: deliveryAvailable !== undefined ? Boolean(deliveryAvailable) : undefined,
          pickupLocation: pickupLocation?.trim() ?? undefined,
          leadTime: leadTime || undefined,

          // Commercial terms
          negotiable: negotiable !== undefined ? Boolean(negotiable) : undefined,
        },
        include: {
          template: { select: { id: true, name: true, category: true } },
          bulkPricing: true,
        },
      });

      // Bulk pricing tiers are a separate table — replace wholesale on update
      // rather than diffing, since there's no stable client-side tier id yet.
      if (bulkPricing !== undefined && bulkPricing !== null) {
        await tx.bulkPriceTier.deleteMany({ where: { productId } });
        if (Array.isArray(bulkPricing) && bulkPricing.length > 0) {
          await tx.bulkPriceTier.createMany({
            data: bulkPricing.map((tier: { minQty: number | string; price: number | string }) => ({
              productId,
              minQty: Number(tier.minQty),
              price: Number(tier.price),
            })),
          });
        }
        return tx.product.findUnique({
          where: { id: productId },
          include: {
            template: { select: { id: true, name: true, category: true } },
            bulkPricing: true,
          },
        });
      }

      return product;
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
      // bulkPricing rows cascade-delete automatically via the FK
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