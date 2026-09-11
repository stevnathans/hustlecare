// app/api/requirements/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidateBusinessPages } from "@/lib/revalidate";
import { isMarketCode } from "@/lib/markets";
import { slugify, resolveUniqueSlug } from "@/lib/slugify";
import { RequirementType } from "@prisma/client";

const REQUIREMENT_TYPES = Object.values(RequirementType);

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
        slug: t.slug,
        description: t.description,
        descriptionUS: t.descriptionUS,
        image: t.image,
        category: t.category,
        necessity: t.necessity,
        isDeprecated: t.isDeprecated,
        isGlobal: t.isGlobal,
        isCountyFeeSchedule: t.isCountyFeeSchedule,
        restrictedToCountry: t.restrictedToCountry,
        published: t.published,
        publishedAt: t.publishedAt,
        type: t.type,
        sourceName: t.sourceName,
        sourceUrl: t.sourceUrl,
        verifiedAt: t.verifiedAt,
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
      slug: requestedSlug,
      description,
      descriptionUS,
      image,
      category,
      necessity,
      businessId,
      isGlobal = false,
      isCountyFeeSchedule = false,
      restrictedToCountry,
      published = true,
      type,
      sourceName,
      sourceUrl,
      verifiedAt,
    } = body;

    if (!name || !category || !necessity) {
      return NextResponse.json(
        { error: "name, category, and necessity are required" },
        { status: 400 }
      );
    }

    // restrictedToCountry must be a known market code, or explicitly null
    // (meaning "available in every market"). Left undefined, Prisma applies
    // the schema default ("KE") — so omitting it from the request keeps the
    // existing "closed by default" behavior. An invalid value here would
    // silently make a new requirement disappear from every market's
    // requirements page, so we reject it outright.
    if (restrictedToCountry !== undefined && restrictedToCountry !== null && !isMarketCode(restrictedToCountry)) {
      return NextResponse.json(
        { error: "Invalid market value for restrictedToCountry" },
        { status: 400 }
      );
    }

    if (type !== undefined && type !== null && !REQUIREMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${REQUIREMENT_TYPES.join(", ")}, or null` },
        { status: 400 }
      );
    }

    // Auto-generate a slug from `name` whenever one isn't supplied — an
    // empty string from the admin form is treated the same as "not
    // supplied" so the form can just be left blank rather than requiring
    // every submission to fill it in manually. Collisions resolve to
    // -2, -3, etc.
    const baseSlug = slugify(requestedSlug || name);
    const slug = await resolveUniqueSlug(baseSlug, async (candidate) => {
      const existing = await prisma.requirementTemplate.findUnique({ where: { slug: candidate } });
      return existing !== null;
    });

    const template = await prisma.requirementTemplate.create({
      data: {
        name,
        slug,
        description,
        // Optional US-specific override of `description` — see
        // lib/requirement-description.ts for the resolution order. Only
        // meaningful when this template is shared across markets
        // (restrictedToCountry: null); harmless to store otherwise, just
        // never read in that case.
        ...(descriptionUS !== undefined && { descriptionUS }),
        image,
        category,
        necessity,
        isGlobal,
        isCountyFeeSchedule,
        ...(restrictedToCountry !== undefined && { restrictedToCountry }),
        published,
        publishedAt: published ? new Date() : null,
        ...(type !== undefined && { type: type || null }),
        ...(sourceName !== undefined && { sourceName: sourceName || null }),
        ...(sourceUrl !== undefined && { sourceUrl: sourceUrl || null }),
        ...(verifiedAt !== undefined && { verifiedAt: verifiedAt ? new Date(verifiedAt) : null }),
      },
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
        slug: template.slug,
        description: template.description,
        descriptionUS: template.descriptionUS,
        image: template.image,
        category: template.category,
        necessity: template.necessity,
        isGlobal: template.isGlobal,
        isCountyFeeSchedule: template.isCountyFeeSchedule,
        restrictedToCountry: template.restrictedToCountry,
        published: template.published,
        publishedAt: template.publishedAt,
        type: template.type,
        sourceName: template.sourceName,
        sourceUrl: template.sourceUrl,
        verifiedAt: template.verifiedAt,
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