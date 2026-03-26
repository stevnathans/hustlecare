// app/api/products/route.ts
// GET supports:
//   ?requirementName=…   (legacy name-matching)
//   ?templateId=…        (direct DB link via product.templateId)
//   both together        (merges both result sets, deduplicated by id)
//   no params            (returns all products)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const requirementName = url.searchParams.get('requirementName');
    const templateId = url.searchParams.get('templateId');

    // ── Fetch by templateId (direct link) + optional name fallback ────────
    if (templateId) {
      // 1. Products directly linked to this template via product.templateId
      const linkedProducts = await prisma.product.findMany({
        where: { templateId: Number(templateId) },
        include: { vendor: true },
        orderBy: { price: 'asc' },
      });

      // 2. Legacy name-based match — runs whenever requirementName is supplied.
      //    We want products whose name contains the requirement name AND whose
      //    templateId is either null (unassigned) or points to a DIFFERENT
      //    template (already counted above and will be deduplicated).
      //
      //    IMPORTANT: Prisma's { not: X } filter does NOT match null rows on
      //    PostgreSQL, so we must explicitly include null with OR to avoid
      //    silently dropping unassigned name-matched products.
      let nameMatched: typeof linkedProducts = [];
      if (requirementName) {
        nameMatched = await prisma.product.findMany({
          where: {
            name: { contains: requirementName, mode: 'insensitive' },
            OR: [
              { templateId: null },                      // unassigned products
              { templateId: { not: Number(templateId) } }, // assigned to a different template
            ],
          },
          include: { vendor: true },
          orderBy: { price: 'asc' },
        });
      }

      // Deduplicate: direct links take priority; name-matched are appended
      // only if their id hasn't already appeared in linkedProducts.
      const linkedIds = new Set(linkedProducts.map((p) => p.id));
      const uniqueNameMatched = nameMatched.filter((p) => !linkedIds.has(p.id));

      return NextResponse.json([...linkedProducts, ...uniqueNameMatched]);
    }

    // ── Legacy: fetch by requirementName only ─────────────────────────────
    if (requirementName) {
      const products = await prisma.product.findMany({
        where: {
          name: { contains: requirementName, mode: 'insensitive' },
        },
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
        vendorId: vendorId ? parseInt(vendorId) : null,
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