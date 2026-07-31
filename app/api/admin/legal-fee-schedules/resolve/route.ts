/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/legal-fee-schedules/resolve/route.ts
//
// Batch resolver for the standalone calculator. Deliberately imports
// BusinessSizeBand from our own types file, NOT from @prisma/client —
// importing the Prisma-generated enum type here made this route fail to
// compile whenever `npx prisma generate` hadn't been re-run since the
// last schema change, which crashed the whole route (Next.js then served
// its HTML error page instead of JSON — the "<!DOCTYPE" error).

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveFeeSchedule } from '@/lib/legalFeeSchedule';
import type { BusinessSizeBand } from '@/types';

const VALID_SIZE_BANDS = new Set(['MICRO', 'SMALL', 'MEDIUM', 'LARGE']);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const countyIdParam = searchParams.get('countyId');
    const tradeClassIdParam = searchParams.get('tradeClassId');
    const sizeBandParam = searchParams.get('sizeBand');

    if (!countyIdParam) {
      return NextResponse.json({ error: 'countyId is required.' }, { status: 400 });
    }
    const countyId = Number(countyIdParam);
    if (!Number.isFinite(countyId)) {
      return NextResponse.json({ error: 'Invalid countyId.' }, { status: 400 });
    }

    const tradeClassId = tradeClassIdParam ? Number(tradeClassIdParam) : null;
    if (tradeClassIdParam && !Number.isFinite(tradeClassId as number)) {
      return NextResponse.json({ error: 'Invalid tradeClassId.' }, { status: 400 });
    }

    let sizeBand: BusinessSizeBand | null = null;
    if (sizeBandParam) {
      if (!VALID_SIZE_BANDS.has(sizeBandParam)) {
        return NextResponse.json({ error: 'Invalid sizeBand.' }, { status: 400 });
      }
      sizeBand = sizeBandParam as BusinessSizeBand;
    }

    const county = await prisma.county.findUnique({ where: { id: countyId }, select: { id: true, name: true } });
    if (!county) {
      return NextResponse.json({ error: 'County not found.' }, { status: 404 });
    }

    const templates = await prisma.requirementTemplate.findMany({
      where: { isCountyFeeSchedule: true, isDeprecated: false },
      select: { id: true, name: true, description: true, category: true },
      orderBy: { name: 'asc' },
    });

    if (templates.length === 0) {
      return NextResponse.json({ county, items: [] });
    }

    const templateIds = templates.map((t) => t.id);

    const schedules = await prisma.legalFeeSchedule.findMany({
      where: { templateId: { in: templateIds }, countyId },
      select: {
        id: true, templateId: true, countyId: true, tradeClassId: true, sizeBand: true,
        employeeCountMax: true, floorAreaSqm: true,
        price: true, validityValue: true, validityUnit: true,
        processingTimeMinDays: true, processingTimeMaxDays: true, notes: true,
      },
    });

    const schedulesByTemplate = new Map<number, typeof schedules>();
    for (const row of schedules) {
      const list = schedulesByTemplate.get(row.templateId) ?? [];
      list.push(row);
      schedulesByTemplate.set(row.templateId, list);
    }

    const items = templates.map((template) => {
      const templateSchedules = schedulesByTemplate.get(template.id) ?? [];
      const resolution = resolveFeeSchedule(templateSchedules as any, countyId, { tradeClassId, sizeBand });
      return {
        templateId: template.id,
        name: template.name,
        description: template.description,
        category: template.category,
        resolution,
      };
    });

    return NextResponse.json({ county, items });
  } catch (error) {
    console.error('Error resolving legal fee schedules:', error);
    return NextResponse.json({ error: 'Failed to resolve fee schedules.' }, { status: 500 });
  }
}