//app/api/business/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: businessType } = await params;
    
    const business = await prisma.business.findUnique({
      where: {
        slug: businessType,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
        published: true,
        categoryId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        costMin: true,
        costMax: true,
        timeToLaunchMin: true,
        timeToLaunchMax: true,
        profitPotential: true,
        skillLevel: true,
        bestLocations: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}