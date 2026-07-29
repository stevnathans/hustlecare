// app/api/admin/legal-fee-schedules/bulk-default/route.ts
//
// Sets one flat, generic price for a requirement template across ALL
// counties. Rewritten to use ONE delete + ONE bulk-insert instead of a
// 47-iteration loop — the loop version could exceed the database's
// transaction timeout on a remote DB (e.g. Supabase), silently rolling
// back with nothing saved. This version is two round-trips total,
// regardless of how many counties exist.
//
// Existing per-county or per-category/size OVERRIDES (rows with a
// non-null businessCategoryId/sizeBand) are untouched — only the generic
// (businessCategoryId: null, sizeBand: null) rows are replaced.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

export async function POST(request: Request) {
  try {
    const user = await requirePermission('products.create');
    const body = await request.json();
    const { templateId, price, validityValue, validityUnit, processingTimeMinDays, processingTimeMaxDays, notes } = body;

    if (!templateId) return NextResponse.json({ error: 'templateId is required.' }, { status: 400 });
    if (price == null || Number.isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: 'Enter a valid price.' }, { status: 400 });
    }

    const template = await prisma.requirementTemplate.findUnique({ where: { id: Number(templateId) } });
    if (!template || !template.isCountyFeeSchedule) {
      return NextResponse.json({ error: 'Requirement is not flagged as a county fee schedule.' }, { status: 400 });
    }

    const counties = await prisma.county.findMany({ select: { id: true } });
    if (counties.length === 0) {
      return NextResponse.json({ error: 'No counties found — run the county seed first.' }, { status: 400 });
    }

    const data = {
      price: Number(price),
      validityValue: validityValue != null ? Number(validityValue) : null,
      validityUnit: validityValue != null ? (validityUnit || null) : null,
      processingTimeMinDays: processingTimeMinDays != null ? Number(processingTimeMinDays) : null,
      processingTimeMaxDays: processingTimeMaxDays != null ? Number(processingTimeMaxDays) : null,
      notes: notes?.trim() || null,
    };

    // Wipe existing generic rows for this template, then recreate one per
    // county in a single batch insert.
    await prisma.legalFeeSchedule.deleteMany({
      where: { templateId: Number(templateId), businessCategoryId: null, sizeBand: null },
    });

    await prisma.legalFeeSchedule.createMany({
      data: counties.map((county) => ({
        templateId: Number(templateId),
        countyId: county.id,
        businessCategoryId: null,
        sizeBand: null,
        ...data,
      })),
      skipDuplicates: true,
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Product',
      entityId: templateId.toString(),
      changes: { price: data.price, countiesAffected: counties.length, updatedBy: user.id },
    });

    return NextResponse.json({
      message: `Set flat rate for ${counties.length} counties.`,
      countiesAffected: counties.length,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error bulk-setting fee schedule:', error);
    return NextResponse.json({ error: 'Failed to bulk-set fee schedule.' }, { status: 500 });
  }
}