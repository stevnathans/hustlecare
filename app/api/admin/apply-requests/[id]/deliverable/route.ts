// app/api/admin/apply-requests/[id]/deliverable/route.ts
//
// Admin uploads the finished permit / certificate for the customer to
// download from their tracking page. Upload it BEFORE moving the request to
// Completed, so the "your documents are ready" message has something to
// point at.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { uploadPrivateFile } from '@/lib/storage/privateStorage';
import { logEvent } from '@/lib/applyAssistance/events';
import { MAX_UPLOAD_BYTES, detectFileType, safeFileName } from '@/lib/applyAssistance/uploads';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const lead = await prisma.applyAssistanceRequest.findUnique({ where: { id }, select: { id: true, stage: true } });
    if (!lead) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (lead.stage === 'LEAD' || lead.stage === 'CANCELLED') {
      return NextResponse.json({ error: 'Only paid requests can have a deliverable.' }, { status: 409 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'That file is over 4 MB. Compress it and try again.' }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectFileType(bytes);
    if (!type) return NextResponse.json({ error: 'Upload a PDF or an image (JPG, PNG, WebP).' }, { status: 400 });

    const rawLabel = form?.get('label');
    const label = typeof rawLabel === 'string' && rawLabel.trim() ? rawLabel.trim().slice(0, 80) : 'Your permit / certificate';
    const fileName = safeFileName(file.name, type.ext);
    const storagePath = `${lead.id}/deliverable-${crypto.randomUUID()}-${fileName.replace(/ /g, '_')}`;

    await uploadPrivateFile(storagePath, bytes, type.mime);

    const doc = await prisma.applyAssistanceDocument.create({
      data: {
        requestId: lead.id,
        label,
        storagePath,
        fileName,
        mimeType: type.mime,
        sizeBytes: bytes.length,
        status: 'ACCEPTED',
        uploadedBy: 'admin',
        isDeliverable: true,
      },
      select: { id: true },
    });

    await logEvent(prisma, lead.id, 'DOCUMENT_UPLOADED', `Deliverable uploaded: ${label} (${fileName}).`, { actor: 'admin' });
    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (error) {
    console.error('Error uploading deliverable:', error);
    return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });
  }
}