// app/api/admin/apply-offerings/route.ts
//
// Every Kenyan requirement template, with its "Apply For Me" offering
// (price, turnaround, what's included, document checklist) if it has one.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const [templates, offerings] = await Promise.all([
      prisma.requirementTemplate.findMany({
        where: { isDeprecated: false, OR: [{ restrictedToCountry: 'KE' }, { restrictedToCountry: null }] },
        select: { id: true, name: true, category: true, isCountyFeeSchedule: true },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      }),
      prisma.applyServiceOffering.findMany({
        include: { documents: { orderBy: { displayOrder: 'asc' } } },
      }),
    ]);

    const byTemplate = new Map(offerings.map((o) => [o.templateId, o]));

    return NextResponse.json({
      templates: templates.map((t) => {
        const o = byTemplate.get(t.id);
        return {
          ...t,
          offering: o
            ? {
                serviceFee: o.serviceFee,
                typicalDaysMin: o.typicalDaysMin,
                typicalDaysMax: o.typicalDaysMax,
                whatsIncluded: o.whatsIncluded,
                isActive: o.isActive,
                documents: o.documents.map((d) => ({
                  id: d.id,
                  label: d.label,
                  description: d.description,
                  isRequired: d.isRequired,
                })),
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error('Error fetching apply offerings:', error);
    return NextResponse.json({ error: 'Failed to load requirements.' }, { status: 500 });
  }
}