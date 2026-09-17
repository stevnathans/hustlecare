// app/api/requirements/[id]/quantities/route.ts
//
// Per-(business, requirement) quantity data — a NEW, separate route from
// /api/requirements/[id]/businesses, so nothing here can break linking,
// unlinking, necessity overrides or description overrides, which already
// live on that route. GET returns quantity info for every business
// linked to this template; PATCH updates one link's defaultQuantity and
// its per-size-band overrides.
//
// AUTH NOTE: follows the session + role==='admin' pattern used by
// app/api/products/route.ts's admin mode, since this file can't see
// whether the existing requirements admin routes use a requirePermission()
// helper instead — if this codebase has standardized on one, swap this
// check for that, matching whatever gates PATCH /api/requirements/[id].

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SizeBand } from "@/lib/cost-engine";

const ALL_BANDS: SizeBand[] = ["MICRO", "SMALL", "MEDIUM", "LARGE"];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as { role?: string }).role !== "admin") {
    return null;
  }
  return session;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = Number(id);
  if (!Number.isFinite(templateId)) {
    return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
  }

  const links = await prisma.businessRequirement.findMany({
    where: { templateId },
    select: {
      businessId: true,
      defaultQuantity: true,
      quantities: { select: { sizeBand: true, quantity: true } },
    },
  });

  const result = links.map((link) => ({
    businessId: link.businessId,
    defaultQuantity: link.defaultQuantity,
    quantities: Object.fromEntries(link.quantities.map((q) => [q.sizeBand, q.quantity])),
  }));

  return NextResponse.json(result);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const templateId = Number(id);
  if (!Number.isFinite(templateId)) {
    return NextResponse.json({ error: "Invalid template id" }, { status: 400 });
  }

  const body = await req.json();
  const { businessId, defaultQuantity, quantities } = body as {
    businessId?: number;
    defaultQuantity?: number;
    quantities?: Partial<Record<SizeBand, number | null>>;
  };

  if (!businessId || !Number.isInteger(defaultQuantity) || (defaultQuantity as number) < 1) {
    return NextResponse.json(
      { error: "businessId and a whole-number defaultQuantity of at least 1 are required" },
      { status: 400 },
    );
  }

  const link = await prisma.businessRequirement.findUnique({
    where: { businessId_templateId: { businessId, templateId } },
    select: { id: true },
  });

  if (!link) {
    return NextResponse.json(
      { error: "This requirement is not linked to that business" },
      { status: 404 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.businessRequirement.update({
      where: { id: link.id },
      data: { defaultQuantity },
    });

    for (const band of ALL_BANDS) {
      const value = quantities?.[band];

      if (value == null) {
        // No override for this band — delete any existing row rather
        // than leaving a stale one that would silently keep applying.
        await tx.businessRequirementQuantity.deleteMany({
          where: { businessRequirementId: link.id, sizeBand: band },
        });
        continue;
      }

      if (!Number.isInteger(value) || value < 1) {
        throw new Error(`${band} quantity must be a whole number of at least 1`);
      }

      await tx.businessRequirementQuantity.upsert({
        where: { businessRequirementId_sizeBand: { businessRequirementId: link.id, sizeBand: band } },
        create: { businessRequirementId: link.id, sizeBand: band, quantity: value },
        update: { quantity: value },
      });
    }
  });

  return NextResponse.json({ success: true });
}