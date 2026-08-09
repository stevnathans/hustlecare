// app/api/admin/carts/route.ts
// Cart analytics for the /admin/carts page.
//
// A "cart" here is a user's saved set of startup-cost requirements for a
// specific business — Cart.totalCost is the sum of the requirement/product
// costs they've added, i.e. their estimated startup cost. This is why
// "Total Cart Value" on the main dashboard links here: it's the aggregate
// of estimated startup costs across everyone using the calculator, not
// confirmed revenue.
//
// Query params:
//   page      — 1-indexed page for the carts table (default 1)
//   pageSize  — rows per page, capped at 100 (default 20)
//   search    — matches user name/email or business name
//   sortField — 'createdAt' | 'totalCost' | 'businessName' | 'userName'
//   sortDir   — 'asc' | 'desc' (default 'desc')
//   days      — 'all' | '7' | '30' | '90' (default 'all') — window applied
//               to the summary, top lists, and the carts table alike

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

function calcTrend(current: number, previous: number): number | null {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100);
  if (current > 0) return null;
  return 0;
}

function parseDaysFilter(days: string | null): Date | undefined {
  if (!days || days === 'all') return undefined;
  const n = parseInt(days, 10);
  if (Number.isNaN(n) || n <= 0) return undefined;
  return new Date(Date.now() - n * 86400000);
}

