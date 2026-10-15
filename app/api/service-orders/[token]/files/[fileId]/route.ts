// app/api/service-orders/[token]/files/[fileId]/route.ts
// A customer removes a file they uploaded by mistake.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deletePrivateFile } from "@/lib/storage/privateStorage";
import { logOrderEvent } from "@/lib/services/orders/events";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string; fileId: string }> }) {
  try {
    const { token, fileId } = await params;
    const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token }, select: { id: true, stage: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!["AWAITING_DEPOSIT", "IN_PROGRESS", "IN_REVIEW"].includes(order.stage)) {
      return NextResponse.json({ error: "Files can no longer be changed." }, { status: 409 });
    }

    const file = await prisma.serviceOrderFile.findFirst({ where: { id: fileId, orderId: order.id, kind: "CUSTOMER_FILE" } });
    if (!file) return NextResponse.json({ error: "File not found." }, { status: 404 });

    await deletePrivateFile(file.storagePath).catch((err) => console.error("Storage delete failed:", err));
    await prisma.serviceOrderFile.delete({ where: { id: file.id } });
    await logOrderEvent(prisma, order.id, "FILE_UPLOADED", `Removed: ${file.label} (${file.fileName}).`, { actor: "customer" });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing order file:", error);
    return NextResponse.json({ error: "Could not remove that file." }, { status: 500 });
  }
}