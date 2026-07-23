// app/api/counties/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 3600;

export async function GET() {
  try {
    const counties = await prisma.county.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(counties);
  } catch (error) {
    console.error('Error fetching counties:', error);
    return NextResponse.json({ error: 'Failed to fetch counties' }, { status: 500 });
  }
}