// app/api/products/route.ts
// GET supports:
//   ?templateId=…   (direct DB link via product.templateId — only source of truth)
//   no params       (returns all products)
//
// NOTE: requirementName name-matching has been removed. Products are only
// returned when explicitly linked to a template via product.templateId.
// This ensures cost calculations are consistent across all pages.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const templateId = url.searchParams.get('templateId');

    // ── Fetch by templateId (direct link only) ────────────────────────────
    if (templateId) {
      const products = await prisma.product.findMany({
        where: { templateId: Number(templateId) },
        include: { vendor: true },
        orderBy: { price: 'asc' },
      });
      return NextResponse.json(products);
    }

    // ── No filters: return all products ──────────────────────────────────
    const products = await prisma.product.findMany({
      include: { vendor: true, template: { select: { id: true, name: true } } },
      orderBy: { price: 'asc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, image, url, vendorId, templateId } = body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
        url,
        vendorId:   vendorId   ? parseInt(vendorId)   : null,
        templateId: templateId ? parseInt(templateId) : null,
      },
      include: {
        vendor: true,
        template: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Failed to create product:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}