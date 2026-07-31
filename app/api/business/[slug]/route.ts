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
        // County-fee trade-class resolution (see lib/legalFeeSchedule.ts):
        // this business's own override, plus its category's default as
        // the fallback used to compute effectiveTradeClassId below.
        tradeClassId: true,
        category: {
          select: { defaultTradeClassId: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const { category, ...businessFields } = business;
    const effectiveTradeClassId = business.tradeClassId ?? category?.defaultTradeClassId ?? null;

    return NextResponse.json({
      ...businessFields,
      effectiveTradeClassId,
    });
  } catch (error) {
    console.error('Error fetching business:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business' },
      { status: 500 }
    );
  }
}