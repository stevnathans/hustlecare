import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// PATCH /api/requirements/:id
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const { name, description, image, category, necessity, businessId } = body;

    // Await params in Next.js 15+
    const { id } = await params;

    const updated = await prisma.requirement.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        image,
        category,
        necessity,
        businessId,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/requirements/:id
export async function DELETE(_: NextRequest, { params }: Params) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    await prisma.requirement.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Requirement deleted" });
  } catch (error) {
    console.error("Failed to delete requirement:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}