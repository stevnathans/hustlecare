// app/api/admin/trade-classes/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base: string, excludeId?: number): Promise<string> {
  let slug = base || 'trade-class';
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.tradeClass.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

// GET — list all trade classes with usage counts
export async function GET() {
  try {
    await requirePermission('products.view');

    const tradeClasses = await prisma.tradeClass.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { feeSchedules: true, businesses: true } },
        defaultForCategories: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      tradeClasses.map((tc) => ({
        id: tc.id,
        name: tc.name,
        slug: tc.slug,
        description: tc.description,
        feeScheduleCount: tc._count.feeSchedules,
        businessOverrideCount: tc._count.businesses,
        defaultForCategories: tc.defaultForCategories,
        createdAt: tc.createdAt,
        updatedAt: tc.updatedAt,
      }))
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching trade classes:', error);
    return NextResponse.json({ error: 'Failed to fetch trade classes.' }, { status: 500 });
  }
}

// POST — create a new trade class, optionally setting it as the default
// for one or more business categories
export async function POST(request: Request) {
  try {
    const user = await requirePermission('products.create');
    const body = await request.json();
    const { name, description, categoryIds } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
    }

    const slug = await uniqueSlug(slugify(name));

    const tradeClass = await prisma.tradeClass.create({
      data: { name: name.trim(), slug, description: description?.trim() || null },
    });

    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
      await prisma.businessCategory.updateMany({
        where: { id: { in: categoryIds.map(Number) } },
        data: { defaultTradeClassId: tradeClass.id },
      });
    }

    await createAuditLog({
      action: 'CREATE',
      entity: 'TradeClass',
      entityId: tradeClass.id.toString(),
      changes: { name: tradeClass.name, createdBy: user.id },
    });

    return NextResponse.json(tradeClass, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error creating trade class:', error);
    return NextResponse.json({ error: 'Failed to create trade class.' }, { status: 500 });
  }
}