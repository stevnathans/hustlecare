/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/marketplace/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PAGE_SIZE = 20;
const MAX_BUSINESS_SUGGESTIONS = 6;

// Ordering used elsewhere in the app (useBusinessData) — reused here so
// category chips appear in a consistent, sensible order rather than
// whatever order they happen to come back in.
const CATEGORY_ORDER = ['Legal', 'Equipment', 'Software', 'Documents', 'Branding', 'Operating Expenses', 'Uncategorized'];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const businessSlug = searchParams.get('business') || undefined;
  const category = searchParams.get('category') || undefined;
  const condition = searchParams.get('condition') || undefined;
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const sort = searchParams.get('sort') || 'newest';
  const page = Math.max(Number(searchParams.get('page')) || 1, 1);

  try {
    // ── Explicit business scope ────────────────────────────────────────────
    // Set when the user clicked a business suggestion, or arrived via a
    // "shop for this business" link elsewhere in the app (?business=slug).
    // This is authoritative — it overrides free-text matching entirely.
    let activeBusiness: { id: number; name: string; slug: string } | null = null;
    if (businessSlug) {
      activeBusiness = await prisma.business.findUnique({
        where: { slug: businessSlug },
        select: { id: true, name: true, slug: true },
      });
    }

    // ── Business name suggestions for free-text queries ────────────────────
    // "Barbershop" → any published business whose name contains it. Used
    // both to build the OR filter below and to show a "shop by business"
    // strip in the UI when more than one business matches.
    let matchedBusinesses: { id: number; name: string; slug: string }[] = [];
    if (q.length >= 2 && !activeBusiness) {
      matchedBusinesses = await prisma.business.findMany({
        where: { published: true, name: { contains: q, mode: 'insensitive' } },
        select: { id: true, name: true, slug: true },
        take: MAX_BUSINESS_SUGGESTIONS,
        orderBy: { name: 'asc' },
      });
    }

    // ── Base product filter ─────────────────────────────────────────────────
    const baseWhere: any = { status: 'ACTIVE' };

    if (activeBusiness) {
      // Scoped: only products tagged to this exact business.
      baseWhere.businessTags = { has: activeBusiness.id };
    } else if (q.length >= 2) {
      const matchedBusinessIds = matchedBusinesses.map((b) => b.id);
      baseWhere.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        // This is what makes typing "Barbershop" return barbershop products
        // even though "Barbershop" never appears in any product's name.
        ...(matchedBusinessIds.length ? [{ businessTags: { hasSome: matchedBusinessIds } }] : []),
      ];
    }

    if (condition && ['NEW', 'USED'].includes(condition)) baseWhere.condition = condition;
    if (minPrice || maxPrice) {
      baseWhere.price = {};
      if (minPrice) baseWhere.price.gte = Number(minPrice);
      if (maxPrice) baseWhere.price.lte = Number(maxPrice);
    }

    // ── Category facets ─────────────────────────────────────────────────────
    // Computed against baseWhere (before the category filter itself is
    // applied) so switching categories doesn't make the other counts
    // collapse to zero. Category lives on RequirementTemplate, not Product
    // directly, so this can't be a Prisma groupBy — it's aggregated in JS.
    // NOTE: at real scale this should either be cached or Product should
    // carry a denormalized `category` column synced from its template;
    // fine for now given expected catalog size.
    const facetRows = await prisma.product.findMany({
      where: baseWhere,
      select: { template: { select: { category: true } } },
      take: 5000,
    });
    const categoryCounts = new Map<string, number>();
    for (const p of facetRows) {
      const cat = p.template?.category || 'Uncategorized';
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }
    const categories = Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        const ai = CATEGORY_ORDER.indexOf(a.name);
        const bi = CATEGORY_ORDER.indexOf(b.name);
        if (ai === -1 && bi === -1) return b.count - a.count;
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });

    const where = category ? { ...baseWhere, template: { category } } : baseWhere;

    const orderBy =
      sort === 'price_asc' ? { price: 'asc' as const } :
      sort === 'price_desc' ? { price: 'desc' as const } :
      { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: { select: { id: true, name: true, slug: true, logo: true, isVerified: true } },
          template: { select: { id: true, name: true, category: true, necessity: true } },
          bulkPricing: { select: { minQty: true, price: true }, orderBy: { minQty: 'asc' } },
        },
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      total,
      page,
      pageSize: PAGE_SIZE,
      categories,
      activeBusiness,
      matchedBusinesses: activeBusiness ? [] : matchedBusinesses,
    });
  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
}