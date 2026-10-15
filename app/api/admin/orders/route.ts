/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/orders/route.ts
//
// GET — every order for the admin table (a light row, not the full answers).
// Query params (all optional): serviceSlug, packageTier, adminStatus (legacy),
// stage, includeDrafts=true, includeArchived=true, search.
//
// ADMIN ONLY: proxy.ts does not cover /api routes, so this handler checks
// the session itself (see lib/admin-auth.ts).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeep } from "@/lib/questionnaires/get-deep";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const serviceSlug = searchParams.get("serviceSlug");
  const packageTier = searchParams.get("packageTier");
  const adminStatus = searchParams.get("adminStatus");
  const stage = searchParams.get("stage");
  const includeDrafts = searchParams.get("includeDrafts") === "true";
  const includeArchived = searchParams.get("includeArchived") === "true";
  const search = searchParams.get("search")?.trim();

  const where: Record<string, any> = {
    // Unfinished questionnaires are only worth showing once the visitor left a way to
    // reach them. (A draft is created the moment the page opens, so most are empty.)
    ...(includeDrafts
      ? { AND: [{ OR: [{ status: "submitted" }, { contactEmail: { not: null } }, { contactPhone: { not: null } }] }] }
      : { status: "submitted" }),
    ...(includeArchived ? {} : { archived: false }),
    ...(serviceSlug && { serviceSlug }),
    ...(packageTier && { packageTier }),
    ...(adminStatus && { adminStatus }),
    ...(stage && { stage }),
    ...(search && {
      OR: [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const rows = await prisma.questionnaireDraft.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { files: true } } },
  });

  const orders = rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    serviceSlug: row.serviceSlug,
    packageTier: row.packageTier,
    packageName: row.packageName,
    status: row.status,
    adminStatus: row.adminStatus,
    stage: row.stage,
    archived: row.archived,
    contactName: getDeep(row.answers as Record<string, never>, "contact.fullName") ?? null,
    businessName: getDeep(row.answers as Record<string, never>, "contact.businessName") ?? null,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    totalAmount: row.totalAmount,
    depositAmount: row.depositAmount,
    balanceAmount: row.balanceAmount,
    currency: row.currency,
    revisionsUsed: row.revisionsUsed,
    revisionsAllowed: row.revisionsAllowed,
    dueDate: row.dueDate,
    submittedAt: row.submittedAt,
    contactConsentAt: row.contactConsentAt,
    optedOutAt: row.optedOutAt,
    reminderCount: row.reminderCount,
    fileCount: row._count.files,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  // Orders submitted before the new system existed (see /api/admin/orders/repair).
  const legacyCount = await prisma.questionnaireDraft.count({ where: { status: "submitted", stage: "DRAFT" } });

  return NextResponse.json({ orders, legacyCount });
}