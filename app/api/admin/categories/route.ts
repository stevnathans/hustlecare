// app/api/admin/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

// GET - List all categories with business counts
export async function GET() {
  try {
    await requirePermission('businesses.view');

    const categories = await prisma.businessCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { businesses: true } },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return handleError(error);
  }
}

// POST - Create a new category
export async function POST(req: NextRequest) {
  try {
    await requirePermission('businesses.create');

    const body = await req.json();
    const { name, slug } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const resolvedSlug = (slug?.trim() || generateSlug(name)).toLowerCase();

    if (!resolvedSlug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Check uniqueness
    const [nameTaken, slugTaken] = await Promise.all([
      prisma.businessCategory.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } }),
      prisma.businessCategory.findFirst({ where: { slug: resolvedSlug } }),
    ]);

    if (nameTaken) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 });
    }
    if (slugTaken) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const category = await prisma.businessCategory.create({
      data: { name: name.trim(), slug: resolvedSlug },
      include: { _count: { select: { businesses: true } } },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return handleError(error, 'Failed to create category');
  }
}

// PATCH - Update an existing category
export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('businesses.update');

    const body = await req.json();
    const { id, name, slug } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const resolvedSlug = slug?.trim()
      ? slug.trim().toLowerCase()
      : generateSlug(name);

    // Confirm it exists
    const existing = await prisma.businessCategory.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    // Check conflicts on name/slug (excluding self)
    const [nameTaken, slugTaken] = await Promise.all([
      prisma.businessCategory.findFirst({
        where: { name: { equals: name.trim(), mode: 'insensitive' }, NOT: { id: Number(id) } },
      }),
      prisma.businessCategory.findFirst({
        where: { slug: resolvedSlug, NOT: { id: Number(id) } },
      }),
    ]);

    if (nameTaken) {
      return NextResponse.json({ error: 'A category with this name already exists' }, { status: 400 });
    }
    if (slugTaken) {
      return NextResponse.json({ error: 'A category with this slug already exists' }, { status: 400 });
    }

    const updated = await prisma.businessCategory.update({
      where: { id: Number(id) },
      data: { name: name.trim(), slug: resolvedSlug },
      include: { _count: { select: { businesses: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    return handleError(error, 'Failed to update category');
  }
}

// DELETE - Delete a category (only if no businesses are attached)
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('businesses.delete');

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const category = await prisma.businessCategory.findUnique({
      where: { id: Number(id) },
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

    await prisma.businessCategory.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return handleError(error, 'Failed to delete category');
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function handleError(error: unknown, fallback = 'Internal server error') {
  if (error instanceof Error) {
    if (error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}