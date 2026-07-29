// app/api/admin/legal-fee-schedules/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

// GET — list fee schedule rows for a requirement template
export async function GET(request: Request) {
  try {
    await requirePermission('products.view');
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    if (!templateId) return NextResponse.json({ error: 'templateId is required.' }, { status: 400 });

    const rows = await prisma.legalFeeSchedule.findMany({
      where: { templateId: Number(templateId) },
      include: { county: { select: { id: true, name: true } }, businessCategory: { select: { id: true, name: true } } },
      orderBy: [{ county: { name: 'asc' } }],
    });

    return NextResponse.json(rows);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching fee schedules:', error);
    return NextResponse.json({ error: 'Failed to fetch fee schedules.' }, { status: 500 });
  }
}

// POST — create or update a single row (specific county, optional category/size override)
export async function POST(request: Request) {
  try {
    const user = await requirePermission('products.create');
    const body = await request.json();
    const { templateId, countyId, businessCategoryId = null, sizeBand = null, price, validityValue, validityUnit, processingTimeMinDays, processingTimeMaxDays, notes } = body;

    if (!templateId || !countyId) return NextResponse.json({ error: 'templateId and countyId are required.' }, { status: 400 });
    if (price == null || Number.isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
    }

    const template = await prisma.requirementTemplate.findUnique({ where: { id: Number(templateId) } });
    if (!template || !template.isCountyFeeSchedule) {
      return NextResponse.json({ error: 'Requirement is not flagged as a county fee schedule.' }, { status: 400 });
    }

    const existing = await prisma.legalFeeSchedule.findFirst({
      where: {
        templateId: Number(templateId),
        countyId: Number(countyId),
        businessCategoryId: businessCategoryId ? Number(businessCategoryId) : null,
        sizeBand: sizeBand || null,
      },
    });

    const data = {
      price: Number(price),
      validityValue: validityValue != null ? Number(validityValue) : null,
      validityUnit: validityValue != null ? (validityUnit || null) : null,
      processingTimeMinDays: processingTimeMinDays != null ? Number(processingTimeMinDays) : null,
      processingTimeMaxDays: processingTimeMaxDays != null ? Number(processingTimeMaxDays) : null,
      notes: notes?.trim() || null,
    };

    const row = existing
      ? await prisma.legalFeeSchedule.update({ where: { id: existing.id }, data })
      : await prisma.legalFeeSchedule.create({
          data: {
            templateId: Number(templateId),
            countyId: Number(countyId),
            businessCategoryId: businessCategoryId ? Number(businessCategoryId) : null,
            sizeBand: sizeBand || null,
            ...data,
          },
        });

    await createAuditLog({
      action: existing ? 'UPDATE' : 'CREATE',
      entity: 'LegalFeeSchedule',
      entityId: row.id.toString(),
      changes: { templateId, countyId, price: data.price, updatedBy: user.id },
    });

    return NextResponse.json(row, { status: existing ? 200 : 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error saving fee schedule row:', error);
    return NextResponse.json({ error: 'Failed to save fee schedule row.' }, { status: 500 });
  }
}