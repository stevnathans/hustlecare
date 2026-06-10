// app/api/small-business-ideas/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // always fresh — no route-level cache

export async function GET() {
  try {
    const businesses = await prisma.business.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        description: true,
        timeToLaunchMin: true,
        timeToLaunchMax: true,
        profitPotential: true,
        skillLevel: true,
        bestLocations: true,
        createdAt: true,
        category: {
          select: { name: true },
        },
        requirements: {
          where: {
            isActive: true,
            template: { isDeprecated: false },
          },
          select: {
            id: true,
            template: {
              select: {
                id: true,
                name: true,
                category: true,
                necessity: true,
                image: true,
              },
            },
          },
        },
      },
    });

    // Shape into what EnhancedBusinessCard expects
    const shaped = businesses.map((b) => {
      // Build groupedRequirements: Record<string, Requirement[]>
      const groupedRequirements: Record<
        string,
        {
          id: number;
          templateId?: number;
          name: string;
          category: string | null;
          necessity: string;
          image: string | null;
        }[]
      > = {};

      for (const req of b.requirements) {
        const cat = req.template.category ?? 'General';
        if (!groupedRequirements[cat]) groupedRequirements[cat] = [];
        groupedRequirements[cat].push({
          id: req.id,
          templateId: req.template.id,
          name: req.template.name,
          category: req.template.category,
          necessity: req.template.necessity,
          image: req.template.image,
        });
      }

      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        image: b.image,
        description: b.description,
        category: b.category?.name ?? null,
        timeToLaunchMin: b.timeToLaunchMin,
        timeToLaunchMax: b.timeToLaunchMax,
        profitPotential: b.profitPotential,
        skillLevel: b.skillLevel,
        bestLocations: b.bestLocations ?? [],
        groupedRequirements,
        createdAt: b.createdAt.toISOString(),
      };
    });

    return NextResponse.json(shaped);
  } catch (error) {
    console.error('[/api/small-business-ideas] error:', error);
    return NextResponse.json({ error: 'Failed to load businesses' }, { status: 500 });
  }
}