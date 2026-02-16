// app/api/admin/users/stats/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

export async function GET() {
  try {
    await requirePermission('users.view');

    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    // Fetch statistics in parallel
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminUsers,
      editorUsers,
      authorUsers,
      reviewerUsers,
      regularUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      verifiedUsers,
      usersWithActivity,
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      
      // By role
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'editor' } }),
      prisma.user.count({ where: { role: 'author' } }),
      prisma.user.count({ where: { role: 'reviewer' } }),
      prisma.user.count({ where: { role: 'user' } }),
      
      // By time period
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      
      // Other stats
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({
        where: {
          OR: [
            { carts: { some: {} } },
            { comments: { some: {} } },
            { reviews: { some: {} } },
          ]
        }
      }),
    ]);

    // Calculate engagement rate
    const engagementRate = totalUsers > 0 
      ? Math.round((usersWithActivity / totalUsers) * 100) 
      : 0;

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      
      // By role
      admins: adminUsers,
      editors: editorUsers,
      authors: authorUsers,
      reviewers: reviewerUsers,
      users: regularUsers,
      
      // New users
      newToday,
      newThisWeek,
      newThisMonth,
      
      // Additional metrics
      verified: verifiedUsers,
      withActivity: usersWithActivity,
      engagementRate,
      
      // Percentages
      activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
      verifiedPercentage: totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    
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