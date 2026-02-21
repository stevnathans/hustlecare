// app/api/admin/businesses/[id]/requirements/route.ts
// Manages requirements from the business side.
// Handles: listing linked requirements, adding (link existing or create+link), unlinking, updating override.

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/admin/businesses/:id/requirements
// Returns all requirements linked to this business, with resolved effective description.
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const business = await prisma.business.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const links = await prisma.businessRequirement.findMany({
      where: { businessId: Number(id) },
      include: {
        template: {
          include: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    const shaped = links.map((link) => {
      // Resolve effective description: override wins, else resolve token in template description
      const templateDesc = link.template.description ?? "";
      const resolvedTemplateDesc = templateDesc.replace(/\[businessName\]/gi, business.name);
      const effectiveDescription = link.descriptionOverride ?? resolvedTemplateDesc;

      return {
        linkId: link.id,
        templateId: link.template.id,
        name: link.template.name,
        description: effectiveDescription,
        descriptionOverride: link.descriptionOverride,
        templateDescription: resolvedTemplateDesc,
        image: link.template.image,
        category: link.template.category,
        necessity: link.template.necessity,
        isDeprecated: link.template.isDeprecated,
        isActive: link.isActive,
        displayOrder: link.displayOrder,
        source: link.source,
        productCount: link.template._count.products,
        linkedAt: link.createdAt,
      };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("Error fetching business requirements:", error);
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
  }
}

// POST /api/admin/businesses/:id/requirements
// Two modes:
// Mode A — link existing: { templateId: number }
// Mode B — create new + link: { name, description, image, category, necessity }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { templateId, name, description, image, category, necessity } = body;

    const business = await prisma.business.findUnique({
      where: { id: Number(id) },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let resolvedTemplateId = templateId ? Number(templateId) : null;

    // Mode B: create new template first, then link
    if (!resolvedTemplateId) {
      if (!name || !category || !necessity) {
        return NextResponse.json(
          { error: "name, category, and necessity are required to create a new requirement" },
          { status: 400 }
        );
      }

      const newTemplate = await prisma.requirementTemplate.create({
        data: { name, description, image, category, necessity },
      });

      resolvedTemplateId = newTemplate.id;
    }

    // Validate template exists and is not deprecated
    const template = await prisma.requirementTemplate.findUnique({
      where: { id: resolvedTemplateId },
    });

    if (!template) {
      return NextResponse.json({ error: "Requirement not found in library" }, { status: 404 });
    }

    if (template.isDeprecated) {
      return NextResponse.json(
        { error: "This requirement has been deprecated and cannot be added to new businesses." },
        { status: 400 }
      );
    }

    // Check for duplicate link — return 409 with a clear message
    const existing = await prisma.businessRequirement.findUnique({
      where: {
        businessId_templateId: {
          businessId: Number(id),
          templateId: resolvedTemplateId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `"${template.name}" is already added to ${business.name}.`,
          duplicate: true,
          linkId: existing.id,
        },
        { status: 409 }
      );
    }

    const link = await prisma.businessRequirement.create({
      data: {
        businessId: Number(id),
        templateId: resolvedTemplateId,
        source: "admin",
      },
      include: {
        template: {
          include: { _count: { select: { products: true } } },
        },
      },
    });

    // Resolve description for the response
    const templateDesc = link.template.description ?? "";
    const resolvedDesc = templateDesc.replace(/\[businessName\]/gi, business.name);

    return NextResponse.json(
      {
        linkId: link.id,
        templateId: link.template.id,
        name: link.template.name,
        description: resolvedDesc,
        descriptionOverride: link.descriptionOverride,
        category: link.template.category,
        necessity: link.template.necessity,
        isActive: link.isActive,
        source: link.source,
        productCount: link.template._count.products,
        linkedAt: link.createdAt,
        wasCreated: !templateId, // true if we just created a new template
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding requirement to business:", error);
    return NextResponse.json({ error: "Failed to add requirement" }, { status: 500 });
  }
}

// PATCH /api/admin/businesses/:id/requirements
// Updates the link-level fields: descriptionOverride, isActive, displayOrder.
// Body: { linkId: number, descriptionOverride?: string | null, isActive?: boolean, displayOrder?: number }
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { linkId, descriptionOverride, isActive, displayOrder } = body;

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const link = await prisma.businessRequirement.findFirst({
      where: { id: Number(linkId), businessId: Number(id) },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const updated = await prisma.businessRequirement.update({
      where: { id: Number(linkId) },
      data: {
        ...(descriptionOverride !== undefined && { descriptionOverride }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder }),
      },
      include: {
        template: true,
      },
    });

    return NextResponse.json({
      linkId: updated.id,
      templateId: updated.templateId,
      descriptionOverride: updated.descriptionOverride,
      isActive: updated.isActive,
      displayOrder: updated.displayOrder,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Error updating business requirement:", error);
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 });
  }
}

// DELETE /api/admin/businesses/:id/requirements
// Unlinks a requirement from this business.
// Body: { linkId: number }
// Does NOT delete the template from the library.
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const link = await prisma.businessRequirement.findFirst({
      where: { id: Number(linkId), businessId: Number(id) },
      include: {
        template: { select: { name: true } },
        business: { select: { name: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await prisma.businessRequirement.delete({ where: { id: Number(linkId) } });

    return NextResponse.json({
      message: `"${link.template.name}" removed from "${link.business.name}"`,
    });
  } catch (error) {
    console.error("Error unlinking requirement from business:", error);
    return NextResponse.json({ error: "Failed to remove requirement" }, { status: 500 });
  }
}