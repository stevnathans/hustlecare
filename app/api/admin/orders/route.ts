/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/orders/route.ts
//
// GET — list orders for the admin table. Query params:
//   serviceSlug   — filter to one service
//   packageTier   — filter to one tier
//   adminStatus   — "new" | "in_progress" | "delivered" | "cancelled"
//   includeDrafts — "true" to include unsubmitted (abandoned) drafts;
//                   defaults to submitted-only, matching how the orders
//                   view should behave by default
//   includeArchived — "true" to include soft-deleted rows
//   search        — matches orderNumber, contactEmail, or contactPhone
//
// Returns a lightweight row shape (not the full `answers` blob) — the
// detail view fetches that separately via GET /api/admin/orders/[id].

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeep } from "@/lib/questionnaires/get-deep";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceSlug = searchParams.get("serviceSlug");
  const packageTier = searchParams.get("packageTier");
  const adminStatus = searchParams.get("adminStatus");
  const includeDrafts = searchParams.get("includeDrafts") === "true";
  const includeArchived = searchParams.get("includeArchived") === "true";
  const search = searchParams.get("search")?.trim();

  const where: Record<string, any> = {
    ...(includeDrafts ? {} : { status: "submitted" }),
    ...(includeArchived ? {} : { archived: false }),
    ...(serviceSlug && { serviceSlug }),
    ...(packageTier && { packageTier }),
    ...(adminStatus && { adminStatus }),
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
  });

  // Contact name isn't its own column — every service config puts it at
  // answers.contact.fullName, so pull it out here for the table view
  // rather than making the admin UI reach into the JSON itself.
  const orders = rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    serviceSlug: row.serviceSlug,
    packageTier: row.packageTier,
    status: row.status,
    adminStatus: row.adminStatus,
    archived: row.archived,
    contactName: getDeep(row.answers as Record<string, never>, "contact.fullName") ?? null,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return NextResponse.json({ orders });
}