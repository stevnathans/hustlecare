// app/api/admin/stats/route.ts
// Dashboard statistics — updated to reflect the new requirement library architecture.
// requirements.templates = count of RequirementTemplate records (library size)
// requirements.businessLinks = total BusinessRequirement links across all businesses
//
// Also now includes vendor-related pending-action counts:
// vendors.pendingApplications = VendorApplication rows awaiting admin review
// vendors.pendingAppeals      = Vendor rows with a suspension appeal awaiting review
// vendors.pendingProducts     = Product rows submitted by vendors awaiting review
//
// Trend fields: week-over-week % change in NEW records created, matching the
// pattern already used for users.trend. `null` means there's no prior-week
// baseline to compare against (frontend renders this as a "New" badge rather
// than a misleading 0%).

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

function calcTrend(current: number, previous: number): number | null {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  if (current > 0) return null; // new activity, no baseline to compare against
  return 0; // both zero — genuinely flat
}

export async function GET() {
  try {
    await requirePermission('audit.view');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 604800000);
    const twoWeeksAgo = new Date(now.getTime() - 1209600000);

    const [
      totalUsers,
      activeToday,
      newThisWeekUsers,
      lastWeekUsers,
      totalBusinesses,
      publishedBusinesses,
      draftBusinesses,
      businessesThisWeek,
      businessesLastWeek,
      totalProducts,
      avgPrice,
      vendorCount,
      productsThisWeek,
      productsLastWeek,
      totalTemplates,
      totalBusinessLinks,
      requiredTemplates,
      optionalTemplates,
      totalComments,
      pendingComments,
      approvedComments,
      commentsThisWeek,
      commentsLastWeek,
      totalReviews,
      avgRating,
      pendingReviews,
      reviewsThisWeek,
      reviewsLastWeek,
      totalSearches,
      uniqueKeywords,
      topKeyword,
      searchesThisWeek,
      searchesLastWeek,
      totalCarts,
      cartValue,
      cartValueThisWeek,
      cartValueLastWeek,
      pendingVendorApplications,
      pendingVendorAppeals,
      pendingVendorProducts,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { lastLoginAt: { gte: new Date(Date.now() - 86400000) } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Businesses
      prisma.business.count(),
      prisma.business.count({ where: { published: true } }),
      prisma.business.count({ where: { published: false } }),
      prisma.business.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.business.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Products
      prisma.product.count(),
      prisma.product.aggregate({ _avg: { price: true } }),
      prisma.vendor.count(),
      prisma.product.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.product.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Requirements — library templates
      prisma.requirementTemplate.count({ where: { isDeprecated: false } }),
      prisma.businessRequirement.count({ where: { isActive: true } }),
      prisma.requirementTemplate.count({ where: { necessity: 'Required', isDeprecated: false } }),
      prisma.requirementTemplate.count({ where: { necessity: 'Optional', isDeprecated: false } }),

      // Comments
      prisma.comment.count(),
      prisma.comment.count({ where: { isApproved: false } }),
      prisma.comment.count({ where: { isApproved: true } }),
      prisma.comment.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.comment.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Reviews
      prisma.review.count(),
      prisma.review.aggregate({ _avg: { rating: true } }),
      prisma.review.count({ where: { isApproved: false } }),
      prisma.review.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.review.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Searches
      prisma.searchLog.count(),
      prisma.searchLog.groupBy({ by: ['keyword'], _count: true }).then(r => r.length),
      prisma.searchLog.groupBy({ by: ['keyword'], _count: { keyword: true }, orderBy: { _count: { keyword: 'desc' } }, take: 1 }).then(r => r[0]?.keyword ?? 'N/A'),
      prisma.searchLog.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.searchLog.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Carts
      prisma.cart.count(),
      prisma.cart.aggregate({ _sum: { totalCost: true } }),
      prisma.cart.aggregate({ _sum: { totalCost: true }, where: { createdAt: { gte: weekAgo } } }),
      prisma.cart.aggregate({ _sum: { totalCost: true }, where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      // Vendor pending actions
      prisma.vendorApplication.count({ where: { status: 'PENDING' } }),
      prisma.vendor.count({ where: { appealStatus: 'PENDING' } }),
      prisma.product.count({ where: { status: 'PENDING_REVIEW' } }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        activeToday,
        newThisWeek: newThisWeekUsers,
        trend: calcTrend(newThisWeekUsers, lastWeekUsers),
      },
      businesses: {
        total: totalBusinesses,
        published: publishedBusinesses,
        draft: draftBusinesses,
        trend: calcTrend(businessesThisWeek, businessesLastWeek),
      },
      products: {
        total: totalProducts,
        averagePrice: Math.round(avgPrice._avg.price ?? 0),
        byVendor: vendorCount,
        trend: calcTrend(productsThisWeek, productsLastWeek),
      },
      requirements: {
        templates: totalTemplates,
        businessLinks: totalBusinessLinks,
        total: totalTemplates,
        required: requiredTemplates,
        optional: optionalTemplates,
      },
      comments: {
        total: totalComments,
        pending: pendingComments,
        approved: approvedComments,
        trend: calcTrend(commentsThisWeek, commentsLastWeek),
      },
      reviews: {
        total: totalReviews,
        averageRating: avgRating._avg.rating ?? 0,
        pending: pendingReviews,
        trend: calcTrend(reviewsThisWeek, reviewsLastWeek),
      },
      searches: {
        total: totalSearches,
        uniqueKeywords,
        topKeyword,
        trend: calcTrend(searchesThisWeek, searchesLastWeek),
      },
      carts: {
        total: totalCarts,
        totalValue: Math.round(cartValue._sum.totalCost ?? 0),
        averageValue: totalCarts > 0 ? Math.round((cartValue._sum.totalCost ?? 0) / totalCarts) : 0,
        trend: calcTrend(
          Math.round(cartValueThisWeek._sum.totalCost ?? 0),
          Math.round(cartValueLastWeek._sum.totalCost ?? 0)
        ),
      },
      vendors: {
        pendingApplications: pendingVendorApplications,
        pendingAppeals: pendingVendorAppeals,
        pendingProducts: pendingVendorProducts,
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