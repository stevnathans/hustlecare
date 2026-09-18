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

    // NOTE: sorting by totalCost still orders on the cached Cart.totalCost
    // column, since that value isn't materialized anywhere else for a DB-level
    // ORDER BY. It's stale for filtering by 0-vs-nonzero, but fine as a rough
    // sort; the *displayed* number below is always the real computed total.
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
      totalItems,
      cartsThisWeek,
      cartsLastWeek,
      carts,
      cartsCountForPagination,
      cartsForTotals,          // <-- NEW: replaces cartValueAgg + the old topBusinesses groupBy
      topProductsRaw,
      topRequirementsRaw,
    ] = await Promise.all([
      prisma.cart.count(),
      prisma.cart.count({ where: cartWhere }),
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

      // Real per-cart + per-business totals, computed from actual CartItem
      // rows instead of the (unreliable) cached Cart.totalCost column.
      prisma.cart.findMany({
        where: cartWhere,
        select: {
          businessId: true,
          items: { select: { quantity: true, unitPrice: true } },
        },
      }),

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

    // ── Derive real totals from cartsForTotals ──────────────────────────
    let totalValueSum = 0;
    const businessTotals = new Map<number, { cartCount: number; totalValue: number }>();
    for (const cart of cartsForTotals) {
      const cartTotal = cart.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
      totalValueSum += cartTotal;
      if (cart.businessId != null) {
        const entry = businessTotals.get(cart.businessId) ?? { cartCount: 0, totalValue: 0 };
        entry.cartCount += 1;
        entry.totalValue += cartTotal;
        businessTotals.set(cart.businessId, entry);
      }
    }
    const averageValue = totalCartsFiltered > 0 ? totalValueSum / totalCartsFiltered : 0;

    const topBusinessEntries = [...businessTotals.entries()]
      .sort((a, b) => b[1].cartCount - a[1].cartCount)
      .slice(0, 10);

    // Resolve names for top businesses / top products
    const businessIds = topBusinessEntries.map(([id]) => id);
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

    const topBusinesses = topBusinessEntries.map(([businessId, agg]) => ({
      businessId,
      businessName: businessMap.get(businessId)?.name ?? 'Unknown business',
      businessSlug: businessMap.get(businessId)?.slug ?? null,
      cartCount: agg.cartCount,
      totalValue: Math.round(agg.totalValue),
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

    // ── Cart rows: totalCost computed from items, not the cached column ──
    const cartRows = carts.map(c => {
      const items = c.items.map(i => ({
        id: i.id,
        requirementName: i.requirementName ?? i.product?.name ?? 'Unspecified Requirement',
        category: i.category ?? 'Uncategorized',
        productName: i.product?.name ?? null,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.quantity * i.unitPrice,
      }));
      return {
        id: c.id,
        name: c.name,
        totalCost: items.reduce((sum, item) => sum + item.lineTotal, 0),
        createdAt: c.createdAt,
        user: c.user,
        business: c.business,
        itemCount: items.length,
        items,
      };
    });

    return NextResponse.json({
      summary: {
        totalCartsAllTime,
        totalCartsInWindow: totalCartsFiltered,
        totalValue: Math.round(totalValueSum),
        averageValue: Math.round(averageValue),
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