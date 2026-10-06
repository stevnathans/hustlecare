// app/api/admin/apply-requests/[id]/route.ts
//
// GET    → everything the detail view needs: the request, the live business,
//          payments, documents, the document checklist, the timeline, and
//          other requests from the same phone number
// PATCH  → admin notes and archive / unarchive
// DELETE → only for requests with no payment on record (archive the rest)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { params: Promise<{ id: string }> };

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://hustlecare.net').replace(/\/$/, '');
}

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const request = await prisma.applyAssistanceRequest.findUnique({ where: { id } });
    if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    const [business, payments, documents, events, specs, duplicates] = await Promise.all([
      request.businessId
        ? prisma.business.findUnique({ where: { id: request.businessId }, select: { id: true, name: true, slug: true } })
        : null,
      prisma.applyAssistancePayment.findMany({
        where: { requestId: id },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          currency: true,
          provider: true,
          status: true,
          receiptNumber: true,
          payerPhone: true,
          failureReason: true,
          createdAt: true,
          paidAt: true,
        },
      }),
      prisma.applyAssistanceDocument.findMany({ where: { requestId: id }, orderBy: { createdAt: 'asc' } }),
      prisma.applyAssistanceEvent.findMany({ where: { requestId: id }, orderBy: { createdAt: 'desc' }, take: 100 }),
      request.templateId
        ? prisma.applyServiceDocumentSpec.findMany({
            where: { offering: { templateId: request.templateId } },
            orderBy: { displayOrder: 'asc' },
          })
        : [],
      request.contactPhoneE164
        ? prisma.applyAssistanceRequest.findMany({
            where: { contactPhoneE164: request.contactPhoneE164, id: { not: id } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { id: true, requirementName: true, stage: true, createdAt: true },
          })
        : [],
    ]);

    const have = new Set(
      documents.filter((d) => !d.isDeliverable && d.status !== 'REJECTED').map((d) => d.specId),
    );
    const checklist = specs.map((s) => ({
      id: s.id,
      label: s.label,
      isRequired: s.isRequired,
      satisfied: have.has(s.id),
    }));

    return NextResponse.json({
      request,
      business,
      payments,
      documents,
      events,
      checklist,
      duplicates,
      trackUrl: request.publicToken ? `${siteUrl()}/apply-help/track/${request.publicToken}` : null,
    });
  } catch (error) {
    console.error('Error fetching apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to fetch request.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.adminNotes !== undefined) {
      if (typeof body.adminNotes !== 'string') return NextResponse.json({ error: 'Invalid notes.' }, { status: 400 });
      data.adminNotes = body.adminNotes.trim().slice(0, 4000) || null;
    }
    if (body.archived !== undefined) {
      if (typeof body.archived !== 'boolean') return NextResponse.json({ error: 'Invalid value.' }, { status: 400 });
      data.archived = body.archived;
      if (body.archived) data.nextReminderAt = null; // archived leads are never reminded
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    await prisma.applyAssistanceRequest.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to update request.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const payments = await prisma.applyAssistancePayment.count({ where: { requestId: id } });
    if (payments > 0) {
      return NextResponse.json(
        { error: 'This request has payment records, so it cannot be deleted. Archive it instead.' },
        { status: 409 },
      );
    }
    await prisma.applyAssistanceRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to delete request.' }, { status: 500 });
  }
}