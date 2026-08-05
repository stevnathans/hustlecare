// app/api/admin/legal-fee-schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { resolveFeePricingFromBody } from '@/lib/legalFeeScheduleAdmin';

export const dynamic = 'force-dynamic';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.legalFeeSchedule.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: 'Fee schedule row not found.' }, { status: 404 });

    // Pricing: the admin UI always sends the full pricing block on edit
    // (fixed OR range, never partial), so resolve it the same way as
    // create. If neither `price` nor `usePriceRange`+min/max is present
    // at all, leave pricing untouched (a pure non-price field edit).
    const touchesPricing = body.price !== undefined || body.priceMin !== undefined || body.priceMax !== undefined || body.usePriceRange !== undefined;
    let pricingUpdate: { price?: number | null; priceMin?: number | null; priceMax?: number | null } = {};
    if (touchesPricing) {
      const pricing = resolveFeePricingFromBody(body);
      if ('error' in pricing) return NextResponse.json({ error: pricing.error }, { status: 400 });
      pricingUpdate = pricing;
    }

    if (body.countyId !== undefined) {
      const county = await prisma.county.findUnique({ where: { id: Number(body.countyId) }, select: { id: true } });
      if (!county) return NextResponse.json({ error: 'County not found.' }, { status: 400 });
    }
    if (body.tradeClassId !== undefined && body.tradeClassId !== null) {
      const tradeClass = await prisma.tradeClass.findUnique({ where: { id: Number(body.tradeClassId) }, select: { id: true } });
      if (!tradeClass) return NextResponse.json({ error: 'Trade class not found.' }, { status: 400 });
    }

    const nextCountyId = body.countyId !== undefined ? Number(body.countyId) : existing.countyId;
    const nextTradeClassId = body.tradeClassId !== undefined
      ? (body.tradeClassId === null ? null : Number(body.tradeClassId))
      : existing.tradeClassId;
    const nextSizeBand = body.sizeBand !== undefined ? (body.sizeBand || null) : existing.sizeBand;

    const combinationChanged =
      nextCountyId !== existing.countyId ||
      nextTradeClassId !== existing.tradeClassId ||
      nextSizeBand !== existing.sizeBand;

    if (combinationChanged) {
      const duplicate = await prisma.legalFeeSchedule.findFirst({
        where: {
          id: { not: Number(id) },
          templateId: existing.templateId,
          countyId: nextCountyId,
          tradeClassId: nextTradeClassId,
          sizeBand: nextSizeBand,
        },
        select: { id: true },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A pricing row for this county/trade class/size already exists. Edit that row instead.' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.legalFeeSchedule.update({
      where: { id: Number(id) },
      data: {
        countyId: body.countyId !== undefined ? Number(body.countyId) : undefined,
        tradeClassId: body.tradeClassId !== undefined
          ? (body.tradeClassId === null ? null : Number(body.tradeClassId))
          : undefined,
        sizeBand: body.sizeBand !== undefined ? (body.sizeBand || null) : undefined,
        ...(touchesPricing ? pricingUpdate : {}),
        validityValue: body.validityValue !== undefined ? (body.validityValue === null ? null : Number(body.validityValue)) : undefined,
        validityUnit: body.validityUnit !== undefined ? (body.validityUnit || null) : undefined,
        processingTimeMinDays: body.processingTimeMinDays !== undefined ? (body.processingTimeMinDays === null ? null : Number(body.processingTimeMinDays)) : undefined,
        processingTimeMaxDays: body.processingTimeMaxDays !== undefined ? (body.processingTimeMaxDays === null ? null : Number(body.processingTimeMaxDays)) : undefined,
        applyUrl: body.applyUrl !== undefined ? (body.applyUrl?.trim() || null) : undefined,
        notes: body.notes !== undefined ? (body.notes?.trim() || null) : undefined,
      },
      include: {
        county: { select: { id: true, name: true } },
        tradeClass: { select: { id: true, name: true } },
      },
    });

    await createAuditLog({ action: 'UPDATE', entity: 'Product', entityId: id, changes: { fields: Object.keys(body), updatedBy: user.id } });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating fee schedule row:', error);
    return NextResponse.json({ error: 'Failed to update fee schedule row.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.delete');
    const { id } = await params;

    const existing = await prisma.legalFeeSchedule.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: 'Fee schedule row not found.' }, { status: 404 });

    await prisma.legalFeeSchedule.delete({ where: { id: Number(id) } });
    await createAuditLog({ action: 'DELETE', entity: 'Product', entityId: id, changes: { deletedBy: user.id } });

    return NextResponse.json({ message: 'Fee schedule row deleted.' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting fee schedule row:', error);
    return NextResponse.json({ error: 'Failed to delete fee schedule row.' }, { status: 500 });
  }
}