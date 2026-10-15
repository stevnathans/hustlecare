// app/api/admin/orders/[id]/files/[fileId]/route.ts
//
// GET    → a short-lived download link for any file on the order
// DELETE → remove a preview or final file you uploaded by mistake

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { createSignedDownloadUrl, deletePrivateFile } from "@/lib/storage/privateStorage";
import { logOrderEvent } from "@/lib/services/orders/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { params: Promise<{ id: string; fileId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id, fileId } = await params;
    const file = await prisma.serviceOrderFile.findFirst({ where: { id: fileId, orderId: id } });
    if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });
    return NextResponse.json({ url: await createSignedDownloadUrl(file.storagePath, 600, file.fileName) });
  } catch (error) {
    console.error("Error creating file link:", error);
    return NextResponse.json({ error: "Could not open that file." }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id, fileId } = await params;
    const file = await prisma.serviceOrderFile.findFirst({ where: { id: fileId, orderId: id, kind: { in: ["PREVIEW", "FINAL"] } } });
    if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

    await deletePrivateFile(file.storagePath).catch((err) => console.error("Storage delete failed:", err));
    await prisma.serviceOrderFile.delete({ where: { id: file.id } });
    await logOrderEvent(prisma, id, "NOTE", `Removed ${file.kind.toLowerCase()} file: ${file.label} (${file.fileName}).`, { actor: "admin" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing order file:", error);
    return NextResponse.json({ error: "Could not remove that file." }, { status: 500 });
  }
}