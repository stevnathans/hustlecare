// app/api/service-orders/[token]/revision/route.ts
// The customer asks for changes to a preview.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requestRevision } from "@/lib/services/orders/lifecycle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (message.length < 5) return NextResponse.json({ error: "Tell us what you would like changed (at least a few words)." }, { status: 400 });

    const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token }, select: { id: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const result = await requestRevision(order.id, message);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error requesting revision:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}