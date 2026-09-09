import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MARKET, isMarketCode } from "@/lib/markets";

export async function GET(request: NextRequest) {
  try {
    // market is accepted (HomeSearch already sends it) but not currently
    // used to filter results: Business rows are shared across markets
    // (per the platform's design — see /people/... wait, see the
    // schema comments on Business), and SearchLog has no market column
    // yet, so "most searched" is inherently a shared/global signal today.
    // Kept here so the query string is stable and this route is ready to
    // filter the moment there's something meaningful to filter on (e.g.
    // if SearchLog ever gains a market column, or the fallback list below
    // should be limited to businesses with market-visible requirements).
    const { searchParams } = new URL(request.url);
    const marketParam = searchParams.get("market");
    const market = isMarketCode(marketParam) ? marketParam : DEFAULT_MARKET;
    void market; // acknowledged, not yet used — see comment above

    // Step 1: Get the most searched keywords in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const searchStats = await prisma.searchLog.groupBy({
      by: ['keyword'],
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        keyword: true,
      },
      orderBy: {
        _count: {
          keyword: 'desc',
        },
      },
      take: 10,
    });

    const topKeywords = searchStats.map(s => s.keyword);

    if (topKeywords.length === 0) {
      // Fallback: return recently published businesses
      const recentBusinesses = await prisma.business.findMany({
        where: {
          published: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });

      return NextResponse.json({
        success: true,
        results: recentBusinesses,
        type: "recent"
      });
    }

    // Step 2: Find businesses whose names match the popular keywords
    const matchedBusinesses = await prisma.business.findMany({
      where: {
        published: true,
        OR: topKeywords.map(keyword => ({
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        })),
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      results: matchedBusinesses,
      type: "popular"
    });
  } catch (error) {
    console.error("[POPULAR_BUSINESSES_ERROR]", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch popular businesses"
    }, { status: 500 });
  }
}