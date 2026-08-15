/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import {
  validateProductEnums, validateBulkPricing, validateSoftwarePackages, computeDerivedMonthlyPrice,
} from '@/lib/product-validation';
import { ProductStatus } from '@prisma/client';

type Params = { params: Promise<{ id: string }> };

function nullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update');
    const { id } = await params;
    const productId = parseInt(id);

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { packages: { select: { id: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    const body = await request.json();
    const enumErrors = validateProductEnums(body);
    if (enumErrors.length) return NextResponse.json({ error: enumErrors[0] }, { status: 400 });

    const { errors: bulkErrors, tiers } = validateBulkPricing(body.bulkPricing);
    if (bulkErrors.length) return NextResponse.json({ error: bulkErrors[0] }, { status: 400 });

    // packages is only touched when the client explicitly sends the field
    // (the admin form always sends it as an array — possibly empty — for
    // any non-shell product, but this stays defensive for other callers).
    const touchesPackages = body.packages !== undefined;
    const { errors: packageErrors, packages: cleanPackages } = validateSoftwarePackages(body.packages);
    if (packageErrors.length) return NextResponse.json({ error: packageErrors[0] }, { status: 400 });

    // Whether the product will have packages AFTER this update — used to
    // decide whether price is derived or client-supplied. If packages
    // isn't part of this request, fall back to whatever's already there.
    const hasPackagesAfterUpdate = touchesPackages ? cleanPackages.length > 0 : existing.packages.length > 0;

    // Resolve the requirement category this product will belong to AFTER
    // this update — needed so billingPeriod can be gated on category
    // server-side rather than trusting the client. Only meaningful for
    // Software: previously billingPeriod was only cleared when
    // hasPackagesAfterUpdate was true, which let a non-Software product
    // (e.g. Equipment) persist a stray/defaulted billingPeriod value
    // (typically 'MONTHLY' from the admin form's default state) and
    // caused ProductCard to render a bogus "/mo" price suffix. Do not
    // remove this check even if the client is believed to send correct
    // values — this is the last line of defense against that data
    // getting written again, from this route or any future caller.
    const effectiveTemplateId: number | undefined = body.templateId
      ? Number(body.templateId)
      : existing.templateId ?? undefined;
    let isSoftwareRequirement = false;
    if (effectiveTemplateId) {
      const effectiveTemplate = await prisma.requirementTemplate.findUnique({
        where: { id: effectiveTemplateId },
        select: { category: true },
      });
      isSoftwareRequirement = effectiveTemplate?.category === 'Software';
    }

    const touchesPrice = body.price !== undefined || body.priceMin !== undefined || body.priceMax !== undefined;
    // Skip the manual price/range validation entirely once packages own
    // the price — the admin form never sends price alongside packages,
    // but stay defensive rather than reject a well-formed derived update.
    if (touchesPrice && !hasPackagesAfterUpdate) {
      const usingPriceRange = !!(body.priceMin || body.priceMax);
      if (usingPriceRange) {
        const min = body.priceMin != null ? Number(body.priceMin) : null;
        const max = body.priceMax != null ? Number(body.priceMax) : null;
        if (min == null || max == null || Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0) {
          return NextResponse.json({ error: 'Enter a valid price range.' }, { status: 400 });
        }
        if (min > max) {
          return NextResponse.json({ error: 'Minimum price cannot be greater than maximum price.' }, { status: 400 });
        }
      } else if (body.price === null || body.price === '' || Number.isNaN(Number(body.price)) || Number(body.price) < 0) {
        return NextResponse.json({ error: 'Enter a valid price, or switch to a price range.' }, { status: 400 });
      }
    }

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
    const hasValidity = body.validityValue !== undefined
      ? body.validityValue !== null && body.validityValue !== ''
      : existing.validityValue !== null;

    let status: ProductStatus | undefined;
    if (body.publishImmediately === true) {
      status = 'ACTIVE';
    } else if (body.publishImmediately === false) {
      status = existing.status === 'ACTIVE' ? 'DRAFT' : ((body.status as ProductStatus) || undefined);
    } else {
      status = (body.status as ProductStatus) || undefined;
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // If bulk pricing array is explicitly passed, clear old tiers first
        if (body.bulkPricing !== undefined) {
          await tx.bulkPriceTier.deleteMany({ where: { productId } });
        }

        // Same replace-in-place pattern for Software packages: if the
        // client sent a packages array, the old rows are fully replaced
        // (not merged) — matches how bulkPricing already behaves above.
        if (touchesPackages) {
          await tx.softwarePackage.deleteMany({ where: { productId } });
        }

        // Perform main update and create new bulk pricing tiers / packages
        // nested in a single query.
        return tx.product.update({
          where: { id: productId },
          // Cast to any to satisfy mismatched Prisma UpdateInput overloads
          data: {
            name: body.name?.trim() || undefined,
            description: body.description !== undefined ? nullableString(body.description) : undefined,
            // Never trust a client-supplied price once packages own it.
            // Three cases:
            //  - packages were just updated and still non-empty: recompute
            //    from the new set.
            //  - packages untouched this request but the product already
            //    has some: leave price alone (undefined) — it's already
            //    correct from the last time packages changed, and we only
            //    selected `id` on existing.packages so we don't have their
            //    price/billingPeriod to recompute from anyway.
            //  - no packages involved at all: normal client-supplied value.
            price: hasPackagesAfterUpdate
              ? (touchesPackages ? computeDerivedMonthlyPrice(cleanPackages) : undefined)
              : (body.price !== undefined ? (body.price === null ? null : Number(body.price)) : undefined),
            priceMin: hasPackagesAfterUpdate ? null : (body.priceMin !== undefined ? (body.priceMin === null ? null : Number(body.priceMin)) : undefined),
            priceMax: hasPackagesAfterUpdate ? null : (body.priceMax !== undefined ? (body.priceMax === null ? null : Number(body.priceMax)) : undefined),
            currency: body.currency || undefined,
            image: body.image !== undefined ? nullableString(body.image) : undefined,
            url: body.url !== undefined ? nullableString(body.url) : undefined,
            sku: body.sku !== undefined ? nullableString(body.sku) : undefined,
            stock: body.stock !== undefined ? (body.stock === null ? null : Number(body.stock)) : undefined,
            vendorId: body.vendorId !== undefined ? Number(body.vendorId) : undefined,
            templateId: body.templateId || undefined,
            businessTags: finalTags,
            status: status,
            ...(status === 'ACTIVE' ? { publishedAt: new Date(), rejectedAt: null, rejectReason: null } : {}),

            condition: body.condition ?? undefined,
            usedDurationValue: isUsed ? (body.usedDurationValue != null ? Number(body.usedDurationValue) : undefined) : (body.usedDurationValue === undefined ? undefined : null),
            usedDurationUnit: isUsed ? (body.usedDurationUnit ?? undefined) : (body.usedDurationUnit === undefined ? undefined : null),
            hasReceipt: isUsed ? (body.hasReceipt || undefined) : (body.hasReceipt === undefined ? undefined : null),

            brand: body.brand !== undefined ? nullableString(body.brand) : undefined,
            modelNumber: body.model !== undefined ? nullableString(body.model) : undefined,
            voltage: body.voltage !== undefined ? nullableString(body.voltage) : undefined,
            wattage: body.wattage !== undefined ? nullableString(body.wattage) : undefined,
            dimensions: body.dimensions !== undefined ? nullableString(body.dimensions) : undefined,
            weight: body.weight !== undefined ? (body.weight === null ? null : Number(body.weight)) : undefined,
            weightUnit: body.weightUnit !== undefined ? (body.weightUnit || null) : undefined,

            warrantyType: body.warrantyType ?? undefined,
            warrantyDurationValue: hasWarranty ? (body.warrantyDurationValue != null ? Number(body.warrantyDurationValue) : undefined) : (body.warrantyDurationValue === undefined ? undefined : null),
            warrantyDurationUnit: hasWarranty ? (body.warrantyDurationUnit ?? undefined) : (body.warrantyDurationUnit === undefined ? undefined : null),

            deliveryAvailable: body.deliveryAvailable !== undefined ? Boolean(body.deliveryAvailable) : undefined,
            pickupLocation: body.pickupLocation !== undefined ? nullableString(body.pickupLocation) : undefined,
            leadTime: body.leadTime || undefined,

            negotiable: body.negotiable !== undefined ? Boolean(body.negotiable) : undefined,

            // Legal — validity + processing time only (county comes from Vendor)
            validityValue: hasValidity ? (body.validityValue != null ? Number(body.validityValue) : undefined) : (body.validityValue === undefined ? undefined : null),
            validityUnit: hasValidity ? (body.validityUnit ?? undefined) : (body.validityUnit === undefined ? undefined : null),
            processingTimeMinDays: body.processingTimeMinDays !== undefined ? (body.processingTimeMinDays === null || body.processingTimeMinDays === '' ? null : Number(body.processingTimeMinDays)) : undefined,
            processingTimeMaxDays: body.processingTimeMaxDays !== undefined ? (body.processingTimeMaxDays === null || body.processingTimeMaxDays === '' ? null : Number(body.processingTimeMaxDays)) : undefined,

            // Software — simple flat-price cadence. Meaningless outside of
            // Software products, and meaningless once packages exist even
            // for Software products — force it null in either case
            // regardless of what the client sent. This is a server-side
            // backstop (see isSoftwareRequirement resolution above): a
            // non-Software product (e.g. Equipment) must never end up
            // with a non-null billingPeriod, since ProductCard uses its
            // presence to decide whether to render a "/mo" price suffix.
            billingPeriod: (!isSoftwareRequirement || hasPackagesAfterUpdate)
              ? null
              : (body.billingPeriod !== undefined ? (body.billingPeriod || null) : undefined),

            ...(body.bulkPricing !== undefined && tiers.length > 0
              ? { bulkPricing: { createMany: { data: tiers } } }
              : {}),
            ...(touchesPackages && cleanPackages.length > 0
              ? { packages: { createMany: { data: cleanPackages } } }
              : {}),
          } as any,
          include: {
            template: { select: { id: true, name: true, category: true } },
            vendor: true,
            bulkPricing: true,
            packages: { orderBy: { displayOrder: 'asc' } },
          },
        });
      },
      {
        timeout: 10000, // Extends timeout from 5000ms default to 10 seconds
      }
    );

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