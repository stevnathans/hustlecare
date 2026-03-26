// app/api/products/[id]/assign-requirement/route.ts
// Assigns or unassigns a product to a RequirementTemplate directly.
// This supplements the existing name-based matching with an explicit DB link.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/products/:id/assign-requirement
// Body: { templateId: number }
// Sets product.templateId to link it directly to a requirement template.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: "templateId is required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const template = await prisma.requirementTemplate.findUnique({
      where: { id: Number(templateId) },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Requirement template not found" },
        { status: 404 }
      );
    }

    if (template.isDeprecated) {
      return NextResponse.json(
        { error: "Cannot assign a product to a deprecated requirement" },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { templateId: Number(templateId) },
      include: {
        vendor: true,
        template: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      templateId: updated.templateId,
      template: updated.template,
      message: `Product "${updated.name}" assigned to requirement "${template.name}"`,
    });
  } catch (error) {
    console.error("Failed to assign product to requirement:", error);
    return NextResponse.json(
      { error: "Failed to assign product to requirement" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/assign-requirement
// Removes the templateId link (sets it to null).
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { template: { select: { name: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { templateId: null },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      templateId: null,
      message: `Product "${updated.name}" unassigned from requirement "${product.template?.name ?? "unknown"}"`,
    });
  } catch (error) {
    console.error("Failed to unassign product from requirement:", error);
    return NextResponse.json(
      { error: "Failed to unassign product from requirement" },
      { status: 500 }
    );
  }
}