// app/api/marketplace/products/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = parseInt(id);
  if (!productId) return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 });

  try {
    const product = await prisma.product.findFirst({
      where: { id: productId, status: 'ACTIVE' },
      include: {
        vendor: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, description: true, location: true } },
        template: {
          select: {
            id: true, name: true, category: true, necessity: true,
            businesses: {
              where: { isActive: true },
              select: { business: { select: { id: true, name: true, slug: true } } },
            },
          },
        },
        bulkPricing: { select: { minQty: true, price: true }, orderBy: { minQty: 'asc' } },
        reviews: { where: { isApproved: true }, select: { rating: true, comment: true, createdAt: true, user: { select: { name: true, image: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!product) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });

    // Related products: same requirement, different vendor, ACTIVE
    const related = product.templateId
      ? await prisma.product.findMany({
          where: { templateId: product.templateId, status: 'ACTIVE', id: { not: product.id } },
          select: { id: true, name: true, price: true, image: true, condition: true, vendor: { select: { name: true } } },
          take: 4,
          orderBy: { price: 'asc' },
        })
      : [];

    return NextResponse.json({ product, related });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product.' }, { status: 500 });
  }
}