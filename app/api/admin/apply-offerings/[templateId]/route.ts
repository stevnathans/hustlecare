// app/api/admin/apply-offerings/[templateId]/route.ts
//
// PUT saves the price, turnaround, "what's included" and document checklist
// for one requirement (creating the offering the first time).
//
// Checklist items keep their ids when edited, so documents customers have
// already uploaded stay attached to the right item. If you remove an item,
// the files already uploaded for it move to "Other documents".
//
// Changing the price does NOT touch people already in progress: each
// request keeps the price it was quoted.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DocInput {
  id?: number;
  label: string;
  description: string | null;
  isRequired: boolean;
}

function optionalDays(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 365 ? n : 'invalid';
}

export async function PUT(request: Request, { params }: { params: Promise<{ templateId: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const templateId = Number((await params).templateId);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return NextResponse.json({ error: 'Invalid requirement.' }, { status: 400 });
    }

    const template = await prisma.requirementTemplate.findUnique({ where: { id: templateId }, select: { id: true } });
    if (!template) return NextResponse.json({ error: 'Requirement not found.' }, { status: 404 });

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });

    const serviceFee = Number(body.serviceFee);
    if (!Number.isFinite(serviceFee) || serviceFee <= 0 || serviceFee > 1_000_000) {
      return NextResponse.json({ error: 'Enter a service fee above 0 (in KES).' }, { status: 400 });
    }

    const daysMin = optionalDays(body.typicalDaysMin);
    const daysMax = optionalDays(body.typicalDaysMax);
    if (daysMin === 'invalid' || daysMax === 'invalid') {
      return NextResponse.json({ error: 'Turnaround days must be whole numbers between 1 and 365.' }, { status: 400 });
    }
    if (daysMin !== null && daysMax !== null && daysMin > daysMax) {
      return NextResponse.json({ error: 'The shortest turnaround cannot be longer than the longest.' }, { status: 400 });
    }

    const included: string[] = (Array.isArray(body.whatsIncluded) ? body.whatsIncluded : [])
      .filter((x: unknown): x is string => typeof x === 'string')
      .map((x: string) => x.trim().slice(0, 150))
      .filter(Boolean)
      .slice(0, 10);

    const rawDocs: unknown[] = Array.isArray(body.documents) ? body.documents : [];
    if (rawDocs.length > 20) return NextResponse.json({ error: 'A checklist can have at most 20 documents.' }, { status: 400 });

    const docs: DocInput[] = [];
    for (const raw of rawDocs) {
      const d = raw as Record<string, unknown>;
      const label = typeof d.label === 'string' ? d.label.trim().slice(0, 100) : '';
      if (!label) return NextResponse.json({ error: 'Every document needs a name.' }, { status: 400 });
      docs.push({
        id: Number.isInteger(d.id) ? (d.id as number) : undefined,
        label,
        description: typeof d.description === 'string' && d.description.trim() ? d.description.trim().slice(0, 200) : null,
        isRequired: d.isRequired !== false,
      });
    }

    const isActive = body.isActive !== false;

    await prisma.$transaction(async (tx) => {
      const offering = await tx.applyServiceOffering.upsert({
        where: { templateId },
        create: { templateId, serviceFee, typicalDaysMin: daysMin, typicalDaysMax: daysMax, whatsIncluded: included, isActive },
        update: { serviceFee, typicalDaysMin: daysMin, typicalDaysMax: daysMax, whatsIncluded: included, isActive },
        include: { documents: true },
      });

      const existing = new Set(offering.documents.map((d) => d.id));
      const keep = new Set(docs.filter((d) => d.id !== undefined && existing.has(d.id)).map((d) => d.id as number));
      const removed = [...existing].filter((id) => !keep.has(id));

      if (removed.length > 0) {
        await tx.applyAssistanceDocument.updateMany({ where: { specId: { in: removed } }, data: { specId: null } });
        await tx.applyServiceDocumentSpec.deleteMany({ where: { id: { in: removed } } });
      }

      for (const [index, d] of docs.entries()) {
        if (d.id !== undefined && existing.has(d.id)) {
          await tx.applyServiceDocumentSpec.update({
            where: { id: d.id },
            data: { label: d.label, description: d.description, isRequired: d.isRequired, displayOrder: index },
          });
        } else {
          await tx.applyServiceDocumentSpec.create({
            data: { offeringId: offering.id, label: d.label, description: d.description, isRequired: d.isRequired, displayOrder: index },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving apply offering:', error);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}