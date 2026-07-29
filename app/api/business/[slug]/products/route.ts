// app/api/business/[slug]/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ensureFeeScheduleShellProduct } from '@/lib/legalFeeScheduleAdmin';

// Without this, Next.js caches this GET route's response indefinitely (the
// "Full Route Cache") since it never touches cookies/headers/searchParams
// that would normally opt it out automatically. This is why fee-schedule
// price changes took a long time to show up — the page was serving a
// stale cached response, not fresh data from the database.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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
                  },
                  orderBy: { price: 'asc' },
                },
                feeSchedules: {
                  select: {
                    id: true, templateId: true, countyId: true, businessCategoryId: true, sizeBand: true,
                    price: true, validityValue: true, validityUnit: true,
                    processingTimeMinDays: true, processingTimeMaxDays: true, notes: true,
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
    // Editable fields the shell Product carries — this is what lets an
    // admin's name/description/image/url changes actually show up on the
    // requirements page instead of always falling back to the template's
    // own generic name/description.
    const feeScheduleShellProductDetails: Record<
      number,
      { name: string; description: string | null; image: string | null; url: string | null }
    > = {};

    const feeTemplates = business.requirements
      .map((r) => r.template)
      .filter((t) => t.isCountyFeeSchedule);

    // Self-heal: create a shell product for any fee-schedule template
    // that doesn't have one yet. Sequential to avoid concurrent-create
    // races on the same template.
    for (const t of feeTemplates) {
      try {
        const shellProductId = await ensureFeeScheduleShellProduct(t.id, t.name);
        feeScheduleShellProductIds[t.id] = shellProductId;

        const shell = await prisma.product.findUnique({
          where: { id: shellProductId },
          select: { name: true, description: true, image: true, url: true },
        });

        feeScheduleShellProductDetails[t.id] = {
          name: shell?.name ?? t.name,
          description: shell?.description ?? null,
          image: shell?.image ?? null,
          url: shell?.url ?? null,
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