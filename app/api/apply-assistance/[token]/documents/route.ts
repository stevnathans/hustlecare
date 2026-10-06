// app/api/apply-assistance/[token]/documents/route.ts
//
// A customer uploads one document against a checklist item. Allowed only
// after payment. The file type comes from the file's own bytes.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { uploadPrivateFile } from '@/lib/storage/privateStorage';
import { logEvent } from '@/lib/applyAssistance/events';
import { syncReadyStage } from '@/lib/applyAssistance/lifecycle';
import {
  MAX_UPLOAD_BYTES,
  MAX_DOCUMENTS_PER_REQUEST,
  MAX_DOCUMENTS_PER_ITEM,
  detectFileType,
  safeFileName,
} from '@/lib/applyAssistance/uploads';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const lead = await prisma.applyAssistanceRequest.findUnique({
      where: { publicToken: token },
      select: { id: true, stage: true, templateId: true },
    });
    if (!lead) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (lead.stage !== 'PAID' && lead.stage !== 'READY') {
      return NextResponse.json(
        { error: lead.stage === 'LEAD' ? 'You can upload documents once your payment is confirmed.' : 'This application is no longer accepting documents.' },
        { status: 409 },
      );
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'That file is too large. The limit is 4 MB.' }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectFileType(bytes);
    if (!type) {
      return NextResponse.json({ error: 'Upload a PDF or a photo (JPG, PNG or WebP).' }, { status: 400 });
    }

    // Which checklist item is this for?
    let specId: number | null = null;
    let label = 'Other document';
    const rawSpec = Number(form?.get('specId'));
    if (Number.isInteger(rawSpec) && rawSpec > 0) {
      const spec = lead.templateId
        ? await prisma.applyServiceDocumentSpec.findFirst({
            where: { id: rawSpec, offering: { templateId: lead.templateId } },
          })
        : null;
      if (!spec) return NextResponse.json({ error: 'Unknown document type.' }, { status: 400 });
      specId = spec.id;
      label = spec.label;
    }

    const [total, forItem] = await Promise.all([
      prisma.applyAssistanceDocument.count({ where: { requestId: lead.id, isDeliverable: false } }),
      prisma.applyAssistanceDocument.count({
        where: { requestId: lead.id, isDeliverable: false, specId, status: { not: 'REJECTED' } },
      }),
    ]);
    if (total >= MAX_DOCUMENTS_PER_REQUEST) {
      return NextResponse.json({ error: 'You have reached the upload limit for this request.' }, { status: 429 });
    }
    if (forItem >= MAX_DOCUMENTS_PER_ITEM) {
      return NextResponse.json({ error: 'You already uploaded the maximum for this item. Remove one first.' }, { status: 429 });
    }

    const fileName = safeFileName(file.name, type.ext);
    const storagePath = `${lead.id}/${crypto.randomUUID()}-${fileName.replace(/ /g, '_')}`;

    await uploadPrivateFile(storagePath, bytes, type.mime);

    const doc = await prisma.applyAssistanceDocument.create({
      data: {
        requestId: lead.id,
        specId,
        label,
        storagePath,
        fileName,
        mimeType: type.mime,
        sizeBytes: bytes.length,
      },
      select: { id: true },
    });

    await logEvent(prisma, lead.id, 'DOCUMENT_UPLOADED', `Uploaded: ${label} (${fileName}).`, { actor: 'customer' });
    await syncReadyStage(lead.id);

    return NextResponse.json({ id: doc.id }, { status: 201 });
  } catch (error) {
    console.error('Error uploading apply-assistance document:', error);
    return NextResponse.json({ error: 'The upload failed. Please try again.' }, { status: 500 });
  }
}