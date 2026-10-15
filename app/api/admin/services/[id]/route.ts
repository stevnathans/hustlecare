// app/api/admin/services/[id]/route.ts
//
// PUT → save a service together with its packages and file checklist.
// (The slug can't be changed: it is the page address and ties orders to the
// questionnaire.)

import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { parseServiceInput, ValidationError } from '@/lib/services/validate';
import { saveServiceTree } from '@/lib/services/save';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const id = Number((await params).id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'Invalid service.' }, { status: 400 });

    const existing = await prisma.service.findUnique({ where: { id }, select: { id: true, slug: true } });
    if (!existing) return NextResponse.json({ error: 'Service not found.' }, { status: 404 });

    const parsed = parseServiceInput(await request.json().catch(() => null));
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const d = parsed.data;

    await prisma.$transaction(async (tx) => {
      await tx.service.update({
        where: { id },
        data: {
          name: d.name,
          shortDescription: d.shortDescription,
          emoji: d.emoji,
          category: d.category,
          ctaLabel: d.ctaLabel,
          isActive: d.isActive,
          displayOrder: d.displayOrder,
        },
      });
      await saveServiceTree(tx, id, d);
    });

    // Public pages are cached for a few minutes; this makes edits show straight away.
    revalidatePath('/services');
    revalidatePath(`/services/${existing.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Error saving service:', error);
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 });
  }
}