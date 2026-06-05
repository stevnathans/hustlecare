// app/api/requirements/[id]/businesses/route.ts

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/requirements/:id/businesses
// Returns all businesses this template is linked to, including any necessity override.
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const links = await prisma.businessRequirement.findMany({
      where: { templateId: Number(id) },
      include: {
        business: {
          select: { id: true, name: true, slug: true, published: true, image: true },
        },
        template: {
          select: { necessity: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      links.map((l) => ({
        linkId: l.id,
        businessId: l.business.id,
        businessName: l.business.name,
        businessSlug: l.business.slug,
        businessImage: l.business.image,
        published: l.business.published,
        descriptionOverride: l.descriptionOverride,
        // null means "inheriting from template"; include both so the UI
        // can show the effective value and know whether it's overridden
        necessityOverride: l.necessityOverride,
        effectiveNecessity: l.necessityOverride ?? l.template.necessity,
        isActive: l.isActive,
        source: l.source,
        linkedAt: l.createdAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching linked businesses:", error);
    return NextResponse.json({ error: "Failed to fetch linked businesses" }, { status: 500 });
  }
}

// POST /api/requirements/:id/businesses
// Links a template to one or more businesses.
// Body: { businessIds: number[], necessityOverride?: 'Required' | 'Optional' | null }
// necessityOverride applies the same value to every business in this batch.
// Pass null (or omit) to inherit from the template.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { businessIds, necessityOverride = null } = body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return NextResponse.json(
        { error: "businessIds must be a non-empty array" },
        { status: 400 }
      );
    }

    if (
      necessityOverride !== null &&
      necessityOverride !== undefined &&
      necessityOverride !== "Required" &&
      necessityOverride !== "Optional"
    ) {
      return NextResponse.json(
        { error: "necessityOverride must be 'Required', 'Optional', or null" },
        { status: 400 }
      );
    }

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(id) },
    });

    if (!template) {
      return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
    }

    if (template.isDeprecated) {
      return NextResponse.json(
        { error: "Cannot link a deprecated requirement to new businesses." },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      businessIds.map(async (businessId: number) => {
        const business = await prisma.business.findUnique({
          where: { id: Number(businessId) },
          select: { id: true, name: true },
        });

        if (!business) {
          return { businessId, success: false, reason: "Business not found" };
        }

        const existing = await prisma.businessRequirement.findUnique({
          where: {
            businessId_templateId: {
              businessId: Number(businessId),
              templateId: Number(id),
            },
          },
        });

        if (existing) {
          return {
            businessId,
            businessName: business.name,
            success: false,
            reason: `"${template.name}" is already added to ${business.name}`,
            duplicate: true,
          };
        }

        const link = await prisma.businessRequirement.create({
          data: {
            businessId: Number(businessId),
            templateId: Number(id),
            source: "admin",
            necessityOverride: necessityOverride ?? null,
          },
        });

        return {
          businessId,
          businessName: business.name,
          linkId: link.id,
          success: true,
        };
      })
    );

    const succeeded = results.filter((r) => r.success);
    const duplicates = results.filter((r) => !r.success && r.duplicate);
    const failed = results.filter((r) => !r.success && !r.duplicate);

    return NextResponse.json({
      results,
      summary: {
        total: businessIds.length,
        linked: succeeded.length,
        duplicates: duplicates.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error("Error linking requirement to businesses:", error);
    return NextResponse.json({ error: "Failed to link requirement" }, { status: 500 });
  }
}

// PATCH /api/requirements/:id/businesses
// Updates necessityOverride and/or descriptionOverride on an existing link.
// Body: { businessId: number, necessityOverride?: 'Required' | 'Optional' | null, descriptionOverride?: string | null }
// Pass null to clear either override and revert to the template value.
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { businessId, necessityOverride, descriptionOverride } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    if (
      necessityOverride !== undefined &&
      necessityOverride !== null &&
      necessityOverride !== "Required" &&
      necessityOverride !== "Optional"
    ) {
      return NextResponse.json(
        { error: "necessityOverride must be 'Required', 'Optional', or null" },
        { status: 400 }
      );
    }

    const existing = await prisma.businessRequirement.findUnique({
      where: {
        businessId_templateId: {
          businessId: Number(businessId),
          templateId: Number(id),
        },
      },
      include: {
        business: { select: { name: true } },
        template: { select: { name: true, necessity: true, description: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "This requirement is not linked to that business" },
        { status: 404 }
      );
    }

    // Build update payload — only include fields that were actually sent
    // so a necessity-only PATCH doesn't accidentally wipe descriptionOverride
    const updateData: {
      necessityOverride?: string | null;
      descriptionOverride?: string | null;
    } = {};

    if (necessityOverride !== undefined) updateData.necessityOverride = necessityOverride;
    if (descriptionOverride !== undefined) {
      // Treat empty string as null — no point storing a blank override
      updateData.descriptionOverride =
        descriptionOverride === "" ? null : descriptionOverride;
    }

    const updated = await prisma.businessRequirement.update({
      where: {
        businessId_templateId: {
          businessId: Number(businessId),
          templateId: Number(id),
        },
      },
      data: updateData,
    });

    const effectiveNecessity =
      updated.necessityOverride ?? existing.template.necessity;

    return NextResponse.json({
      linkId: updated.id,
      businessId: Number(businessId),
      businessName: existing.business.name,
      templateNecessity: existing.template.necessity,
      necessityOverride: updated.necessityOverride,
      effectiveNecessity,
      descriptionOverride: updated.descriptionOverride,
      message: "Link updated successfully",
    });
  } catch (error) {
    console.error("Error updating business requirement link:", error);
    return NextResponse.json({ error: "Failed to update link" }, { status: 500 });
  }
}

// DELETE /api/requirements/:id/businesses
// Unlinks a template from a specific business.
// Body: { businessId: number }
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { businessId } = body;

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const link = await prisma.businessRequirement.findUnique({
      where: {
        businessId_templateId: {
          businessId: Number(businessId),
          templateId: Number(id),
        },
      },
      include: {
        business: { select: { name: true } },
        template: { select: { name: true } },
      },
    });

    if (!link) {
      return NextResponse.json(
        { error: "This requirement is not linked to that business" },
        { status: 404 }
      );
    }

    await prisma.businessRequirement.delete({
      where: {
        businessId_templateId: {
          businessId: Number(businessId),
          templateId: Number(id),
        },
      },
    });

    return NextResponse.json({
      message: `"${link.template.name}" unlinked from "${link.business.name}"`,
    });
  } catch (error) {
    console.error("Error unlinking requirement:", error);
    return NextResponse.json({ error: "Failed to unlink requirement" }, { status: 500 });
  }
}