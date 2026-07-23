// app/api/businesses/[slug]/cost/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Cost ranges don't change minute-to-minute, but this endpoint was being
// hit on every homepage load (3x — once per featured business), each time
// re-fetching every RequirementTemplate + Product price for that business
// from scratch. unstable_cache means the actual DB work only runs once per
// revalidate window (here: 1 hour) per slug; every request in between is
// served from Next's data cache with no DB round trip at all.
const REVALIDATE_SECONDS = 60 * 60; // 1 hour — adjust if pricing changes more/less often

const getBusinessCost = unstable_cache(
  async (slug: string) => {
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

    if (!business) return null;

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

    return {
      low,
      medium,
      high,
      requirementsWithProducts,
      totalRequirements,
      hasPricing: requirementsWithProducts > 0,
    };
  },
  ['business-cost'], // base cache key — slug is appended via the args below
  { revalidate: REVALIDATE_SECONDS }
);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // unstable_cache keys on the function args too, so each slug gets its
    // own cache entry — pass slug explicitly so the key varies per business.
    const result = await getBusinessCost(slug);

    if (!result) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating business cost:', error);
    return NextResponse.json(
      { error: 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}