export async function GET(req: NextRequest) {
  try {
    await requirePermission('carts.view');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20));
    const search = (searchParams.get('search') || '').trim();
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDir: 'asc' | 'desc' = searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc';
    const daysParam = searchParams.get('days');
    const sinceDate = parseDaysFilter(daysParam);

    const cartWhere: Prisma.CartWhereInput = {};
    if (sinceDate) cartWhere.createdAt = { gte: sinceDate };
    if (search) {
      cartWhere.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { business: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const itemWhere: Prisma.CartItemWhereInput = sinceDate ? { createdAt: { gte: sinceDate } } : {};

    let orderBy: Prisma.CartOrderByWithRelationInput;
    switch (sortField) {
      case 'totalCost': orderBy = { totalCost: sortDir }; break;
      case 'businessName': orderBy = { business: { name: sortDir } }; break;
      case 'userName': orderBy = { user: { name: sortDir } }; break;
      default: orderBy = { createdAt: sortDir };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 604800000);
    const twoWeeksAgo = new Date(now.getTime() - 1209600000);

    const [
      totalCartsAllTime,
      totalCartsFiltered,
      cartValueAgg,
      totalItems,
      cartsThisWeek,
      cartsLastWeek,
      carts,
      cartsCountForPagination,
      topBusinessesRaw,
      topProductsRaw,
      topRequirementsRaw,
    ] = await Promise.all([
      prisma.cart.count(),
      prisma.cart.count({ where: cartWhere }),
      prisma.cart.aggregate({ _sum: { totalCost: true }, _avg: { totalCost: true }, where: cartWhere }),
      prisma.cartItem.count({ where: itemWhere }),
      prisma.cart.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.cart.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),

      prisma.cart.findMany({
        where: cartWhere,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          totalCost: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          business: { select: { id: true, name: true, slug: true } },
          items: {
            select: {
              id: true,
              requirementName: true,
              category: true,
              quantity: true,
              unitPrice: true,
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.cart.count({ where: cartWhere }),

      // Top businesses by cart count
      prisma.cart.groupBy({
        by: ['businessId'],
        where: cartWhere,
        _count: { _all: true },
        _sum: { totalCost: true },
        orderBy: { _count: { businessId: 'desc' } },
        take: 10,
      }),

      // Top products by cart-add count, with real dollar totals via raw SQL
      // (quantity * unitPrice can't be summed through Prisma's groupBy)
      sinceDate
        ? prisma.$queryRaw<{ productId: number; cartAddCount: number; totalQuantity: number; totalValue: number }[]>`
            SELECT "productId",
                   COUNT(*)::int AS "cartAddCount",
                   SUM(quantity)::int AS "totalQuantity",
                   SUM(quantity * "unitPrice")::float AS "totalValue"
            FROM "CartItem"
            WHERE "createdAt" >= ${sinceDate}
            GROUP BY "productId"
            ORDER BY "cartAddCount" DESC
            LIMIT 10
          `
        : prisma.$queryRaw<{ productId: number; cartAddCount: number; totalQuantity: number; totalValue: number }[]>`
            SELECT "productId",
                   COUNT(*)::int AS "cartAddCount",
                   SUM(quantity)::int AS "totalQuantity",
                   SUM(quantity * "unitPrice")::float AS "totalValue"
            FROM "CartItem"
            GROUP BY "productId"
            ORDER BY "cartAddCount" DESC
            LIMIT 10
          `,

      // Top requirements by cart-add count, across all businesses
      sinceDate
        ? prisma.$queryRaw<{ requirementName: string | null; category: string | null; cartAddCount: number; totalQuantity: number; totalValue: number }[]>`
            SELECT "requirementName", "category",
                   COUNT(*)::int AS "cartAddCount",
                   SUM(quantity)::int AS "totalQuantity",
                   SUM(quantity * "unitPrice")::float AS "totalValue"
            FROM "CartItem"
            WHERE "createdAt" >= ${sinceDate}
            GROUP BY "requirementName", "category"
            ORDER BY "cartAddCount" DESC
            LIMIT 10
          `
        : prisma.$queryRaw<{ requirementName: string | null; category: string | null; cartAddCount: number; totalQuantity: number; totalValue: number }[]>`
            SELECT "requirementName", "category",
                   COUNT(*)::int AS "cartAddCount",
                   SUM(quantity)::int AS "totalQuantity",
                   SUM(quantity * "unitPrice")::float AS "totalValue"
            FROM "CartItem"
            GROUP BY "requirementName", "category"
            ORDER BY "cartAddCount" DESC
            LIMIT 10
          `,
    ]);

    // Resolve names for the raw/groupBy results
    const businessIds = topBusinessesRaw.map(b => b.businessId);
    const productIds = topProductsRaw.map(p => p.productId);

    const [businesses, products] = await Promise.all([
      businessIds.length
        ? prisma.business.findMany({ where: { id: { in: businessIds } }, select: { id: true, name: true, slug: true } })
        : Promise.resolve([]),
      productIds.length
        ? prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, vendor: { select: { name: true } } },
          })
        : Promise.resolve([]),
    ]);

    const businessMap = new Map(businesses.map(b => [b.id, b]));
    const productMap = new Map(products.map(p => [p.id, p]));

    const topBusinesses = topBusinessesRaw.map(b => ({
      businessId: b.businessId,
      businessName: businessMap.get(b.businessId)?.name ?? 'Unknown business',
      businessSlug: businessMap.get(b.businessId)?.slug ?? null,
      cartCount: b._count._all,
      totalValue: Math.round(b._sum.totalCost ?? 0),
    }));

    const topProducts = topProductsRaw.map(p => ({
      productId: p.productId,
      productName: productMap.get(p.productId)?.name ?? 'Unknown product',
      vendorName: productMap.get(p.productId)?.vendor?.name ?? null,
      cartAddCount: p.cartAddCount,
      totalQuantity: p.totalQuantity,
      totalValue: Math.round(p.totalValue ?? 0),
    }));

    const topRequirements = topRequirementsRaw.map(r => ({
      requirementName: r.requirementName ?? 'Unspecified Requirement',
      category: r.category,
      cartAddCount: r.cartAddCount,
      totalQuantity: r.totalQuantity,
      totalValue: Math.round(r.totalValue ?? 0),
    }));

    const cartRows = carts.map(c => ({
      id: c.id,
      name: c.name,
      totalCost: c.totalCost ?? 0,
      createdAt: c.createdAt,
      user: c.user,
      business: c.business,
      itemCount: c.items.length,
      items: c.items.map(i => ({
        id: i.id,
        requirementName: i.requirementName ?? i.product?.name ?? 'Unspecified Requirement',
        category: i.category ?? 'Uncategorized',
        productName: i.product?.name ?? null,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.quantity * i.unitPrice,
      })),
    }));

    return NextResponse.json({
      summary: {
        totalCartsAllTime,
        totalCartsInWindow: totalCartsFiltered,
        totalValue: Math.round(cartValueAgg._sum.totalCost ?? 0),
        averageValue: Math.round(cartValueAgg._avg.totalCost ?? 0),
        totalItems,
        averageItemsPerCart: totalCartsFiltered > 0 ? Math.round((totalItems / totalCartsFiltered) * 10) / 10 : 0,
        cartsThisWeek,
        cartsLastWeek,
        trend: calcTrend(cartsThisWeek, cartsLastWeek),
      },
      topBusinesses,
      topProducts,
      topRequirements,
      carts: cartRows,
      pagination: {
        page,
        pageSize,
        total: cartsCountForPagination,
        totalPages: Math.max(1, Math.ceil(cartsCountForPagination / pageSize)),
      },
    });
  } catch (error) {
    console.error('Cart stats error:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to fetch cart stats' }, { status: 500 });
  }
}