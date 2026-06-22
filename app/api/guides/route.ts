// app/api/guides/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const guides = await prisma.howToGuide.findMany({
      where: {
        isPublished: true,
        business:    { published: true },
      },
      select: {
        id:          true,
        title:       true,
        intro:       true,
        isPublished: true,
        publishedAt: true,
        keywords:    true,
        _count: {
          select: {
            steps: { where: { isActive: true } },
            faqs:  { where: { isActive: true } },
          },
        },
        business: {
          select: {
            name:     true,
            slug:     true,
            image:    true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    const shaped = guides.map(g => ({
      id:          g.id,
      title:       g.title,
      intro:       g.intro,
      isPublished: g.isPublished,
      publishedAt: g.publishedAt?.toISOString() ?? null,
      stepCount:   g._count.steps,
      faqCount:    g._count.faqs,
      business: {
        name:     g.business.name,
        slug:     g.business.slug,
        image:    g.business.image,
        category: g.business.category?.name ?? null,
      },
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error('GET /api/guides:', error);
    return NextResponse.json({ error: 'Failed to fetch guides' }, { status: 500 });
  }
}