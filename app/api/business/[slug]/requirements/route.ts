import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const businessType = params.slug;
    
    // Find business by slug (type)
    const business = await prisma.business.findUnique({
      where: {
        slug: businessType,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Get all requirements for this business
    const requirements = await prisma.requirement.findMany({
      where: {
        businessId: business.id,
      },
      orderBy: {
        id: 'asc',
      },
    });

    return NextResponse.json(requirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}