// app/api/business/[slug]/products/route.ts
// Returns all ACTIVE products for every active requirement of a business,
// plus fee-schedule pricing and the editable shell-product details for
// county-issued Legal requirements.
//
// Self-heals: any requirement flagged isCountyFeeSchedule that doesn't yet
// have a shell product gets one created here automatically.
//
// export const dynamic = 'force-dynamic' + revalidate = 0 are required —
// without them Next.js caches this GET route's response indefinitely (the
// "Full Route Cache"), since it never touches cookies/headers/searchParams
// that would normally opt it out automatically. That caching was why
// fee-schedule price changes took a long time to show up on the front end.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureFeeScheduleShellProduct } from '@/lib/legalFeeScheduleAdmin';
import { DEFAULT_MARKET, isMarketCode } from '@/lib/markets';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // market comes from the client's ?market= query param — set by
    // useBusinessData based on which route rendered the page (KE or US).
    // Falls back to Kenya if missing/invalid. Filters recommended
    // products down to vendors operating in this market (e.g. Jumia for
    // KE, Amazon for US) — see Vendor.country in schema.prisma.
    // County-fee shell products aren't affected: they're returned
    // separately via feeSchedules below, not through this products.where
    // filter.
    const marketParam = req.nextUrl.searchParams.get('market');
    const market = isMarketCode(marketParam) ? marketParam : DEFAULT_MARKET;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        requirements: {
          where: {
            isActive: true,
            template: { isDeprecated: false },
          },
          select: {
            template: {
              select: {
                id: true,
                name: true,
                isCountyFeeSchedule: true,
                products: {
                  where: {
                    status: 'ACTIVE',
                    price: { not: null },
                    vendor: { country: market },
                  },
                  select: {
                    id: true, name: true, description: true, price: true, image: true, url: true,
                    templateId: true, vendorId: true,
                    vendor: {
                      select: {
                        id: true, name: true, website: true, logo: true,
                        servesAllCounties: true,
                        counties: { select: { countyId: true } },
                      },
                    },
                    condition: true, usedDurationValue: true, usedDurationUnit: true, hasReceipt: true,
                    brand: true, modelNumber: true, voltage: true, wattage: true, dimensions: true,
                    weight: true, weightUnit: true,
                    warrantyType: true, warrantyDurationValue: true, warrantyDurationUnit: true,
                    deliveryAvailable: true, pickupLocation: true, leadTime: true,
                    negotiable: true,
                    bulkPricing: { select: { id: true, minQty: true, price: true }, orderBy: { minQty: 'asc' } },
                    validityValue: true, validityUnit: true, processingTimeMinDays: true, processingTimeMaxDays: true,
                    // Software — simple flat-price cadence (billingPeriod)
                    // plus package tiers, if any. price for a product WITH
                    // packages is already the derived lowest-monthly-
                    // equivalent (computed server-side on save — see
                    // lib/product-validation.ts), so it needs no special
                    // handling here beyond ordering the packages for
                    // display.
                    billingPeriod: true,
                    packages: {
                      select: {
                        id: true, name: true, description: true, price: true,
                        billingPeriod: true, features: true, isPopular: true, displayOrder: true,
                      },
                      orderBy: { displayOrder: 'asc' },
                    },
                  },
                  orderBy: { price: 'asc' },
                },
                feeSchedules: {
                  select: {
                    id: true, templateId: true, countyId: true, businessCategoryId: true, sizeBand: true,
                    price: true, priceMin: true, priceMax: true,
                    validityValue: true, validityUnit: true,
                    processingTimeMinDays: true, processingTimeMaxDays: true,
                    applyUrl: true, notes: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const products: Record<number, unknown[]> = {};
    const feeSchedules: Record<number, unknown[]> = {};
    const feeScheduleShellProductIds: Record<number, number> = {};
    const feeScheduleShellProductDetails: Record<
      number,
      { name: string; description: string | null; image: string | null; url: string | null }
    > = {};

    const feeTemplates = business.requirements
      .map((r) => r.template)
      .filter((t) => t.isCountyFeeSchedule);

    // Self-heal: create a shell product for any fee-schedule template
    // that doesn't have one yet. Sequential (not Promise.all) to avoid
    // concurrent-create races on the same template.
    for (const t of feeTemplates) {
      try {
        const shellProduct = await ensureFeeScheduleShellProduct(t.id, t.name);
        feeScheduleShellProductIds[t.id] = shellProduct.id;
        feeScheduleShellProductDetails[t.id] = {
          name: t.name,
          description: null,
          image: null,
          url: null,
        };
      } catch (e) {
        console.error(`Failed to ensure shell product for template ${t.id}:`, e);
      }
    }

    for (const req of business.requirements) {
      products[req.template.id] = req.template.products;
      if (req.template.isCountyFeeSchedule) {
        feeSchedules[req.template.id] = req.template.feeSchedules;
      }
    }

    return NextResponse.json({
      products,
      feeSchedules,
      feeScheduleShellProductIds,
      feeScheduleShellProductDetails,
    });
  } catch (error) {
    console.error('Error fetching business products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}