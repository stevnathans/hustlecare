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

const VALID_LEAD_TIMES = ['IN_STOCK', '1_3_DAYS', '1_WEEK', '2_WEEKS_PLUS'];
const VALID_DURATION_UNITS = ['days', 'months', 'years'];
const VALID_WEIGHT_UNITS = ['kg', 'g', 'lb'];
const VALID_RECEIPT_STATUSES = ['YES', 'NO', 'UNKNOWN'];
const VALID_WARRANTY_TYPES = ['NONE', 'MANUFACTURER', 'VENDOR'];
const VALID_CONDITIONS = ['NEW', 'USED'];

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
        bulkPricing: true,
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

    if (!name?.trim()) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    if (!templateId) return NextResponse.json({ error: 'Please select a requirement this product fulfils.' }, { status: 400 });

    // ── Validate enum-like fields ────────────────────────────────────────────
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
    let validBulkTiers: { minQty: number; price: number }[] = [];
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
      validBulkTiers = bulkPricing.map((tier: { minQty: number | string; price: number | string }) => ({
        minQty: Number(tier.minQty),
        price: Number(tier.price),
      }));
    }

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
    const isUsed = condition === 'USED';
    const hasWarranty = !!warrantyType && warrantyType !== 'NONE';

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

        // Condition
        condition: condition || 'NEW',
        usedDurationValue: isUsed && usedDurationValue !== undefined && usedDurationValue !== null ? Number(usedDurationValue) : null,
        usedDurationUnit: isUsed ? (usedDurationUnit || null) : null,
        hasReceipt: isUsed ? (hasReceipt || null) : null,

        // Specifications
        brand: brand?.trim() || null,
        modelNumber: model?.trim() || null,
        voltage: voltage?.trim() || null,
        wattage: wattage?.trim() || null,
        dimensions: dimensions?.trim() || null,
        weight: weight !== undefined && weight !== null && weight !== '' ? Number(weight) : null,
        weightUnit: weight !== undefined && weight !== null && weight !== '' ? (weightUnit || null) : null,

        // Warranty
        warrantyType: warrantyType || 'NONE',
        warrantyDurationValue: hasWarranty && warrantyDurationValue !== undefined && warrantyDurationValue !== null ? Number(warrantyDurationValue) : null,
        warrantyDurationUnit: hasWarranty ? (warrantyDurationUnit || null) : null,

        // Delivery / logistics
        deliveryAvailable: !!deliveryAvailable,
        pickupLocation: pickupLocation?.trim() || null,
        leadTime: leadTime || 'IN_STOCK',

        // Commercial terms
        negotiable: !!negotiable,
        ...(validBulkTiers.length > 0
          ? { bulkPricing: { create: validBulkTiers } }
          : {}),
      },
      include: {
        template: { select: { id: true, name: true, category: true } },
        vendor: { select: { id: true, name: true, slug: true, logo: true } },
        bulkPricing: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product.' }, { status: 500 });
  }
}