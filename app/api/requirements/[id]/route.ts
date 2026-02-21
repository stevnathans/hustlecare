// app/api/requirements/[id]/route.ts
// Manages a single RequirementTemplate — update or soft-delete (deprecate).
// Updates here propagate automatically to all linked businesses
// because BusinessRequirement reads from the template at query time.

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/requirements/:id
// Returns a single template with its linked businesses and products.
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(id) },
      include: {
        businesses: {
          include: {
            business: {
              select: { id: true, name: true, slug: true, published: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        products: {
          select: { id: true, name: true, price: true, image: true },
          orderBy: { name: "asc" },
        },
        _count: {
          select: { businesses: true, products: true },
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: template.id,
      name: template.name,
      description: template.description,
      image: template.image,
      category: template.category,
      necessity: template.necessity,
      isDeprecated: template.isDeprecated,
      deprecatedAt: template.deprecatedAt,
      productCount: template._count.products,
      businessCount: template._count.businesses,
      businesses: template.businesses.map((br) => ({
        linkId: br.id,
        businessId: br.business.id,
        businessName: br.business.name,
        businessSlug: br.business.slug,
        published: br.business.published,
        descriptionOverride: br.descriptionOverride,
        isActive: br.isActive,
        source: br.source,
        linkedAt: br.createdAt,
      })),
      products: template.products,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error("Failed to fetch requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// PATCH /api/requirements/:id
// Updates a template. Changes propagate automatically to all linked businesses
// because links read from the template at query time.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, image, category, necessity } = body;

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(id) },
    });

    if (!template) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    if (template.isDeprecated) {
      return NextResponse.json(
        { error: "Cannot update a deprecated requirement. Restore it first." },
        { status: 400 }
      );
    }

    const updated = await prisma.requirementTemplate.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(category !== undefined && { category }),
        ...(necessity !== undefined && { necessity }),
      },
      include: {
        _count: { select: { businesses: true, products: true } },
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      image: updated.image,
      category: updated.category,
      necessity: updated.necessity,
      productCount: updated._count.products,
      businessCount: updated._count.businesses,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/requirements/:id
// Soft-deletes (deprecates) a template rather than hard-deleting,
// so existing BusinessRequirement links remain intact.
// Pass { force: true } in the body to hard-delete a template with no links.
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { force = false } = body;

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { businesses: true } } },
    });

    if (!template) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    // If there are linked businesses, soft-delete only
    if (template._count.businesses > 0) {
      if (force) {
        return NextResponse.json(
          {
            error: `Cannot force-delete: ${template._count.businesses} business(es) still linked. Unlink them first.`,
          },
          { status: 400 }
        );
      }

      // Soft delete — mark as deprecated
      await prisma.requirementTemplate.update({
        where: { id: Number(id) },
        data: { isDeprecated: true, deprecatedAt: new Date() },
      });

      return NextResponse.json({
        message: `Requirement deprecated. ${template._count.businesses} existing business link(s) are unaffected.`,
        deprecated: true,
      });
    }

    // No links — safe to hard delete
    await prisma.requirementTemplate.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Requirement permanently deleted", deleted: true });
  } catch (error) {
    console.error("Failed to delete requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}