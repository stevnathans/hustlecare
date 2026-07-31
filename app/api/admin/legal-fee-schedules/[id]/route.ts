// app/api/admin/legal-fee-schedules/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update');
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.legalFeeSchedule.findUnique({ where: { id: Number(id) } });
    if (!existing) return NextResponse.json({ error: 'Fee schedule row not found.' }, { status: 404 });

    const updated = await prisma.legalFeeSchedule.update({
      where: { id: Number(id) },
      data: {
        price: body.price !== undefined ? Number(body.price) : undefined,
        validityValue: body.validityValue !== undefined ? (body.validityValue === null ? null : Number(body.validityValue)) : undefined,
        validityUnit: body.validityUnit !== undefined ? (body.validityUnit || null) : undefined,
        processingTimeMinDays: body.processingTimeMinDays !== undefined ? (body.processingTimeMinDays === null ? null : Number(body.processingTimeMinDays)) : undefined,
        processingTimeMaxDays: body.processingTimeMaxDays !== undefined ? (body.processingTimeMaxDays === null ? null : Number(body.processingTimeMaxDays)) : undefined,
        employeeCountMax: body.employeeCountMax !== undefined ? (body.employeeCountMax === null ? null : Number(body.employeeCountMax)) : undefined,
        floorAreaSqm: body.floorAreaSqm !== undefined ? (body.floorAreaSqm === null ? null : Number(body.floorAreaSqm)) : undefined,
        notes: body.notes !== undefined ? (body.notes?.trim() || null) : undefined,
      },
    });

    await createAuditLog({ action: 'UPDATE', entity: 'LegalFeeSchedule', entityId: id, changes: { fields: Object.keys(body), updatedBy: user.id } });
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
    await createAuditLog({ action: 'DELETE', entity: 'LegalFeeSchedule', entityId: id, changes: { deletedBy: user.id } });

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