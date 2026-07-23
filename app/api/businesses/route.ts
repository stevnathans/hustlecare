// app/api/businesses/route.ts
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { EXCLUDED_FROM_TOTALS_CATEGORIES } from "@/lib/necessity";

// Fetch published businesses.
//
// IMPORTANT: this used to `include` every BusinessRequirement + its
// RequirementTemplate for every business with no `take`/`skip`, which meant
// a single call returned the entire catalog (we saw single requests pull
// 1000+ RequirementTemplate ids). BusinessCard only ever used that data to
// compute a count, so we now compute the count in the DB via `_count`
// instead of shipping the full nested rows to the client.
//
// If a future page needs the full grouped requirement breakdown (name,
// image, necessity) for a *single* business, fetch it from a
// business-detail-specific endpoint instead of this list endpoint.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "20", 10), 1),
      50
    );
    const skip = (page - 1) * limit;

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where: { published: true },
        select: {
          id: true,
          name: true,
          image: true,
          slug: true,
          description: true,
          category: { select: { name: true } },
          _count: {
            select: {
              requirements: {
                where: {
                  isActive: true,
                  template: {
                    isDeprecated: false,
                    // EXCLUDED_FROM_TOTALS_CATEGORIES is a Set (see lib/necessity.ts) —
                    // Prisma's `notIn` needs a plain array.
                    category: { notIn: Array.from(EXCLUDED_FROM_TOTALS_CATEGORIES) },
                  },
                },
              },
            },
          },
        },
        orderBy: { id: "asc" },
        take: limit,
        skip,
      }),
      prisma.business.count({ where: { published: true } }),
    ]);

    const result = businesses.map((business) => ({
      id: business.id,
      name: business.name,
      image: business.image,
      slug: business.slug,
      description: business.description,
      category: business.category?.name ?? undefined,
      requirementsCount: business._count.requirements,
    }));

    return NextResponse.json(
      {
        businesses: result,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}

// Create a new business
export async function POST(req: Request) {
  try {
    const { name, slug, description, image } = await req.json();

    const business = await prisma.business.create({
      data: {
        name,
        slug,
        description,
        image,
      },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error creating business:", error);
    return NextResponse.json(
      { error: "Failed to create business" },
      { status: 500 }
    );
  }
}

// Update an existing business
export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, name, slug, description, image } = body;

  try {
    const updatedBusiness = await prisma.business.update({
      where: { id: Number(id) },
      data: { name, slug, description, image },
    });

    return NextResponse.json(updatedBusiness, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

// Delete a business
export async function DELETE(request: Request) {
  const body = await request.json();
  const { id } = body;

  try {
    await prisma.business.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Business deleted" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}