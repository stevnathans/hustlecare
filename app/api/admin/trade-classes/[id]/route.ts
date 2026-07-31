// app/api/admin/trade-classes/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

type Params = { params: Promise<{ id: string }> };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uniqueSlug(base: string, excludeId: number): Promise<string> {
  let slug = base || 'trade-class';
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.tradeClass.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update');
    const { id } = await params;
    const tradeClassId = Number(id);
    const body = await request.json();
    const { name, description, categoryIds } = body;

    const existing = await prisma.tradeClass.findUnique({ where: { id: tradeClassId } });
    if (!existing) return NextResponse.json({ error: 'Trade class not found.' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) {
      if (!name.trim()) return NextResponse.json({ error: 'Name cannot be empty.' }, { status: 400 });
      data.name = name.trim();
      if (name.trim() !== existing.name) {
        data.slug = await uniqueSlug(slugify(name), tradeClassId);
      }
    }
    if (description !== undefined) data.description = description?.trim() || null;

    const updated = await prisma.tradeClass.update({ where: { id: tradeClassId }, data });

    // Reassign which BusinessCategories default to this trade class, if
    // the caller sent a categoryIds list. Clear-then-set keeps this
    // idempotent and correct even when categories are being removed.
    if (Array.isArray(categoryIds)) {
      await prisma.$transaction([
        prisma.businessCategory.updateMany({
          where: { defaultTradeClassId: tradeClassId },
          data: { defaultTradeClassId: null },
        }),
        ...(categoryIds.length > 0
          ? [
              prisma.businessCategory.updateMany({
                where: { id: { in: categoryIds.map(Number) } },
                data: { defaultTradeClassId: tradeClassId },
              }),
            ]
          : []),
      ]);
    }

    await createAuditLog({
      action: 'UPDATE',
      entity: 'TradeClass',
      entityId: id,
      changes: { fields: Object.keys(body), updatedBy: user.id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating trade class:', error);
    return NextResponse.json({ error: 'Failed to update trade class.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.delete');
    const { id } = await params;
    const tradeClassId = Number(id);

    const existing = await prisma.tradeClass.findUnique({
      where: { id: tradeClassId },
      include: { _count: { select: { feeSchedules: true, businesses: true, defaultForCategories: true } } },
    });
    if (!existing) return NextResponse.json({ error: 'Trade class not found.' }, { status: 404 });

    const inUse =
      existing._count.feeSchedules > 0 || existing._count.businesses > 0 || existing._count.defaultForCategories > 0;
    if (inUse) {
      return NextResponse.json(
        {
          error: `Can't delete — still in use by ${existing._count.feeSchedules} fee row(s), ${existing._count.businesses} business override(s), and ${existing._count.defaultForCategories} category default(s). Reassign or remove those first.`,
        },
        { status: 409 }
      );
    }

    await prisma.tradeClass.delete({ where: { id: tradeClassId } });

    await createAuditLog({
      action: 'DELETE',
      entity: 'TradeClass',
      entityId: id,
      changes: { deletedBy: user.id },
    });

    return NextResponse.json({ message: 'Trade class deleted.' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error deleting trade class:', error);
    return NextResponse.json({ error: 'Failed to delete trade class.' }, { status: 500 });
  }
}