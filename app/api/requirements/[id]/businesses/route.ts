// app/api/requirements/[id]/businesses/route.ts
// Links or unlinks a RequirementTemplate to one or more businesses.
// This is the "Add to Business" action triggered from the requirement page.

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/requirements/:id/businesses
// Returns all businesses this template is linked to.
export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const links = await prisma.businessRequirement.findMany({
      where: { templateId: Number(id) },
      include: {
        business: {
          select: { id: true, name: true, slug: true, published: true, image: true },
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
// Body: { businessIds: number[] }
// Returns per-business results so the UI knows which succeeded and which were duplicates.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { businessIds } = body;

    if (!businessIds || !Array.isArray(businessIds) || businessIds.length === 0) {
      return NextResponse.json(
        { error: "businessIds must be a non-empty array" },
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

    // Process each businessId and track results
    const results = await Promise.all(
      businessIds.map(async (businessId: number) => {
        const business = await prisma.business.findUnique({
          where: { id: Number(businessId) },
          select: { id: true, name: true },
        });

        if (!business) {
          return { businessId, success: false, reason: "Business not found" };
        }

        // Check if already linked
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