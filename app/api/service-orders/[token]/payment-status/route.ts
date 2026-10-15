// app/api/service-orders/[token]/payment-status/route.ts
//
// Polled while the customer enters their M-Pesa PIN. If the callback is late
// or lost, this asks Safaricom directly (at most every few seconds).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { markServicePaymentSuccess } from "@/lib/services/orders/lifecycle";
import { logOrderEvent } from "@/lib/services/orders/events";
import { queryStkStatus } from "@/lib/payments/daraja";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token }, select: { id: true } });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    const latest = await prisma.serviceOrderPayment.findFirst({ where: { orderId: order.id }, orderBy: { createdAt: "desc" } });

    if (latest && latest.status === "PENDING" && latest.provider === "daraja" && latest.providerRef) {
      const now = Date.now();
      const age = now - latest.createdAt.getTime();
      const sinceTouch = now - latest.updatedAt.getTime();
      if (age > 15_000 && age < 15 * 60_000 && sinceTouch > 8_000) {
        try {
          const result = await queryStkStatus(latest.providerRef);
          if (result.state === "success") {
            await markServicePaymentSuccess({ orderId: order.id, paymentId: latest.id });
          } else if (result.state === "failed") {
            const flipped = await prisma.serviceOrderPayment.updateMany({
              where: { id: latest.id, status: "PENDING" },
              data: { status: "FAILED", failureReason: result.resultDesc || "The payment was not completed." },
            });
            if (flipped.count > 0) {
              await logOrderEvent(prisma, order.id, "PAYMENT_FAILED", `Payment not completed: ${result.resultDesc || "no reason given"}.`);
            }
          } else {
            await prisma.serviceOrderPayment.update({ where: { id: latest.id }, data: { updatedAt: new Date() } });
          }
        } catch (err) {
          console.error("STK status check failed:", err);
          await prisma.serviceOrderPayment.update({ where: { id: latest.id }, data: { updatedAt: new Date() } }).catch(() => {});
        }
      }
    }

    const [fresh, payment] = await Promise.all([
      prisma.questionnaireDraft.findUnique({ where: { id: order.id }, select: { stage: true } }),
      prisma.serviceOrderPayment.findFirst({
        where: { orderId: order.id },
        orderBy: { createdAt: "desc" },
        select: { status: true, kind: true, failureReason: true, receiptNumber: true },
      }),
    ]);

    return NextResponse.json({ stage: fresh?.stage ?? null, paid: payment?.status === "SUCCESSFUL", payment });
  } catch (error) {
    console.error("Error checking order payment status:", error);
    return NextResponse.json({ error: "Could not check payment status." }, { status: 500 });
  }
}