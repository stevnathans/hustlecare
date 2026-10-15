// app/api/service-orders/[token]/pay/route.ts
//
// Start the next payment for an order: the deposit, the full amount, or the
// balance. What is due, and how much, is decided here from the order's own
// stage and price snapshot; nothing about it is read from the browser.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeKenyanPhone, toMpesaMsisdn, formatPhoneLocal } from "@/lib/phone";
import { getPaymentMode } from "@/lib/applyAssistance/lifecycle";
import { nextPayable } from "@/lib/services/orders/lifecycle";
import { logOrderEvent } from "@/lib/services/orders/events";
import { initiateStkPush, DarajaError } from "@/lib/payments/daraja";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_ATTEMPTS_PER_HOUR = 5;
const REUSE_PENDING_WITHIN_MS = 60_000;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const mode = getPaymentMode();
    if (mode === "off") return NextResponse.json({ error: "Online payment is not available yet." }, { status: 503 });

    const due = nextPayable(order);
    if (!due) return NextResponse.json({ error: "There is nothing to pay on this order right now." }, { status: 409 });
    if (body.kind && body.kind !== due.kind) {
      return NextResponse.json({ error: "That payment is not due yet.", due: due.kind }, { status: 409 });
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attempts = await prisma.serviceOrderPayment.count({ where: { orderId: order.id, createdAt: { gte: hourAgo } } });
    if (attempts >= MAX_ATTEMPTS_PER_HOUR) {
      return NextResponse.json({ error: "Too many payment attempts. Please wait a little while and try again." }, { status: 429 });
    }

    const pending = await prisma.serviceOrderPayment.findFirst({
      where: { orderId: order.id, status: "PENDING", kind: due.kind },
      orderBy: { createdAt: "desc" },
    });

    const contactE164 = normalizeKenyanPhone(order.contactPhone);

    // ── Manual mode ───────────────────────────────────────────────────────────
    if (mode === "manual") {
      if (!pending) {
        const payment = await prisma.serviceOrderPayment.create({
          data: {
            orderId: order.id,
            kind: due.kind,
            amount: due.amount,
            currency: order.currency,
            provider: "manual",
            merchantRef: `MAN-${order.id.slice(0, 8)}-${Date.now().toString(36)}`,
            payerPhone: contactE164,
          },
        });
        await logOrderEvent(prisma, order.id, "PAYMENT_STARTED", "Customer was shown manual M-Pesa payment instructions.", {
          actor: "customer",
          metadata: { paymentId: payment.id },
        });
      }
      return NextResponse.json({
        mode: "manual",
        amount: due.amount,
        currency: order.currency,
        payTo: process.env.APPLY_MANUAL_PAY_TO || null,
        payFromPhone: contactE164 ? formatPhoneLocal(contactE164) : null,
      });
    }

    // ── Daraja mode ───────────────────────────────────────────────────────────
    if (pending && pending.provider === "daraja" && Date.now() - pending.createdAt.getTime() < REUSE_PENDING_WITHIN_MS) {
      return NextResponse.json({ mode: "daraja", paymentId: pending.id, reused: true });
    }

    const phoneE164 = normalizeKenyanPhone(typeof body.mpesaPhone === "string" ? body.mpesaPhone : order.contactPhone);
    if (!phoneE164) return NextResponse.json({ error: "Enter a valid Safaricom number, like 0712 345 678." }, { status: 400 });

    if (pending) {
      await prisma.serviceOrderPayment.update({
        where: { id: pending.id },
        data: { status: "FAILED", failureReason: "Replaced by a newer payment attempt." },
      });
    }

    const payment = await prisma.serviceOrderPayment.create({
      data: {
        orderId: order.id,
        kind: due.kind,
        amount: due.amount,
        currency: order.currency,
        provider: "daraja",
        merchantRef: `SO-${order.id.slice(0, 8)}-${attempts + 1}-${Date.now().toString(36)}`,
        payerPhone: phoneE164,
      },
    });

    try {
      const stk = await initiateStkPush({
        amount: due.amount,
        msisdn: toMpesaMsisdn(phoneE164),
        accountReference: "Hustlecare",
        description: "Order payment",
      });
      await prisma.serviceOrderPayment.update({ where: { id: payment.id }, data: { providerRef: stk.checkoutRequestId } });
      await logOrderEvent(prisma, order.id, "PAYMENT_STARTED", `M-Pesa prompt sent to ${formatPhoneLocal(phoneE164)}.`, {
        actor: "customer",
        metadata: { paymentId: payment.id },
      });
      return NextResponse.json({ mode: "daraja", paymentId: payment.id });
    } catch (err) {
      const reason = err instanceof DarajaError ? err.message : "Unexpected error sending the M-Pesa prompt.";
      console.error("STK push failed:", err);
      await prisma.serviceOrderPayment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: reason } });
      await logOrderEvent(prisma, order.id, "PAYMENT_FAILED", `Could not send the M-Pesa prompt: ${reason}`);
      return NextResponse.json({ error: "We could not send the M-Pesa prompt. Check the number and try again." }, { status: 502 });
    }
  } catch (error) {
    console.error("Error starting order payment:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}