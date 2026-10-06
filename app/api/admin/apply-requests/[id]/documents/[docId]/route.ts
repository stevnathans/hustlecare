// app/api/admin/apply-requests/[id]/documents/[docId]/route.ts
//
// GET   → a short-lived download link for one document
// PATCH → accept or reject it (rejecting needs a reason; the customer is
//         told what to re-upload, and the request drops back to Paid until
//         they do)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { createSignedDownloadUrl } from '@/lib/storage/privateStorage';
import { logEvent } from '@/lib/applyAssistance/events';
import { syncReadyStage } from '@/lib/applyAssistance/lifecycle';
import { notifyCustomer } from '@/lib/applyAssistance/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Params = { params: Promise<{ id: string; docId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id, docId } = await params;
    const doc = await prisma.applyAssistanceDocument.findFirst({ where: { id: docId, requestId: id } });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    const url = await createSignedDownloadUrl(doc.storagePath, 600, doc.fileName);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error creating document link:', error);
    return NextResponse.json({ error: 'Could not open that document.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id, docId } = await params;
    const body = await request.json().catch(() => ({}));

    if (body.status !== 'ACCEPTED' && body.status !== 'REJECTED') {
      return NextResponse.json({ error: 'Status must be ACCEPTED or REJECTED.' }, { status: 400 });
    }
    const reason = typeof body.rejectReason === 'string' ? body.rejectReason.trim().slice(0, 300) : '';
    if (body.status === 'REJECTED' && !reason) {
      return NextResponse.json({ error: 'Say why it was rejected so the customer knows what to fix.' }, { status: 400 });
    }

    const doc = await prisma.applyAssistanceDocument.findFirst({
      where: { id: docId, requestId: id, isDeliverable: false },
    });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    await prisma.applyAssistanceDocument.update({
      where: { id: doc.id },
      data: { status: body.status, rejectReason: body.status === 'REJECTED' ? reason : null },
    });

    await logEvent(
      prisma,
      id,
      'DOCUMENT_REVIEWED',
      body.status === 'REJECTED' ? `Rejected: ${doc.label} — ${reason}` : `Accepted: ${doc.label}.`,
      { actor: 'admin' },
    );

    await syncReadyStage(id);
    if (body.status === 'REJECTED') {
      await notifyCustomer(id, 'DOC_REJECTED', { docLabel: doc.label, reason }).catch((err) =>
        console.error('Rejection message failed:', err),
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reviewing document:', error);
    return NextResponse.json({ error: 'Failed to update the document.' }, { status: 500 });
  }
}