// app/api/requirements/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isMarketCode } from "@/lib/markets";
import { slugify, resolveUniqueSlug } from "@/lib/slugify";
import { RequirementType } from "@prisma/client";

const REQUIREMENT_TYPES = Object.values(RequirementType);

// Revalidates the public requirement entity page and its index — added in
// Stage 2 alongside app/requirements/[slug]/page.tsx. Mirrors the
// revalidateBusinessPages pattern already used for BusinessRequirement
// mutations. Safe to call even before the page existed (Next no-ops a
// revalidatePath call for a path that was never generated), but from
// Stage 2 onward this is load-bearing — without it, admin edits here
// wouldn't show up on the public page until a full rebuild.
function revalidateRequirementPages(slug: string | null) {
  if (slug) revalidatePath(`/requirements/${slug}`);
  revalidatePath('/requirements');
}

interface Params {
  params: Promise<{ id: string }>;
}

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
      slug: template.slug,
      description: template.description,
      descriptionUS: template.descriptionUS,
      image: template.image,
      category: template.category,
      necessity: template.necessity,
      isDeprecated: template.isDeprecated,
      isGlobal: template.isGlobal,
      isCountyFeeSchedule: template.isCountyFeeSchedule,
      restrictedToCountry: template.restrictedToCountry,
      published: template.published,
      publishedAt: template.publishedAt,
      type: template.type,
      sourceName: template.sourceName,
      sourceUrl: template.sourceUrl,
      verifiedAt: template.verifiedAt,
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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      slug: requestedSlug,
      description,
      descriptionUS,
      image,
      category,
      necessity,
      isGlobal,
      isCountyFeeSchedule,
      restrictedToCountry,
      published,
      type,
      sourceName,
      sourceUrl,
      verifiedAt,
    } = body;

    // restrictedToCountry must be a known market code, or null (meaning
    // "available in every market"). An invalid value here would silently
    // make a requirement disappear from every market's requirements page,
    // so we reject it outright rather than letting Prisma write it through.
    if (restrictedToCountry !== undefined && restrictedToCountry !== null && !isMarketCode(restrictedToCountry)) {
      return NextResponse.json({ error: "Invalid market value for restrictedToCountry" }, { status: 400 });
    }

    if (type !== undefined && type !== null && !REQUIREMENT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `type must be one of: ${REQUIREMENT_TYPES.join(", ")}, or null` },
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
        { error: "Cannot update a deprecated requirement. Restore it first." },
        { status: 400 }
      );
    }

    // Only re-slug if a genuinely different slug was requested — never
    // silently reslug just because `name` changed, since that would break
    // any existing inbound links (internal or external) to the current
    // slug. An empty string is treated as "regenerate from the current or
    // new name," matching the create-time behavior.
    let resolvedSlug: string | undefined;
    if (requestedSlug !== undefined) {
      const desired = slugify(requestedSlug || name || template.name);
      if (desired !== template.slug) {
        resolvedSlug = await resolveUniqueSlug(desired, async (candidate) => {
          const existing = await prisma.requirementTemplate.findUnique({ where: { slug: candidate } });
          return existing !== null && existing.id !== template.id;
        });
      }
    }

    // publishedAt tracks the most recent time this template was published
    // — set it whenever `published` flips true, and clear it if `published`
    // is explicitly set back to false, so a later re-publish records a
    // fresh date rather than keeping a stale one from months earlier.
    let publishedAtUpdate: Date | null | undefined;
    if (published !== undefined && published !== template.published) {
      publishedAtUpdate = published ? new Date() : null;
    }

    const updated = await prisma.requirementTemplate.update({
      where: { id: Number(id) },
      data: {
        ...(name        !== undefined && { name }),
        ...(resolvedSlug !== undefined && { slug: resolvedSlug }),
        ...(description !== undefined && { description }),
        // Optional US-specific override of `description` — see
        // lib/requirement-description.ts for the resolution order.
        ...(descriptionUS !== undefined && { descriptionUS }),
        ...(image       !== undefined && { image }),
        ...(category    !== undefined && { category }),
        ...(necessity   !== undefined && { necessity }),
        ...(isGlobal    !== undefined && { isGlobal }),
        ...(isCountyFeeSchedule !== undefined && { isCountyFeeSchedule }),
        ...(restrictedToCountry !== undefined && { restrictedToCountry }),
        ...(published   !== undefined && { published }),
        ...(publishedAtUpdate !== undefined && { publishedAt: publishedAtUpdate }),
        ...(type        !== undefined && { type: type || null }),
        ...(sourceName  !== undefined && { sourceName: sourceName || null }),
        ...(sourceUrl   !== undefined && { sourceUrl: sourceUrl || null }),
        ...(verifiedAt  !== undefined && { verifiedAt: verifiedAt ? new Date(verifiedAt) : null }),
      },
      include: { _count: { select: { businesses: true, products: true } } },
    });

    // If isGlobal was just switched ON, back-fill businesses not yet linked
    if (isGlobal === true && !template.isGlobal) {
      const allBusinesses = await prisma.business.findMany({
        select: { id: true },
      });
      if (allBusinesses.length > 0) {
        await prisma.businessRequirement.createMany({
          data: allBusinesses.map((b) => ({
            businessId: b.id,
            templateId: Number(id),
            source: "global",
          })),
          skipDuplicates: true,
        });
      }
    }

    // Re-fetch updated count after any back-fill
    const updatedCount = await prisma.businessRequirement.count({
      where: { templateId: Number(id) },
    });

    // Revalidate the requirement's own page under BOTH its old and new
    // slug (if it changed) plus the /requirements index, so a rename
    // doesn't leave a stale cached page at the old URL and a 404 at the
    // new one until the next full rebuild.
    revalidateRequirementPages(template.slug);
    if (resolvedSlug && resolvedSlug !== template.slug) {
      revalidateRequirementPages(resolvedSlug);
    }

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      descriptionUS: updated.descriptionUS,
      image: updated.image,
      category: updated.category,
      necessity: updated.necessity,
      isGlobal: updated.isGlobal,
      isCountyFeeSchedule: updated.isCountyFeeSchedule,
      restrictedToCountry: updated.restrictedToCountry,
      published: updated.published,
      publishedAt: updated.publishedAt,
      type: updated.type,
      sourceName: updated.sourceName,
      sourceUrl: updated.sourceUrl,
      verifiedAt: updated.verifiedAt,
      productCount: updated._count.products,
      businessCount: updatedCount,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

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

    if (template._count.businesses > 0) {
      if (force) {
        return NextResponse.json(
          {
            error: `Cannot force-delete: ${template._count.businesses} business(es) still linked. Unlink them first.`,
          },
          { status: 400 }
        );
      }

      await prisma.requirementTemplate.update({
        where: { id: Number(id) },
        data: { isDeprecated: true, deprecatedAt: new Date() },
      });

      // A deprecated template should stop rendering at its own URL and
      // drop out of the /requirements index immediately, not wait for the
      // next full rebuild.
      revalidateRequirementPages(template.slug);

      return NextResponse.json({
        message: `Requirement deprecated. ${template._count.businesses} existing business link(s) are unaffected.`,
        deprecated: true,
      });
    }

    await prisma.requirementTemplate.delete({ where: { id: Number(id) } });

    revalidateRequirementPages(template.slug);

    return NextResponse.json({
      message: "Requirement permanently deleted",
      deleted: true,
    });
  } catch (error) {
    console.error("Failed to delete requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}