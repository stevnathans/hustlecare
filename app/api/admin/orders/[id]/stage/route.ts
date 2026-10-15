// app/api/admin/orders/[id]/stage/route.ts
//
// Admin moves an order along:
//   IN_REVIEW        — send the preview to the customer
//   AWAITING_BALANCE — "work complete" (asks for the balance; completes
//                      outright when nothing is left to pay)
//   IN_PROGRESS      — take it back into work
//   CANCELLED
// The customer is emailed automatically for the first two.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { changeOrderStage } from "@/lib/services/orders/lifecycle";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MOVES = ["IN_REVIEW", "AWAITING_BALANCE", "IN_PROGRESS", "CANCELLED"] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    if (!MOVES.includes(body.stage)) {
      return NextResponse.json({ error: "Stage must be IN_REVIEW, AWAITING_BALANCE, IN_PROGRESS or CANCELLED." }, { status: 400 });
    }

    const result = await changeOrderStage({
      orderId: id,
      to: body.stage,
      reason: typeof body.reason === "string" ? body.reason : null,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ success: true, stage: result.stage });
  } catch (error) {
    console.error("Error changing order stage:", error);
    return NextResponse.json({ error: "Failed to change stage." }, { status: 500 });
  }
}