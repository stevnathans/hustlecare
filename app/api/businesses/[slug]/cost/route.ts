// app/api/businesses/[slug]/cost/route.ts
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
      include: {
        requirements: {
          where: {
            isActive: true,
            template: { isDeprecated: false },
          },
          include: {
            template: {
              select: {
                id: true,
                name: true,
                products: {
                  select: { price: true },
                  where: { price: { not: null } },
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

    let low = 0;
    let medium = 0;
    let high = 0;
    let requirementsWithProducts = 0;
    const totalRequirements = business.requirements.length;

    for (const req of business.requirements) {
      const prices = req.template.products
        .map((p) => p.price)
        .filter((p): p is number => p !== null && p > 0)
        .sort((a, b) => a - b);

      if (prices.length === 0) continue;

      requirementsWithProducts++;

      // Low  = cheapest product for this requirement
      // High = most expensive product for this requirement
      // Mid  = median product
      low    += prices[0];
      high   += prices[prices.length - 1];
      medium += prices[Math.floor(prices.length / 2)];
    }

    return NextResponse.json({
      low,
      medium,
      high,
      requirementsWithProducts,
      totalRequirements,
      hasPricing: requirementsWithProducts > 0,
    });
  } catch (error) {
    console.error('Error calculating business cost:', error);
    return NextResponse.json(
      { error: 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}