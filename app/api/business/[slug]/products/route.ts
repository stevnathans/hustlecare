// app/api/business/[slug]/products/route.ts
// Returns all ACTIVE products for every active requirement of a business in one query.
// Response shape: Record<templateId, Product[]>
// The client maps templateId → requirement name using the requirements it already has.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
                products: {
                  where: {
                    status: 'ACTIVE',        // ← only approved products
                    price:  { not: null },
                  },
                  select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    image: true,
                    url: true,
                    templateId: true,
                    vendorId: true,
                    vendor: {
                      select: { id: true, name: true, website: true, logo: true },
                    },

                    // Condition
                    condition: true,
                    usedDurationValue: true,
                    usedDurationUnit: true,
                    hasReceipt: true,

                    // Specifications
                    brand: true,
                    modelNumber: true,
                    voltage: true,
                    wattage: true,
                    dimensions: true,
                    weight: true,
                    weightUnit: true,

                    // Warranty
                    warrantyType: true,
                    warrantyDurationValue: true,
                    warrantyDurationUnit: true,

                    // Delivery / logistics
                    deliveryAvailable: true,
                    pickupLocation: true,
                    leadTime: true,

                    // Commercial terms
                    negotiable: true,
                    bulkPricing: {
                      select: { id: true, minQty: true, price: true },
                      orderBy: { minQty: 'asc' },
                    },
                  },
                  orderBy: { price: 'asc' },
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

    // Build a map of templateId → products[]
    const productsByTemplateId: Record<number, typeof business.requirements[0]['template']['products']> = {};

    for (const req of business.requirements) {
      productsByTemplateId[req.template.id] = req.template.products;
    }

    return NextResponse.json(productsByTemplateId);
  } catch (error) {
    console.error('Error fetching business products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}