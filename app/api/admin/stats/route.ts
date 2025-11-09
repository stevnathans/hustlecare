// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

export async function GET() {
  try {
    // Verify user has admin access
    await requirePermission('users.view');

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Fetch all statistics in parallel
    const [
      // User stats
      totalUsers,
      usersThisWeek,
      usersLastWeek,
      activeUsersToday,
      
      // Business stats
      totalBusinesses,
      publishedBusinesses,
      
      // Product stats
      totalProducts,
      avgProductPrice,
      productsWithVendor,
      
      // Requirement stats
      totalRequirements,
      requiredRequirements,
      
      // Comment stats
      totalComments,
      pendingComments,
      
      // Review stats
      totalReviews,
      avgRating,
      pendingReviews,
      
      // Search stats
      totalSearches,
      uniqueKeywords,
      topKeyword,
      
      // Cart stats
      totalCarts,
      cartsWithValue,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({
        where: { createdAt: { gte: weekAgo } }
      }),
      prisma.user.count({
        where: { 
          createdAt: { gte: twoWeeksAgo, lt: weekAgo }
        }
      }),
      prisma.user.count({
        where: { lastLoginAt: { gte: today } }
      }),
      
      // Businesses
      prisma.business.count(),
      prisma.business.count({
        where: { published: true }
      }),
      
      // Products
      prisma.product.count(),
      prisma.product.aggregate({
        _avg: { price: true }
      }),
      prisma.product.count({
        where: { vendorId: { not: null } }
      }),
      
      // Requirements
      prisma.requirement.count(),
      prisma.requirement.count({
        where: { necessity: 'Required' }
      }),
      
      // Comments
      prisma.comment.count(),
      prisma.comment.count({
        where: { isApproved: false }
      }),
      
      // Reviews
      prisma.review.count(),
      prisma.review.aggregate({
        _avg: { rating: true }
      }),
      prisma.review.count({
        where: { isApproved: false }
      }),
      
      // Searches
      prisma.searchLog.count(),
      prisma.searchLog.groupBy({
        by: ['keyword'],
        _count: true
      }),
      prisma.searchLog.groupBy({
        by: ['keyword'],
        _count: { keyword: true },
        orderBy: { _count: { keyword: 'desc' } },
        take: 1
      }),
      
      // Carts
      prisma.cart.count(),
      prisma.cart.findMany({
        where: { totalCost: { not: null } },
        select: { totalCost: true }
      }),
    ]);

    // Calculate derived statistics
    const userTrend = usersLastWeek > 0 
      ? Math.round(((usersThisWeek - usersLastWeek) / usersLastWeek) * 100)
      : 100;

    const totalCartValue = cartsWithValue.reduce(
      (sum, cart) => sum + (cart.totalCost || 0), 
      0
    );
    
    const avgCartValue = totalCarts > 0 
      ? totalCartValue / totalCarts 
      : 0;

    // Construct response
    const stats = {
      users: {
        total: totalUsers,
        activeToday: activeUsersToday,
        newThisWeek: usersThisWeek,
        trend: userTrend,
      },
      businesses: {
        total: totalBusinesses,
        published: publishedBusinesses,
        draft: totalBusinesses - publishedBusinesses,
      },
      products: {
        total: totalProducts,
        averagePrice: avgProductPrice._avg.price || 0,
        byVendor: productsWithVendor,
      },
      requirements: {
        total: totalRequirements,
        required: requiredRequirements,
        optional: totalRequirements - requiredRequirements,
      },
      comments: {
        total: totalComments,
        pending: pendingComments,
        approved: totalComments - pendingComments,
      },
      reviews: {
        total: totalReviews,
        averageRating: avgRating._avg.rating || 0,
        pending: pendingReviews,
      },
      searches: {
        total: totalSearches,
        uniqueKeywords: uniqueKeywords.length,
        topKeyword: topKeyword[0]?.keyword || 'N/A',
      },
      carts: {
        total: totalCarts,
        totalValue: totalCartValue,
        averageValue: avgCartValue,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}