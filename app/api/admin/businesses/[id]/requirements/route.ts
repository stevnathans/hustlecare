// app/api/admin/businesses/[id]/requirements/route.ts

import { prisma } from "@/lib/prisma";
import { requirePermission, createAuditLog } from "@/lib/admin-utils";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// FIX: Validate that a route param is a positive integer before passing to Prisma.
// Previously Number(id) on a non-numeric string like "abc" produces NaN, which
// Prisma passes through and throws an unhelpful internal error.
function parseId(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// GET /api/admin/businesses/:id/requirements
export async function GET(_: NextRequest, { params }: Params) {
  try {
    // FIX: All four handlers were missing auth entirely. Anyone — unauthenticated
    // or a basic user — could read, add, update, and delete business requirements
    // by hitting these endpoints directly. Added requirePermission to every handler.
    await requirePermission('businesses.view');

    const { id } = await params;
    const businessId = parseId(id);
    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const links = await prisma.businessRequirement.findMany({
      where: { businessId },
      include: {
        template: {
          include: { _count: { select: { products: true } } },
        },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    const shaped = links.map((link) => {
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
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error fetching business requirements:", (error as Error).message);
    return NextResponse.json({ error: "Failed to fetch requirements" }, { status: 500 });
  }
}

// POST /api/admin/businesses/:id/requirements
// Mode A — link existing: { templateId: number }
// Mode B — create new + link: { name, description, image, category, necessity }
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await requirePermission('requirements.create');

    const { id } = await params;
    const businessId = parseId(id);
    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const body = await req.json();
    const { templateId, name, description, image, category, necessity } = body;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    let resolvedTemplateId = templateId ? Number(templateId) : null;

    if (!resolvedTemplateId) {
      // Mode B: create new template
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json(
          { error: "name, category, and necessity are required to create a new requirement" },
          { status: 400 }
        );
      }
      if (!category || !necessity) {
        return NextResponse.json(
          { error: "name, category, and necessity are required to create a new requirement" },
          { status: 400 }
        );
      }

      const newTemplate = await prisma.requirementTemplate.create({
        data: {
          // FIX: Explicitly pick and sanitize each field instead of spreading body.
          name: String(name).trim().slice(0, 200),
          description: description ? String(description).slice(0, 5000) : null,
          image: image ? String(image) : null,
          category: String(category).slice(0, 100),
          necessity: String(necessity).slice(0, 50),
        },
      });

      resolvedTemplateId = newTemplate.id;
    }

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: resolvedTemplateId },
    });

    if (!template) {
      return NextResponse.json({ error: "Requirement not found in library" }, { status: 404 });
    }

    if (template.isDeprecated) {
      return NextResponse.json(
        { error: "This requirement has been deprecated and cannot be added." },
        { status: 400 }
      );
    }

    const existing = await prisma.businessRequirement.findUnique({
      where: {
        businessId_templateId: { businessId, templateId: resolvedTemplateId },
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
      data: { businessId, templateId: resolvedTemplateId, source: "admin" },
      include: {
        template: { include: { _count: { select: { products: true } } } },
      },
    });

    const resolvedDesc = (link.template.description ?? "").replace(/\[businessName\]/gi, business.name);

    await createAuditLog({
      action: 'CREATE',
      entity: 'Requirement',
      entityId: link.id.toString(),
      changes: { businessId, templateId: resolvedTemplateId, templateName: template.name },
      req,
    });

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
        wasCreated: !templateId,
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error adding requirement to business:", (error as Error).message);
    return NextResponse.json({ error: "Failed to add requirement" }, { status: 500 });
  }
}

// PATCH /api/admin/businesses/:id/requirements
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requirePermission('requirements.update');

    const { id } = await params;
    const businessId = parseId(id);
    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const body = await req.json();
    const { linkId, descriptionOverride, isActive, displayOrder } = body;

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const link = await prisma.businessRequirement.findFirst({
      where: { id: Number(linkId), businessId },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const updated = await prisma.businessRequirement.update({
      where: { id: Number(linkId) },
      data: {
        // FIX: Explicitly type-check each field before writing.
        // Previously raw body values were spread in without validation.
        ...(descriptionOverride !== undefined && {
          descriptionOverride: descriptionOverride === null
            ? null
            : String(descriptionOverride).slice(0, 5000),
        }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(displayOrder !== undefined && { displayOrder: Math.max(0, Math.floor(Number(displayOrder))) }),
      },
      include: { template: true },
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
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error updating business requirement:", (error as Error).message);
    return NextResponse.json({ error: "Failed to update requirement" }, { status: 500 });
  }
}

// DELETE /api/admin/businesses/:id/requirements
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requirePermission('requirements.delete');

    const { id } = await params;
    const businessId = parseId(id);
    if (!businessId) {
      return NextResponse.json({ error: 'Invalid business ID' }, { status: 400 });
    }

    const body = await req.json();
    const { linkId } = body;

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 });
    }

    const link = await prisma.businessRequirement.findFirst({
      where: { id: Number(linkId), businessId },
      include: {
        template: { select: { name: true } },
        business: { select: { name: true } },
      },
    });

    if (!link) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    await prisma.businessRequirement.delete({ where: { id: Number(linkId) } });

    await createAuditLog({
      action: 'DELETE',
      entity: 'Requirement',
      entityId: linkId.toString(),
      changes: { unlinkedFrom: link.business.name, requirementName: link.template.name },
      req,
    });

    return NextResponse.json({
      message: `"${link.template.name}" removed from "${link.business.name}"`,
    });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error("Error unlinking requirement from business:", (error as Error).message);
    return NextResponse.json({ error: "Failed to remove requirement" }, { status: 500 });
  }
}