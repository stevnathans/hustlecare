import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
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