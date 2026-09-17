/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/requirement-categories/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { slugify, resolveUniqueSlug } from "@/lib/slugify";
import { NecessityScale } from "@prisma/client";

const NECESSITY_SCALES = Object.values(NecessityScale);

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const category = await prisma.requirementCategory.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { templates: true } } },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  return NextResponse.json({ ...category, templateCount: category._count.templates });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      slug: requestedSlug,
      description,
      displayOrder,
      colorToken,
      excludedFromTotals,
      necessityScale,
      usesLegalCountyFilter,
    } = body;

    const existing = await prisma.requirementCategory.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (necessityScale !== undefined && !NECESSITY_SCALES.includes(necessityScale)) {
      return NextResponse.json(
        { error: `necessityScale must be one of: ${NECESSITY_SCALES.join(", ")}` },
        { status: 400 }
      );
    }

    let resolvedSlug: string | undefined;
    if (requestedSlug !== undefined) {
      const desired = slugify(requestedSlug || name || existing.name);
      if (desired !== existing.slug) {
        resolvedSlug = await resolveUniqueSlug(desired, async (candidate) => {
          const found = await prisma.requirementCategory.findUnique({ where: { slug: candidate } });
          return found !== null && found.id !== existing.id;
        });
      }
    }

    const updated = await prisma.requirementCategory.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(resolvedSlug !== undefined && { slug: resolvedSlug }),
        ...(description !== undefined && { description: description || null }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(colorToken !== undefined && { colorToken: colorToken || null }),
        ...(excludedFromTotals !== undefined && { excludedFromTotals }),
        ...(necessityScale !== undefined && { necessityScale }),
        ...(usesLegalCountyFilter !== undefined && { usesLegalCountyFilter }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
    }
    console.error("Error updating requirement category:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// Deleting a category with templates still attached is blocked outright —
// unlike RequirementTemplate (which soft-deprecates), there's no safe
// implicit fallback here: reassigning every template to Uncategorized
// silently on delete would be a surprising, hard-to-audit side effect.
// The admin must reassign templates first.
export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const category = await prisma.requirementCategory.findUnique({
      where: { id: Number(id) },
      include: { _count: { select: { templates: true } } },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (category._count.templates > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${category._count.templates} requirement(s) still use this category. Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.requirementCategory.delete({ where: { id: Number(id) } });
    return NextResponse.json({ message: "Category deleted", deleted: true });
  } catch (error) {
    console.error("Error deleting requirement category:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}