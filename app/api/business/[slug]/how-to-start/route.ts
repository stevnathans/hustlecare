// app/api/business/[slug]/how-to-start/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const business = await prisma.business.findUnique({
      where: { slug, published: true },
      select: { id: true, name: true, slug: true, image: true, description: true, createdAt: true, updatedAt: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const guide = await prisma.howToGuide.findUnique({
      where: { businessId: business.id },
      include: {
        steps:      { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        sections:   { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        faqs:       { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        references: { orderBy: { refNumber: 'asc' } },
      },
    });

    if (!guide || !guide.isPublished) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json({ business, guide });
  } catch (error) {
    console.error('Error fetching how-to guide:', error);
    return NextResponse.json({ error: 'Failed to fetch guide' }, { status: 500 });
  }
}