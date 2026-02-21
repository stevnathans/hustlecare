// app/api/business/[slug]/requirements/route.ts
// Public-facing endpoint that returns requirements for a business page.
// Merges template fields with link-level overrides and resolves [businessName] token.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

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
        template: { isDeprecated: false },
      },
      include: {
        template: {
          include: {
            _count: { select: { products: true } },
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });

    // Resolve each requirement for the public-facing response
    const requirements = links.map((link) => {
      const templateDesc = link.template.description ?? '';
      const resolvedTemplateDesc = templateDesc.replace(/\[businessName\]/gi, business.name);
      const effectiveDescription = link.descriptionOverride ?? resolvedTemplateDesc;

      return {
        id: link.id,           // This is the BusinessRequirement id (link id)
        templateId: link.template.id,
        name: link.template.name,
        description: effectiveDescription,
        image: link.template.image,
        category: link.template.category,
        necessity: link.template.necessity,
        productCount: link.template._count.products,
      };
    });

    return NextResponse.json(requirements);
  } catch (error) {
    console.error('Error fetching requirements:', error);
    return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
  }
}