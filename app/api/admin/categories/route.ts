// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
  }
  return null;
}

function handleError(error: unknown, fallback = 'Internal server error'): NextResponse {
  const authResponse = handleAuthError(error);
  if (authResponse) return authResponse;
  // FIX: Log message only, not the full error object (avoids leaking stack
  // traces or query details into Vercel logs accessible to team members).
  console.error(fallback + ':', (error as Error).message);
  return NextResponse.json({ error: fallback }, { status: 500 });
}

// FIX: Validate slug format — same rule as businesses route.
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// FIX: Validate and parse numeric IDs consistently across all routes.
function parseId(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function GET() {
  try {
    // REMOVED administrative view check to make categories fetch public-accessible.
    const categories = await prisma.businessCategory.findMany({
      orderBy: { name: 'asc' },
      select: {
        id:   true,
        name: true,
        slug: true,
        _count: { select: { businesses: true } },
        businesses: {
          where:   { published: true },
          select:  { id: true, name: true, slug: true },
          take:    5,
          orderBy: { name: 'asc' },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requirePermission('businesses.create');

    const body = await req.json();
    const { name, slug } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    // FIX: Cap name length.
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
    }

    const resolvedSlug = (slug?.trim() || generateSlug(name)).toLowerCase();

    if (!resolvedSlug) {
      return NextResponse.json({ error: 'Slug could not be generated from name' }, { status: 400 });
    }
    // FIX: Validate generated/provided slug is URL-safe before storing.
    if (!isValidSlug(resolvedSlug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    const [nameTaken, slugTaken] = await Promise.all([
      prisma.businessCategory.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } }),
      prisma.businessCategory.findFirst({ where: { slug: resolvedSlug } }),
    ]);

    if (nameTaken) return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    if (slugTaken) return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 });

    const category = await prisma.businessCategory.create({
      data: { name: name.trim(), slug: resolvedSlug },
      include: { _count: { select: { businesses: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleError(error, 'Failed to create category');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('businesses.update');

    const body = await req.json();
    const { id, name, slug } = body;

    const categoryId = parseId(id);
    if (!categoryId) {
      return NextResponse.json({ error: 'Valid category ID is required' }, { status: 400 });
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be 100 characters or fewer' }, { status: 400 });
    }

    const resolvedSlug = slug?.trim()
      ? slug.trim().toLowerCase()
      : generateSlug(name);

    if (!isValidSlug(resolvedSlug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase letters, numbers, and hyphens only' },
        { status: 400 }
      );
    }

    const existing = await prisma.businessCategory.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const [nameTaken, slugTaken] = await Promise.all([
      prisma.businessCategory.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, NOT: { id: categoryId } },
      }),
      prisma.businessCategory.findFirst({
        where: { slug: resolvedSlug, NOT: { id: categoryId } },
      }),
    ]);

    if (nameTaken) return NextResponse.json({ error: 'A category with this name already exists' }, { status: 409 });
    if (slugTaken) return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 409 });

    const updated = await prisma.businessCategory.update({
      where: { id: categoryId },
      data:  { name: name.trim(), slug: resolvedSlug },
      include: { _count: { select: { businesses: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error, 'Failed to update category');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('businesses.delete');

    const body = await req.json();
    const categoryId = parseId(body.id);
    if (!categoryId) {
      return NextResponse.json({ error: 'Valid category ID is required' }, { status: 400 });
    }

    const category = await prisma.businessCategory.findUnique({
      where:   { id: categoryId },
      include: { _count: { select: { businesses: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (category._count.businesses > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete "${category.name}" — ${category._count.businesses} business${
            category._count.businesses !== 1 ? 'es are' : ' is'
          } using it. Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.businessCategory.delete({ where: { id: categoryId } });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    return handleError(error, 'Failed to delete category');
  }
}