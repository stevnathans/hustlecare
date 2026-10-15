// app/api/questionnaire-drafts/[id]/submit/route.ts
//
// POST — turns a finished questionnaire into an ORDER:
//   - checks the answers server-side (the browser is never trusted),
//   - snapshots the package price and works out the deposit and balance,
//   - issues an order number and a private tracking token,
//   - records the customer's consent to be contacted,
//   - emails the customer and you.
// A service with no priced package becomes a manual order (no online payment).
//
// Next.js 15+: `params` is a Promise and must be awaited.

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getQuestionnaireConfig } from "@/lib/questionnaires/registry";
import { getDeep } from "@/lib/questionnaires/get-deep";
import { getPaymentMode } from "@/lib/applyAssistance/lifecycle";
import { logOrderEvent } from "@/lib/services/orders/events";
import { notifyOrderCustomer, notifyOrderAdmin } from "@/lib/services/orders/notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const code = SERVICE_CODES[serviceSlug] ?? (serviceSlug.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase() || "GEN");
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = crypto.randomInt(10000, 99999);
  return `HC-${code}-${date}-${rand}`;
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002";
}

async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[orders] ${label} failed:`, err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  // Idempotent — resubmitting an already-submitted draft just returns it.
  if (existing.status === "submitted" && existing.orderNumber) {
    return NextResponse.json({ draft: existing, publicToken: existing.publicToken });
  }

  if (body?.consent !== true) {
    return NextResponse.json(
      { error: "Please tick the box to confirm we may contact you about this order." },
      { status: 400 }
    );
  }

  // ── Answers: every visible step must pass its own validation ───────────────
  const answers = (existing.answers ?? {}) as Record<string, any>;
  const config = getQuestionnaireConfig(existing.serviceSlug);
  if (config) {
    const withTier = { ...answers, packageTier: existing.packageTier };
    for (const step of config.steps) {
      if (step.visibleIf && !step.visibleIf(withTier)) continue;
      const result = step.validationSchema?.safeParse(answers);
      if (result && !result.success) {
        return NextResponse.json(
          { error: `Please complete "${step.title}": ${result.error.issues[0]?.message ?? "something is missing"}.` },
          { status: 400 }
        );
      }
    }
  }

  const contactEmail = existing.contactEmail ?? (getDeep(answers, "contact.email") as string | undefined) ?? null;
  const contactPhone = existing.contactPhone ?? (getDeep(answers, "contact.phone") as string | undefined) ?? null;
  if (!contactEmail || !contactPhone) {
    return NextResponse.json({ error: "Your email and phone number are required." }, { status: 400 });
  }

  // ── Package: price and deposit come from the catalog, never the browser ────
  const service = await prisma.service.findUnique({
    where: { slug: existing.serviceSlug },
    include: { packages: { where: { isActive: true } } },
  });
  const packages = service?.isActive ? service.packages : [];
  let pkg = null as (typeof packages)[number] | null;
  if (packages.length > 0) {
    pkg = packages.find((p) => p.key === existing.packageTier) ?? null;
    if (!pkg) return NextResponse.json({ error: "Please choose a package before submitting." }, { status: 400 });
  }

  const priced = !!pkg;
  const total = pkg?.price ?? null;
  const depositPercent = pkg?.depositPercent ?? null;
  const deposit = total !== null && depositPercent !== null ? (depositPercent >= 100 ? total : Math.round((total * depositPercent) / 100)) : null;
  const balance = total !== null && deposit !== null ? total - deposit : null;

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  const now = new Date();
  const publicToken = crypto.randomBytes(24).toString("base64url");
  const canCollect = priced && getPaymentMode() !== "off";

  let draft = null as Awaited<ReturnType<typeof prisma.questionnaireDraft.update>> | null;
  for (let attempt = 0; attempt < 5 && !draft; attempt++) {
    try {
      draft = await prisma.questionnaireDraft.update({
        where: { id },
        data: {
          status: "submitted",
          stage: priced ? "AWAITING_DEPOSIT" : "IN_PROGRESS",
          orderNumber: generateOrderNumber(existing.serviceSlug),
          publicToken,
          submittedAt: now,
          contactEmail,
          contactPhone,
          contactConsentAt: now,
          packageId: pkg?.id ?? null,
          packageName: pkg?.name ?? null,
          currency: "KES",
          totalAmount: total,
          depositPercent,
          depositAmount: deposit,
          balanceAmount: balance,
          revisionsAllowed: pkg?.revisionRounds ?? null,
          nextReminderAt: canCollect ? new Date(now.getTime() + 60 * 60 * 1000) : null,
          userId,
        },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err; // order number collided: try another
    }
  }
  if (!draft) return NextResponse.json({ error: "Could not create your order. Please try again." }, { status: 500 });

  await logOrderEvent(
    prisma,
    id,
    "SUBMITTED",
    priced ? `Order submitted. Deposit of KSh ${deposit?.toLocaleString("en-US")} due.` : "Order submitted (no online price: handled manually).",
    { actor: "customer" }
  );

  await safely("customer confirmation", () => notifyOrderCustomer(id, "SUBMITTED"));
  await safely("admin new order", () => notifyOrderAdmin(id, "SUBMITTED"));

  return NextResponse.json({ draft, publicToken });
}