// app/api/admin/stats/route.ts
// Dashboard statistics — updated to reflect the new requirement library architecture.
// requirements.templates = count of RequirementTemplate records (library size)
// requirements.businessLinks = total BusinessRequirement links across all businesses

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

export async function GET() {
  try {
    await requirePermission('audit.view');

    const [
      totalUsers,
      activeToday,
      newThisWeek,
      totalBusinesses,
      publishedBusinesses,
      draftBusinesses,
      totalProducts,
      avgPrice,
      vendorCount,
      // New: separate counts for templates vs links
      totalTemplates,
      totalBusinessLinks,
      requiredTemplates,
      optionalTemplates,
      totalComments,
      pendingComments,
      approvedComments,
      totalReviews,
      avgRating,
      pendingReviews,
      totalSearches,
      uniqueKeywords,
      topKeyword,
      totalCarts,
      cartValue,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 86400000) } } }),
      prisma.user.count({ where: { createdAt: { gte: new Date(Date.now() - 604800000) } } }),

      // Businesses
      prisma.business.count(),
      prisma.business.count({ where: { published: true } }),
      prisma.business.count({ where: { published: false } }),

      // Products
      prisma.product.count(),
      prisma.product.aggregate({ _avg: { price: true } }),
      prisma.vendor.count(),

      // Requirements — library templates
      prisma.requirementTemplate.count({ where: { isDeprecated: false } }),
      // Requirements — total business links
      prisma.businessRequirement.count({ where: { isActive: true } }),
      prisma.requirementTemplate.count({ where: { necessity: 'Required', isDeprecated: false } }),
      prisma.requirementTemplate.count({ where: { necessity: 'Optional', isDeprecated: false } }),

      // Comments
      prisma.comment.count(),
      prisma.comment.count({ where: { isApproved: false } }),
      prisma.comment.count({ where: { isApproved: true } }),

      // Reviews
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.review.count({ where: { isApproved: false } }),

      // Searches
      prisma.searchLog.count(),
      prisma.searchLog.groupBy({ by: ['keyword'], _count: true }).then(r => r.length),
      prisma.searchLog.groupBy({ by: ['keyword'], _count: { keyword: true }, orderBy: { _count: { keyword: 'desc' } }, take: 1 }).then(r => r[0]?.keyword ?? 'N/A'),

      // Carts
      prisma.cart.count(),
      prisma.cart.aggregate({ _sum: { totalCost: true } }),
    ]);

    // User trend (compare new users this week vs last week)
    const lastWeekUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 1209600000),
          lt: new Date(Date.now() - 604800000),
        },
      },
    });
    const trend = lastWeekUsers > 0 ? Math.round(((newThisWeek - lastWeekUsers) / lastWeekUsers) * 100) : 0;

    return NextResponse.json({
      users: {
        total: totalUsers,
        activeToday,
        newThisWeek,
        trend,
      },
      businesses: {
        total: totalBusinesses,
        published: publishedBusinesses,
        draft: draftBusinesses,
      },
      products: {
        total: totalProducts,
        averagePrice: Math.round(avgPrice._avg.price ?? 0),
        byVendor: vendorCount,
      },
      requirements: {
        // Library size
        templates: totalTemplates,
        // Total active links across all businesses
        businessLinks: totalBusinessLinks,
        // For backward compat with the dashboard card (shows total)
        total: totalTemplates,
        required: requiredTemplates,
        optional: optionalTemplates,
      },
      comments: {
        total: totalComments,
        pending: pendingComments,
        approved: approvedComments,
      },
      reviews: {
        total: totalReviews,
        averageRating: avgRating._avg.rating ?? 0,
        pending: pendingReviews,
      },
      searches: {
        total: totalSearches,
        uniqueKeywords,
        topKeyword,
      },
      carts: {
        total: totalCarts,
        totalValue: Math.round(cartValue._sum.totalCost ?? 0),
        averageValue: totalCarts > 0 ? Math.round((cartValue._sum.totalCost ?? 0) / totalCarts) : 0,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}