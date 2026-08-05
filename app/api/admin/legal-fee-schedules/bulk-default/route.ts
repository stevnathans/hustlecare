// app/api/admin/legal-fee-schedules/bulk-default/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { resolveFeePricingFromBody } from '@/lib/legalFeeScheduleAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const user = await requirePermission('products.create');
    const body = await request.json();
    const { templateId, validityValue, validityUnit, processingTimeMinDays, processingTimeMaxDays, applyUrl, notes } = body;

    if (!templateId) return NextResponse.json({ error: 'templateId is required.' }, { status: 400 });

    const pricing = resolveFeePricingFromBody(body);
    if ('error' in pricing) return NextResponse.json({ error: pricing.error }, { status: 400 });

    const template = await prisma.requirementTemplate.findUnique({ where: { id: Number(templateId) } });
    if (!template || !template.isCountyFeeSchedule) {
      return NextResponse.json({ error: 'Requirement is not flagged as a county fee schedule.' }, { status: 400 });
    }

    const counties = await prisma.county.findMany({ select: { id: true } });
    if (counties.length === 0) {
      return NextResponse.json({ error: 'No counties found — run the county seed first.' }, { status: 400 });
    }

    const data = {
      price: pricing.price,
      priceMin: pricing.priceMin,
      priceMax: pricing.priceMax,
      validityValue: validityValue != null ? Number(validityValue) : null,
      validityUnit: validityValue != null ? (validityUnit || null) : null,
      processingTimeMinDays: processingTimeMinDays != null ? Number(processingTimeMinDays) : null,
      processingTimeMaxDays: processingTimeMaxDays != null ? Number(processingTimeMaxDays) : null,
      applyUrl: applyUrl?.trim() || null,
      notes: notes?.trim() || null,
    };

    let created = 0;
    let updated = 0;

    await prisma.$transaction(async (tx) => {
      for (const county of counties) {
        const existing = await tx.legalFeeSchedule.findFirst({
          where: { templateId: Number(templateId), countyId: county.id, tradeClassId: null, sizeBand: null },
        });
        if (existing) {
          await tx.legalFeeSchedule.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await tx.legalFeeSchedule.create({
            data: { templateId: Number(templateId), countyId: county.id, tradeClassId: null, sizeBand: null, ...data },
          });
          created++;
        }
      }
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Product',
      entityId: templateId.toString(),
      changes: { price: data.price, priceMin: data.priceMin, priceMax: data.priceMax, countiesAffected: counties.length, created, updated, updatedBy: user.id },
    });

    return NextResponse.json({ message: `Set rate for ${counties.length} counties.`, created, updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error bulk-setting fee schedule:', error);
    return NextResponse.json({ error: 'Failed to bulk-set fee schedule.' }, { status: 500 });
  }
}