// app/api/admin/orders/[id]/mark-paid/route.ts
//
// Manual payment mode: you saw the M-Pesa confirmation SMS, you type the
// receipt code, and the order moves forward exactly as an automatic payment
// would. What is being paid (deposit, full amount or balance) is worked out
// from the order's stage, not chosen here.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { nextPayable, markServicePaymentSuccess } from "@/lib/services/orders/lifecycle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const RECEIPT_RE = /^[A-Z0-9]{6,15}$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const receiptNumber = typeof body.receiptNumber === "string" ? body.receiptNumber.trim().toUpperCase() : "";
    if (!RECEIPT_RE.test(receiptNumber)) {
      return NextResponse.json({ error: "Enter the M-Pesa receipt code from the confirmation SMS (letters and numbers only)." }, { status: 400 });
    }

    const order = await prisma.questionnaireDraft.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const due = nextPayable(order);
    if (!due) return NextResponse.json({ error: "Nothing is waiting for payment on this order." }, { status: 409 });

    const duplicate = await prisma.serviceOrderPayment.findFirst({ where: { receiptNumber, status: "SUCCESSFUL" }, select: { id: true } });
    if (duplicate) return NextResponse.json({ error: "That receipt code has already been used on another payment." }, { status: 409 });

    let payment = await prisma.serviceOrderPayment.findFirst({
      where: { orderId: id, status: "PENDING", provider: "manual", kind: due.kind },
      orderBy: { createdAt: "desc" },
    });
    if (!payment) {
      payment = await prisma.serviceOrderPayment.create({
        data: {
          orderId: id,
          kind: due.kind,
          amount: due.amount,
          currency: order.currency,
          provider: "manual",
          merchantRef: `MAN-${id.slice(0, 8)}-${Date.now().toString(36)}`,
        },
      });
    }

    const result = await markServicePaymentSuccess({ orderId: id, paymentId: payment.id, receiptNumber, actor: "admin" });
    return NextResponse.json({ ...result, success: true, kind: due.kind });
  } catch (error) {
    console.error("Error marking order as paid:", error);
    return NextResponse.json({ error: "Failed to mark as paid." }, { status: 500 });
  }
}