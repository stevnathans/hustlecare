// app/api/apply-assistance/[token]/documents/[docId]/route.ts
//
// A customer removes a document they uploaded by mistake.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deletePrivateFile } from '@/lib/storage/privateStorage';
import { logEvent } from '@/lib/applyAssistance/events';
import { syncReadyStage } from '@/lib/applyAssistance/lifecycle';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string; docId: string }> },
) {
  try {
    const { token, docId } = await params;

    const lead = await prisma.applyAssistanceRequest.findUnique({
      where: { publicToken: token },
      select: { id: true, stage: true },
    });
    if (!lead) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (lead.stage !== 'PAID' && lead.stage !== 'READY') {
      return NextResponse.json({ error: 'Documents can no longer be changed.' }, { status: 409 });
    }

    const doc = await prisma.applyAssistanceDocument.findFirst({
      where: { id: docId, requestId: lead.id, isDeliverable: false, uploadedBy: 'customer' },
    });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });

    await deletePrivateFile(doc.storagePath).catch((err) => console.error('Storage delete failed:', err));
    await prisma.applyAssistanceDocument.delete({ where: { id: doc.id } });

    await logEvent(prisma, lead.id, 'DOCUMENT_UPLOADED', `Removed: ${doc.label} (${doc.fileName}).`, { actor: 'customer' });
    await syncReadyStage(lead.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing apply-assistance document:', error);
    return NextResponse.json({ error: 'Could not remove that document.' }, { status: 500 });
  }
}