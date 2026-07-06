// app/api/products/[id]/assign-requirement/route.ts
// Assigns or unassigns a product to a RequirementTemplate directly.
// This supplements the existing name-based matching with an explicit DB link.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission, createAuditLog } from "@/lib/admin-utils";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/products/:id/assign-requirement
// Body: { templateId: number }
// Sets product.templateId to link it directly to a requirement template.
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission('products.update');

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

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Product',
      entityId: updated.id.toString(),
      changes: { templateId: updated.templateId, assignedBy: user.id },
      req,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      templateId: updated.templateId,
      template: updated.template,
      message: `Product "${updated.name}" assigned to requirement "${template.name}"`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error("Failed to assign product to requirement:", error);
    return NextResponse.json(
      { error: "Failed to assign product to requirement" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/:id/assign-requirement
// Removes the templateId link (sets it to null).
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requirePermission('products.update');

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

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Product',
      entityId: updated.id.toString(),
      changes: { templateId: null, unassignedFrom: product.template?.name ?? null, unassignedBy: user.id },
      req,
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      templateId: null,
      message: `Product "${updated.name}" unassigned from requirement "${product.template?.name ?? "unknown"}"`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error("Failed to unassign product from requirement:", error);
    return NextResponse.json(
      { error: "Failed to unassign product from requirement" },
      { status: 500 }
    );
  }
}