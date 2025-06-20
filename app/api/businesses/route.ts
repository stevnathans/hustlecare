import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Fetch all businesses with their grouped requirements
export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        requirements: true,
      },
    });

    const businessesWithGroupedRequirements = businesses.map((business) => {
      const groupedRequirements = business.requirements.reduce(
        (groups: Record<string, typeof business.requirements>, req) => {
          const category = req.category || "Uncategorized";
          if (!groups[category]) {
            groups[category] = [];
          }
          groups[category].push(req);
          return groups;
        },
        {}
      );

      return {
        id: business.id,
        name: business.name,
        image: business.image,
        slug: business.slug,
        groupedRequirements: groupedRequirements,
      };
    });

    return NextResponse.json(businessesWithGroupedRequirements, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch businesses with requirements" },
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