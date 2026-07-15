// app/api/requirements/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidateBusinessPages } from "@/lib/revalidate";

export async function GET() {
  try {
    const templates = await prisma.requirementTemplate.findMany({
      where: { isDeprecated: false },
      include: {
        _count: {
          select: { products: true, businesses: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        image: t.image,
        category: t.category,
        necessity: t.necessity,
        isDeprecated: t.isDeprecated,
        isGlobal: t.isGlobal,
        productCount: t._count.products,
        businessCount: t._count.businesses,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching requirement templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch requirements" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      image,
      category,
      necessity,
      businessId,
      isGlobal = false,
    } = body;

    if (!name || !category || !necessity) {
      return NextResponse.json(
        { error: "name, category, and necessity are required" },
        { status: 400 }
      );
    }

    const template = await prisma.requirementTemplate.create({
      data: { name, description, image, category, necessity, isGlobal },
      include: { _count: { select: { products: true, businesses: true } } },
    });

    // If global, auto-link to ALL existing businesses
    if (isGlobal) {
      // FIX: select slug too — needed to revalidate each business's
      // statically-generated pages after linking (see note below).
      const allBusinesses = await prisma.business.findMany({
        select: { id: true, slug: true },
      });
      if (allBusinesses.length > 0) {
        await prisma.businessRequirement.createMany({
          data: allBusinesses.map((b) => ({
            businessId: b.id,
            templateId: template.id,
            source: "global",
          })),
          skipDuplicates: true,
        });

        // FIX: revalidate every business's hub + requirements pages now
        // that a new global requirement links to all of them. This route
        // previously never called revalidatePath, so requirements created
        // here (including via CSV import, which posts to this endpoint)
        // never showed up on statically generated business pages in
        // production until a full rebuild — even though local dev never
        // surfaced the problem, since dev has no persistent ISR cache.
        allBusinesses.forEach((b) => revalidateBusinessPages(b.slug));
      }
    }

    // If a specific businessId was given and not already handled by global
    let link = null;
    if (businessId && !isGlobal) {
      const business = await prisma.business.findUnique({
        where: { id: Number(businessId) },
      });

      if (!business) {
        return NextResponse.json(
          { error: "Template created but business not found for linking", template },
          { status: 207 }
        );
      }

      link = await prisma.businessRequirement.create({
        data: {
          businessId: Number(businessId),
          templateId: template.id,
          source: "admin",
        },
      });

      // FIX: revalidate this business's hub + requirements pages now that
      // a new requirement is linked to it. This is the specific gap that
      // caused CSV-imported requirements (Stock or otherwise) with
      // "link to business" enabled to not appear in production — see the
      // longer note in the isGlobal branch above.
      revalidateBusinessPages(business.slug);
    }

    // Re-fetch updated business count after linking
    const updatedCount = await prisma.businessRequirement.count({
      where: { templateId: template.id },
    });

    return NextResponse.json(
      {
        id: template.id,
        name: template.name,
        description: template.description,
        image: template.image,
        category: template.category,
        necessity: template.necessity,
        isGlobal: template.isGlobal,
        productCount: template._count.products,
        businessCount: updatedCount,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        linkedTo: link
          ? { businessRequirementId: link.id, businessId: link.businessId }
          : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating requirement template:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}