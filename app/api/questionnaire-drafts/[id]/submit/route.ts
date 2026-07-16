// app/api/questionnaire-drafts/[id]/submit/route.ts
//
// POST — marks a draft as submitted and generates an order number.
// The order number is shown on the confirmation screen and doubles as
// the reference the user quotes when sending files via WhatsApp/email,
// since we don't do direct file upload yet (see Step 14 design note).
//
// Next.js 15+: the `params` argument on dynamic route handlers is a
// Promise, so it must be awaited before use.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SERVICE_CODES: Record<string, string> = {
  "business-plan-writing": "BPW",
  "financial-projections": "FPJ",
  "pitch-deck": "PDK",
  "business-registration": "REG",
  "logo-design": "LGO",
  "website-creation": "WEB",
  "business-name-domain": "BND",
  "google-business-profile": "GBP",
  "social-media-setup": "SMS",
};

function generateOrderNumber(serviceSlug: string): string {
  const code = SERVICE_CODES[serviceSlug] ?? "GEN";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `HC-${code}-${date}-${rand}`;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (existing.status === "submitted" && existing.orderNumber) {
    // Idempotent — resubmitting an already-submitted draft just returns it.
    return NextResponse.json({ draft: existing });
  }

  const orderNumber = generateOrderNumber(existing.serviceSlug);

  const draft = await prisma.questionnaireDraft.update({
    where: { id },
    data: { status: "submitted", orderNumber },
  });

  // TODO (next pass): trigger confirmation email via existing Resend setup
  // + React Email template, matching the Welcome/PasswordReset pattern
  // already in lib/email. Not wired yet — flag if you want this in v1.

  return NextResponse.json({ draft });
}