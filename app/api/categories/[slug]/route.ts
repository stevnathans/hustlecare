// app/api/categories/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function slugToSearchTerm(slug: string): string {
  return slug.replace(/-/g, ' ');
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const searchTerm = slugToSearchTerm(slug);

    const category = await prisma.businessCategory.findFirst({
      where: {
        name: {
          equals: searchTerm,
          mode: 'insensitive',
        },
      },
      include: {
        _count: {
          select: { businesses: true },
        },
        businesses: {
          orderBy: { name: 'asc' },
          include: {
            _count: {
              select: { requirements: true },
            },
          },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}