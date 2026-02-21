// app/api/requirements/route.ts
// Manages the RequirementTemplate library — independent of any business.

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/requirements
// Returns all non-deprecated templates with product count and linked business count.
export async function GET() {
  try {
    const templates = await prisma.requirementTemplate.findMany({
      where: { isDeprecated: false },
      include: {
        _count: {
          select: {
            products: true,
            businesses: true, // count of BusinessRequirement links
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Shape the response to match what the admin UI expects
    const shaped = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      image: t.image,
      category: t.category,
      necessity: t.necessity,
      isDeprecated: t.isDeprecated,
      productCount: t._count.products,
      businessCount: t._count.businesses,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("Error fetching requirement templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch requirements" },
      { status: 500 }
    );
  }
}

// POST /api/requirements
// Creates a new template in the library.
// Optionally links it to a business if businessId is provided.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, image, category, necessity, businessId } = body;

    if (!name || !category || !necessity) {
      return NextResponse.json(
        { error: "name, category, and necessity are required" },
        { status: 400 }
      );
    }

    // Create the template
    const template = await prisma.requirementTemplate.create({
      data: {
        name,
        description,
        image,
        category,
        necessity,
      },
      include: {
        _count: { select: { products: true, businesses: true } },
      },
    });

    // If a businessId was provided (created from the business page),
    // immediately create the link as well.
    let link = null;
    if (businessId) {
      const business = await prisma.business.findUnique({
        where: { id: Number(businessId) },
      });

      if (!business) {
        // Template was created — return it even if business link fails
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
    }

    return NextResponse.json(
      {
        id: template.id,
        name: template.name,
        description: template.description,
        image: template.image,
        category: template.category,
        necessity: template.necessity,
        productCount: template._count.products,
        businessCount: template._count.businesses,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        linkedTo: link ? { businessRequirementId: link.id, businessId: link.businessId } : null,
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