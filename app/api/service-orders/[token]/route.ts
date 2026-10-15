// app/api/service-orders/[token]/route.ts
//
// The customer's own view of an order, found by its private token: just
// what the payment screen needs.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaymentMode } from "@/lib/applyAssistance/lifecycle";
import { nextPayable, ORDER_STAGE_LABELS } from "@/lib/services/orders/lifecycle";
import { formatPhoneLocal, normalizeKenyanPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await prisma.questionnaireDraft.findUnique({ where: { publicToken: token } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const e164 = normalizeKenyanPhone(order.contactPhone);
  return NextResponse.json({
    orderNumber: order.orderNumber,
    stage: order.stage,
    stageLabel: ORDER_STAGE_LABELS[order.stage],
    packageName: order.packageName,
    totalAmount: order.totalAmount,
    depositAmount: order.depositAmount,
    balanceAmount: order.balanceAmount,
    currency: order.currency,
    paymentMode: getPaymentMode(),
    payable: nextPayable(order),
    contactPhone: e164 ? formatPhoneLocal(e164) : order.contactPhone ?? "",
  });
}