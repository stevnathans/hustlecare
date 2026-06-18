// app/api/admin/guides/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
  }
  return null;
}

export async function GET() {
  try {
    await requirePermission('businesses.view');

    const businesses = await prisma.business.findMany({
      select: {
        id:        true,
        name:      true,
        slug:      true,
        published: true,
        createdAt: true,
        category:  { select: { name: true } },
        howToGuide: {
          select: {
            id:          true,
            isPublished: true,
            updatedAt:   true,
            _count: {
              select: {
                steps:  true,
                faqs:   true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Shape the response — flatten _count into stepCount / faqCount
    const shaped = businesses.map(b => ({
      id:        b.id,
      name:      b.name,
      slug:      b.slug,
      published: b.published,
      createdAt: b.createdAt,
      category:  b.category,
      guide: b.howToGuide
        ? {
            id:          b.howToGuide.id,
            isPublished: b.howToGuide.isPublished,
            stepCount:   b.howToGuide._count.steps,
            faqCount:    b.howToGuide._count.faqs,
            updatedAt:   b.howToGuide.updatedAt,
          }
        : null,
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('GET /api/admin/guides:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}