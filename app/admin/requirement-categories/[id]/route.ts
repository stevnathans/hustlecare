// app/api/admin/requirement-categories/[id]/route.ts
//
// Single-purpose PATCH: sets RequirementCategory.defaultCostRecurrence.
// New, narrow route — deliberately doesn't touch name/slug/colorToken/
// excludedFromTotals/necessityScale/usesLegalCountyFilter, none of which
// this page (app/admin/requirement-categories) exposes, so there's no
// path for it to silently clobber a field it doesn't show.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

export const dynamic = 'force-dynamic';

const VALID_RECURRENCE = new Set(['ONE_TIME', 'MONTHLY', 'ANNUAL']);

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update');
    const { id } = await params;
    const body = await request.json();
    const { defaultCostRecurrence } = body;

    if (!VALID_RECURRENCE.has(defaultCostRecurrence)) {
      return NextResponse.json(
        { error: 'defaultCostRecurrence must be one of ONE_TIME, MONTHLY, ANNUAL.' },
        { status: 400 },
      );
    }

    const existing = await prisma.requirementCategory.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    const updated = await prisma.requirementCategory.update({
      where: { id: Number(id) },
      data: { defaultCostRecurrence },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      changes: { defaultCostRecurrence, updatedBy: user.id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error updating category recurrence:', error);
    return NextResponse.json({ error: 'Failed to update category.' }, { status: 500 });
  }
}