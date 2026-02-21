// app/api/admin/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

async function resolveCategoryId(categoryName?: string): Promise<number | undefined> {
  if (!categoryName || !categoryName.trim()) return undefined;
  const trimmedName = categoryName.trim();
  const slug = trimmedName.toLowerCase().replace(/\s+/g, '-');
  const category = await prisma.businessCategory.upsert({
    where: { name: trimmedName },
    update: {},
    create: { name: trimmedName, slug },
  });
  return category.id;
}

// GET - Fetch all businesses with counts
export async function GET() {
  try {
    await requirePermission('businesses.view');

    const businesses = await prisma.business.findMany({
      include: {
        _count: {
          select: {
            requirements: true, // now counts BusinessRequirement links
            carts: true,
            searches: true,
          },
        },
        user: { select: { name: true, email: true } },
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
      }
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new business
export async function POST(req: NextRequest) {
  try {
    const user = await requirePermission('businesses.create');
    const body = await req.json();
    const { name, slug, description, image, published = true, categoryName } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const existingBusiness = await prisma.business.findUnique({ where: { slug } });
    if (existingBusiness) {
      return NextResponse.json({ error: 'A business with this slug already exists' }, { status: 400 });
    }

    const categoryId = await resolveCategoryId(categoryName);

    const business = await prisma.business.create({
      data: {
        name, slug, description, image, published,
        userId: user.id,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        _count: { select: { requirements: true } },
        category: true,
      },
    });

    await createAuditLog({
      action: 'CREATE', entity: 'Business', entityId: business.id.toString(),
      changes: { created: { name: business.name, slug: business.slug, published: business.published, category: business.category?.name ?? null } },
      req,
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to create business' }, { status: 500 });
  }
}

// PATCH - Update existing business
export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('businesses.update');
    const body = await req.json();
    const { id, categoryName, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const oldBusiness = await prisma.business.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });

    if (!oldBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    if (updateData.slug && updateData.slug !== oldBusiness.slug) {
      const slugExists = await prisma.business.findUnique({ where: { slug: updateData.slug } });
      if (slugExists) {
        return NextResponse.json({ error: 'A business with this slug already exists' }, { status: 400 });
      }
    }

    let categoryUpdate: { categoryId?: number | null } = {};
    if (categoryName !== undefined) {
      if (!categoryName || !categoryName.trim()) {
        categoryUpdate = { categoryId: null };
      } else {
        const categoryId = await resolveCategoryId(categoryName);
        categoryUpdate = { categoryId };
      }
    }

    const business = await prisma.business.update({
      where: { id: Number(id) },
      data: { ...updateData, ...categoryUpdate },
      include: {
        _count: { select: { requirements: true } },
        category: true,
      },
    });

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const key in updateData) {
      if (oldBusiness[key as keyof typeof oldBusiness] !== updateData[key]) {
        changes[key] = { old: oldBusiness[key as keyof typeof oldBusiness], new: updateData[key] };
      }
    }
    if (categoryName !== undefined && oldBusiness.category?.name !== categoryName) {
      changes['category'] = { old: oldBusiness.category?.name ?? null, new: categoryName || null };
    }

    await createAuditLog({ action: 'UPDATE', entity: 'Business', entityId: id.toString(), changes, req });

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error updating business:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to update business' }, { status: 500 });
  }
}

// DELETE - Delete business
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('businesses.delete');
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          // requirements now counts BusinessRequirement links
          select: { requirements: true, carts: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // BusinessRequirement records cascade-delete when the business is deleted,
    // but we still warn the admin so they're aware.
    if (business._count.requirements > 0) {
      return NextResponse.json(
        { error: `This business has ${business._count.requirements} linked requirement(s). Remove them first or confirm deletion.` },
        { status: 400 }
      );
    }

    if (business._count.carts > 0) {
      return NextResponse.json(
        { error: `Cannot delete business with ${business._count.carts} active cart(s).` },
        { status: 400 }
      );
    }

    await prisma.business.delete({ where: { id: Number(id) } });

    await createAuditLog({
      action: 'DELETE', entity: 'Business', entityId: id.toString(),
      changes: { deleted: { name: business.name, slug: business.slug } },
      req,
    });

    return NextResponse.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 });
      }
    }
    return NextResponse.json({ error: 'Failed to delete business' }, { status: 500 });
  }
}