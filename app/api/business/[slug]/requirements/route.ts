// app/api/business/[slug]/requirements/route.ts
//
// QUANTITY/RECURRENCE (new): response now includes quantity, quantityByBand
// and recurrence per requirement — the client-hydration counterpart to
// lib/business-data.ts's SSR select. This is the path useBusinessData
// hits on any pure client-side navigation (no SSR initialData). Mirrors
// lib/cost-data.ts's resolution logic (template override, then category
// default, then ONE_TIME) — duplicated rather than shared, matching every
// other resolution chain in this codebase (excludedFromTotals,
// usesLegalCountyFilter) that already tolerates this duplication across
// SSR paths and API routes.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, isMarketCode } from '@/lib/markets';
import { selectTemplateDescription } from '@/lib/requirement-description';
import { isExcludedFromTotals } from '@/lib/necessity';
import type { CostRecurrence, SizeBand } from '@/lib/cost-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const marketParam = request.nextUrl.searchParams.get('market');
    const market = isMarketCode(marketParam) ? marketParam : DEFAULT_MARKET;

    const business = await prisma.business.findUnique({
      where: { slug },
      select: { id: true, name: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const links = await prisma.businessRequirement.findMany({
      where: {
        businessId: business.id,
        isActive: true,
        template: {
          isDeprecated: false,
          OR: [
            { restrictedToCountry: null },
            { restrictedToCountry: market },
          ],
        },
      },
      include: {
        template: {
          include: {
            _count: { select: { products: true } },
            categoryRef: {
              select: { excludedFromTotals: true, usesLegalCountyFilter: true, defaultCostRecurrence: true },
            },
          },
        },
        quantities: { select: { sizeBand: true, quantity: true } },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const requirements = links.map((link) => {
      const templateDesc = selectTemplateDescription(link.template, market) ?? '';
      const resolvedTemplateDesc = templateDesc.replace(/\[businessName\]/gi, business.name);
      const effectiveDescription = link.descriptionOverride ?? resolvedTemplateDesc;

      const recurrence: CostRecurrence =
        link.template.costRecurrence ?? link.template.categoryRef?.defaultCostRecurrence ?? 'ONE_TIME';

      const quantityByBand = link.quantities.reduce<Partial<Record<SizeBand, number>>>((acc, row) => {
        acc[row.sizeBand as SizeBand] = row.quantity;
        return acc;
      }, {});

      return {
        id: link.id,
        templateId: link.template.id,
        name: link.template.name,
        description: effectiveDescription,
        image: link.template.image,
        category: link.template.category,
        necessity: link.necessityOverride ?? link.template.necessity,
        productCount: link.template._count.products,
        slug: market === 'KE' && link.template.published ? link.template.slug : null,
        excludedFromTotals:
          link.template.categoryRef?.excludedFromTotals ?? isExcludedFromTotals(link.template.category ?? ''),
        usesLegalCountyFilter:
          link.template.categoryRef?.usesLegalCountyFilter ?? (link.template.category === 'Legal'),
        // ── Cost engine size-band support ──────────────────────────────
        quantity: link.defaultQuantity,
        quantityByBand,
        recurrence,
      };
    });

    return NextResponse.json(requirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}