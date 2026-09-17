// app/api/businesses/[slug]/cost/route.ts
//
// Thin wrapper over getBusinessCostBreakdown() in lib/cost-data.ts, which
// owns both the caching and the one correct product filter. This route
// previously ran its own Prisma query and its own arithmetic, and had a
// bug: it filtered products by vendor market but NOT by status, so DRAFT,
// PENDING_REVIEW, REJECTED and ARCHIVED products were inflating the cost
// range shown on every business card and on the homepage.
//
// Response shape: the legacy keys (low/medium/high/requirementsWithProducts
// /totalRequirements/hasPricing) are preserved so existing consumers keep
// working, with the richer breakdown added alongside.

import { NextRequest, NextResponse } from 'next/server';
import { getBusinessCostBreakdown } from '@/lib/cost-data';
import { DEFAULT_MARKET, isMarketCode } from '@/lib/markets';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const marketParam = req.nextUrl.searchParams.get('market');
    const market = isMarketCode(marketParam) ? marketParam : DEFAULT_MARKET;

    const includeOptional = req.nextUrl.searchParams.get('includeOptional') === 'true';

    const breakdown = await getBusinessCostBreakdown(slug, market, { includeOptional });

    if (!breakdown) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    return NextResponse.json({
      // ── Legacy keys ────────────────────────────────────────────────
      // Kept deliberately: BusinessCards and the homepage read these.
      // They now mean "one-time setup cost", which is what they always
      // described, just computed correctly.
      low: breakdown.oneTime.low,
      medium: breakdown.oneTime.typical,
      high: breakdown.oneTime.high,
      requirementsWithProducts: breakdown.coverage.requirementsWithPricing,
      totalRequirements: breakdown.coverage.totalRequirements,
      hasPricing: breakdown.hasPricing,

      // ── Current shape ──────────────────────────────────────────────
      market: breakdown.market,
      source: breakdown.source,
      sizeBand: breakdown.sizeBand,
      workingCapitalMonths: breakdown.workingCapitalMonths,
      oneTime: breakdown.oneTime,
      monthlyRecurring: breakdown.monthlyRecurring,
      workingCapital: breakdown.workingCapital,
      stock: breakdown.stock,
      cashToOpen: breakdown.cashToOpen,
      coverage: breakdown.coverage,
    });
  } catch (error) {
    console.error('Error calculating business cost:', error);
    return NextResponse.json(
      { error: 'Failed to calculate cost' },
      { status: 500 }
    );
  }
}