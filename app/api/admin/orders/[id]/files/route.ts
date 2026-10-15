// app/api/admin/orders/[id]/files/route.ts
//
// Admin uploads work for the customer:
//   PREVIEW — visible to the customer straight away
//   FINAL   — locked until the order is fully paid
// Upload these BEFORE moving the order to review / work complete.

import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { uploadPrivateFile } from "@/lib/storage/privateStorage";
import { logOrderEvent } from "@/lib/services/orders/events";
import { MAX_UPLOAD_BYTES, detectFileType, safeFileName } from "@/lib/applyAssistance/uploads";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const order = await prisma.questionnaireDraft.findUnique({ where: { id }, select: { id: true, stage: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (["DRAFT", "AWAITING_DEPOSIT", "CANCELLED"].includes(order.stage)) {
      return NextResponse.json({ error: "Work can be uploaded once the deposit is paid." }, { status: 409 });
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    const kind = form?.get("kind");
    if (kind !== "PREVIEW" && kind !== "FINAL") return NextResponse.json({ error: "Choose whether this is a preview or a final file." }, { status: 400 });
    if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "That file is over 4 MB. Compress it, or send large files by email or a shared link." }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectFileType(bytes);
    if (!type) return NextResponse.json({ error: "Upload a PDF or an image (JPG, PNG, WebP)." }, { status: 400 });

    const rawLabel = form?.get("label");
    const label = typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim().slice(0, 80) : kind === "PREVIEW" ? "Preview" : "Final files";
    const fileName = safeFileName(file.name, type.ext);
    const storagePath = `orders/${order.id}/${kind.toLowerCase()}-${crypto.randomUUID()}-${fileName.replace(/ /g, "_")}`;
    await uploadPrivateFile(storagePath, bytes, type.mime);

    const created = await prisma.serviceOrderFile.create({
      data: { orderId: order.id, kind, label, storagePath, fileName, mimeType: type.mime, sizeBytes: bytes.length, uploadedBy: "admin" },
      select: { id: true },
    });
    await logOrderEvent(prisma, order.id, "FILE_UPLOADED", `${kind === "PREVIEW" ? "Preview" : "Final file"} uploaded: ${label} (${fileName}).`, { actor: "admin" });
    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error("Error uploading order work:", error);
    return NextResponse.json({ error: "The upload failed. Please try again." }, { status: 500 });
  }
}