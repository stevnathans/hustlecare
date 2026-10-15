// app/api/admin/orders/[id]/remind/route.ts
// "Send reminder now" for an order waiting on its deposit.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { getPaymentMode } from "@/lib/applyAssistance/lifecycle";
import { notifyOrderCustomer } from "@/lib/services/orders/notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const o = await prisma.questionnaireDraft.findUnique({ where: { id } });
    if (!o) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (o.stage !== "AWAITING_DEPOSIT") return NextResponse.json({ error: "Only orders waiting for a deposit can be reminded." }, { status: 409 });
    if (!o.contactConsentAt) return NextResponse.json({ error: "This customer never agreed to be contacted (an older order). Contact them yourself." }, { status: 409 });
    if (o.optedOutAt) return NextResponse.json({ error: "This customer opted out of reminders." }, { status: 409 });
    if (!o.totalAmount || getPaymentMode() === "off") return NextResponse.json({ error: "Online payment is not available for this order." }, { status: 409 });

    await notifyOrderCustomer(o.id, "REMINDER_MANUAL");
    await prisma.questionnaireDraft.update({ where: { id: o.id }, data: { lastReminderAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending manual order reminder:", error);
    return NextResponse.json({ error: "Failed to send the reminder." }, { status: 500 });
  }
}