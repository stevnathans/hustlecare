// app/api/businesses/[slug]/cost/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, isMarketCode, type MarketCode } from '@/lib/markets';

// Cost ranges don't change minute-to-minute, but this endpoint was being
// hit on every homepage load (3x — once per featured business), each time
// re-fetching every RequirementTemplate + Product price for that business
// from scratch. unstable_cache means the actual DB work only runs once per
// revalidate window (here: 1 hour) per (slug, market) pair; every request
// in between is served from Next's data cache with no DB round trip at all.
const REVALIDATE_SECONDS = 60 * 60; // 1 hour — adjust if pricing changes more/less often

const getBusinessCost = unstable_cache(
  async (slug: string, market: MarketCode) => {
    const business = await prisma.business.findUnique({
      where: { slug },
      include: {
        requirements: {
          where: {
            isActive: true,
            template: {
              isDeprecated: false,
              // Same restrictedToCountry filter as every other
              // requirements query (see lib/business-data.ts) — this
              // route previously had no market filter at all, so a
              // Kenya-only requirement's product prices could leak into
              // a US visitor's cost estimate.
              OR: [
                { restrictedToCountry: null },
                { restrictedToCountry: market },
              ],
            },
          },
          include: {
            template: {
              select: {
                id: true,
                name: true,
                products: {
                  select: { price: true },
                  where: {
                    price: { not: null },
                    // Only aggregate prices from vendors operating in
                    // this market — same filter as
                    // app/api/business/[slug]/products/route.ts.
                    vendor: { country: market },
                  },
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
  ['business-cost'], // base cache key — slug and market are appended via the args below
  { revalidate: REVALIDATE_SECONDS }
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const marketParam = req.nextUrl.searchParams.get('market');
    const market = isMarketCode(marketParam) ? marketParam : DEFAULT_MARKET;

    // unstable_cache keys on the function args too, so each (slug, market)
    // pair gets its own cache entry — pass both explicitly so the key
    // varies per business AND per market, not just per business.
    const result = await getBusinessCost(slug, market);

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