/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/orders/[id]/route.ts
//
// GET    — full order detail, including answers formatted into readable
//          sections via lib/orders/format-answers.ts (not raw JSON).
// PATCH  — update adminStatus, adminNotes, and/or archived.
// DELETE — soft-delete: sets archived = true. Never removes the row —
//          matches the Requirements page's deprecate-not-delete pattern.
//
// Next.js 15+: `params` on a dynamic route handler is a Promise and must
// be awaited before use.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuestionnaireConfig } from "@/lib/questionnaires/registry";
import { formatOrderAnswers } from "@/lib/orders/format-answers";

const VALID_ADMIN_STATUSES = ["new", "in_progress", "delivered", "cancelled"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.questionnaireDraft.findUnique({ where: { id } });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const config = getQuestionnaireConfig(order.serviceSlug);
  const sections = config
    ? formatOrderAnswers(config, order.answers as Record<string, any>, order.packageTier)
    : [];

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      serviceSlug: order.serviceSlug,
      serviceName: config?.serviceName ?? order.serviceSlug,
      packageTier: order.packageTier,
      packageTierLabel: config?.packageTiers?.find((t) => t.id === order.packageTier)?.name ?? order.packageTier,
      status: order.status,
      adminStatus: order.adminStatus,
      adminNotes: order.adminNotes,
      archived: order.archived,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    },
    sections,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.adminStatus !== undefined && !VALID_ADMIN_STATUSES.includes(body.adminStatus)) {
    return NextResponse.json({ error: "Invalid adminStatus" }, { status: 400 });
  }

  const existing = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = await prisma.questionnaireDraft.update({
    where: { id },
    data: {
      ...(body.adminStatus !== undefined && { adminStatus: body.adminStatus }),
      ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
      ...(body.archived !== undefined && { archived: body.archived }),
    },
  });

  return NextResponse.json({ order });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Soft-delete only — archive, never remove the row.
  const order = await prisma.questionnaireDraft.update({
    where: { id },
    data: { archived: true },
  });

  return NextResponse.json({ order, archived: true });
}