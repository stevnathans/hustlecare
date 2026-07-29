// app/api/business-categories/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600; // rarely changes

export async function GET() {
  try {
    const categories = await prisma.businessCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching business categories:', error);
    return NextResponse.json({ error: 'Failed to fetch business categories' }, { status: 500 });
  }
}