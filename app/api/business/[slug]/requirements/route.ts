// app/api/business/[slug]/requirements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_MARKET, isMarketCode } from '@/lib/markets';
import { selectTemplateDescription } from '@/lib/requirement-description';

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
        // Full include (no `select`) — `link.template.slug` and
        // `link.template.published` (added in the Stage 1 migration) are
        // already present on every row here without any query change.
        template: {
          include: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const requirements = links.map((link) => {
      const templateDesc = selectTemplateDescription(link.template, market) ?? '';
      const resolvedTemplateDesc = templateDesc.replace(/\[businessName\]/gi, business.name);
      const effectiveDescription = link.descriptionOverride ?? resolvedTemplateDesc;

      return {
        id: link.id,
        templateId: link.template.id,
        name: link.template.name,
        description: effectiveDescription,
        image: link.template.image,
        category: link.template.category,
        necessity: link.necessityOverride ?? link.template.necessity,
        productCount: link.template._count.products,
        // Only a valid link target when the template is published AND
        // we're on the Kenya market — /requirements/{slug} (Stage 2) is
        // Kenya-scoped: it fetches Kenya business links and frames copy
        // around "in Kenya." Linking a US visitor there would be a
        // content mismatch, not a 404, until Stage 4 ships a
        // market-aware /us/requirements/{slug}. Mirrors the same gating
        // rule already applied in the SSR paths
        // (app/businesses/[slug]/requirements/page.tsx sets this from
        // `template.published`; the US equivalent always sends null for
        // the same reason this route does).
        slug: market === 'KE' && link.template.published ? link.template.slug : null,
      };
    });

    return NextResponse.json(requirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}