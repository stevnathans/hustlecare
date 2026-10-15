// app/api/service-orders/[token]/files/route.ts
//
// A customer uploads one file (logo, photos, documents...) against an item on
// their order's checklist, or as "other". The file type comes from the file's
// own bytes, not from the browser.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { uploadPrivateFile } from "@/lib/storage/privateStorage";
import { logOrderEvent } from "@/lib/services/orders/events";
import { MAX_UPLOAD_BYTES, MAX_DOCUMENTS_PER_REQUEST, MAX_DOCUMENTS_PER_ITEM, detectFileType, safeFileName } from "@/lib/applyAssistance/uploads";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const order = await prisma.questionnaireDraft.findUnique({
      where: { publicToken: token },
      select: { id: true, stage: true, serviceSlug: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!["AWAITING_DEPOSIT", "IN_PROGRESS", "IN_REVIEW"].includes(order.stage)) {
      return NextResponse.json({ error: "This order is no longer accepting files." }, { status: 409 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "That file is too large. The limit is 4 MB." }, { status: 413 });

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectFileType(bytes);
    if (!type) return NextResponse.json({ error: "Upload a PDF or a photo (JPG, PNG or WebP)." }, { status: 400 });

    let specId: number | null = null;
    let label = "Other file";
    const rawSpec = Number(form?.get("specId"));
    if (Number.isInteger(rawSpec) && rawSpec > 0) {
      const spec = await prisma.serviceDocumentSpec.findFirst({ where: { id: rawSpec, service: { slug: order.serviceSlug } } });
      if (!spec) return NextResponse.json({ error: "Unknown file type." }, { status: 400 });
      specId = spec.id;
      label = spec.label;
    }

    const [total, forItem] = await Promise.all([
      prisma.serviceOrderFile.count({ where: { orderId: order.id, kind: "CUSTOMER_FILE" } }),
      prisma.serviceOrderFile.count({ where: { orderId: order.id, kind: "CUSTOMER_FILE", specId } }),
    ]);
    if (total >= MAX_DOCUMENTS_PER_REQUEST) return NextResponse.json({ error: "You have reached the upload limit for this order." }, { status: 429 });
    if (forItem >= MAX_DOCUMENTS_PER_ITEM) return NextResponse.json({ error: "You already uploaded the maximum for this item. Remove one first." }, { status: 429 });

    const fileName = safeFileName(file.name, type.ext);
    const storagePath = `orders/${order.id}/${crypto.randomUUID()}-${fileName.replace(/ /g, "_")}`;
    await uploadPrivateFile(storagePath, bytes, type.mime);

    const created = await prisma.serviceOrderFile.create({
      data: { orderId: order.id, kind: "CUSTOMER_FILE", specId, label, storagePath, fileName, mimeType: type.mime, sizeBytes: bytes.length, uploadedBy: "customer" },
      select: { id: true },
    });
    await logOrderEvent(prisma, order.id, "FILE_UPLOADED", `Uploaded: ${label} (${fileName}).`, { actor: "customer" });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("Error uploading order file:", error);
    return NextResponse.json({ error: "The upload failed. Please try again." }, { status: 500 });
  }
}