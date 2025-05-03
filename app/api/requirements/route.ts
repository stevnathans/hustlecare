import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, image, category, businessId, necessity } = body;

    if (!name || !category || !businessId || !necessity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const requirement = await prisma.requirement.create({
      data: {
        name,
        description,
        image,
        category,
        necessity,
        business: {
          connect: { id: businessId },
        },
      },
    });

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    console.error("Error creating requirement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const requirements = await prisma.requirement.findMany({
      include: {
        business: true,
        comments: true,
      },
    });

    return NextResponse.json(requirements);
  } catch (error) {
    console.error("Error fetching requirements:", error);
    return NextResponse.json(
      { error: "Failed to fetch requirements" },
      { status: 500 }
    );
  }
}
