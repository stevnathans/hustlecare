/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/requirement-categories/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { slugify, resolveUniqueSlug } from "@/lib/slugify";
import { NecessityScale } from "@prisma/client";

const NECESSITY_SCALES = Object.values(NecessityScale);

export async function GET() {
  try {
    const categories = await prisma.requirementCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: { _count: { select: { templates: true } } },
    });

    return NextResponse.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        displayOrder: c.displayOrder,
        colorToken: c.colorToken,
        excludedFromTotals: c.excludedFromTotals,
        necessityScale: c.necessityScale,
        usesLegalCountyFilter: c.usesLegalCountyFilter,
        templateCount: c._count.templates,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
    );
  } catch (error) {
    console.error("Error fetching requirement categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug: requestedSlug,
      description,
      displayOrder = 0,
      colorToken,
      excludedFromTotals = false,
      necessityScale = "REQUIRED_OPTIONAL",
      usesLegalCountyFilter = false,
    } = body;

    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    if (!NECESSITY_SCALES.includes(necessityScale)) {
      return NextResponse.json(
        { error: `necessityScale must be one of: ${NECESSITY_SCALES.join(", ")}` },
        { status: 400 }
      );
    }

    const baseSlug = slugify(requestedSlug || name);
    const slug = await resolveUniqueSlug(baseSlug, async (candidate) => {
      const existing = await prisma.requirementCategory.findUnique({ where: { slug: candidate } });
      return existing !== null;
    });

    const category = await prisma.requirementCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        displayOrder,
        colorToken: colorToken || null,
        excludedFromTotals,
        necessityScale,
        usesLegalCountyFilter,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
    }
    console.error("Error creating requirement category:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}