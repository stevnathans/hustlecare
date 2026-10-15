// app/api/service-orders/[token]/approve/route.ts
// The customer approves the preview.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { approveOrder } from "@/lib/services/orders/lifecycle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token }, select: { id: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const result = await approveOrder(order.id);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ success: true, stage: result.stage });
  } catch (error) {
    console.error("Error approving order:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}