/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/admin/orders/[id]/route.ts
//
// GET    — everything the order view needs: the order, its answers formatted
//          into readable sections, payments, files, the document checklist
//          and the timeline.
// PATCH  — admin notes, archive / restore (and the legacy adminStatus).
// DELETE — soft-delete: sets archived = true. Never removes the row.
//
// ADMIN ONLY: proxy.ts does not cover /api routes (see lib/admin-auth.ts).
// Next.js 15+: `params` is a Promise and must be awaited.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuestionnaireConfig } from "@/lib/questionnaires/registry";
import { formatOrderAnswers } from "@/lib/orders/format-answers";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const VALID_ADMIN_STATUSES = ["new", "in_progress", "delivered", "cancelled"];

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://hustlecare.net").replace(/\/$/, "");

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const order = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const config = getQuestionnaireConfig(order.serviceSlug);
  const sections = config ? formatOrderAnswers(config, order.answers as Record<string, any>, order.packageTier) : [];

  const [service, payments, files, events, specs] = await Promise.all([
    prisma.service.findUnique({ where: { slug: order.serviceSlug }, select: { id: true, name: true } }),
    prisma.serviceOrderPayment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true, kind: true, amount: true, currency: true, provider: true, status: true, receiptNumber: true, failureReason: true, createdAt: true, paidAt: true },
    }),
    prisma.serviceOrderFile.findMany({ where: { orderId: id }, orderBy: { createdAt: "asc" } }),
    prisma.serviceOrderEvent.findMany({ where: { orderId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.serviceDocumentSpec.findMany({ where: { service: { slug: order.serviceSlug } }, orderBy: { displayOrder: "asc" } }),
  ]);

  const have = new Set(files.filter((f) => f.kind === "CUSTOMER_FILE").map((f) => f.specId));
  const checklist = specs.map((s) => ({ id: s.id, label: s.label, isRequired: s.isRequired, satisfied: have.has(s.id) }));

  return NextResponse.json({
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      serviceSlug: order.serviceSlug,
      serviceName: service?.name ?? config?.serviceName ?? order.serviceSlug,
      packageTier: order.packageTier,
      packageTierLabel: order.packageName ?? config?.packageTiers?.find((t) => t.id === order.packageTier)?.name ?? order.packageTier,
      status: order.status,
      adminStatus: order.adminStatus,
      adminNotes: order.adminNotes,
      archived: order.archived,
      contactEmail: order.contactEmail,
      contactPhone: order.contactPhone,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      stage: order.stage,
      currency: order.currency,
      totalAmount: order.totalAmount,
      depositPercent: order.depositPercent,
      depositAmount: order.depositAmount,
      balanceAmount: order.balanceAmount,
      revisionsAllowed: order.revisionsAllowed,
      revisionsUsed: order.revisionsUsed,
      dueDate: order.dueDate,
      submittedAt: order.submittedAt,
      completedAt: order.completedAt,
      cancelReason: order.cancelReason,
      contactConsentAt: order.contactConsentAt,
      optedOutAt: order.optedOutAt,
      reminderCount: order.reminderCount,
    },
    sections,
    payments,
    files,
    events,
    checklist,
    trackUrl: order.publicToken ? `${siteUrl()}/order/${order.publicToken}` : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  if (body.adminStatus !== undefined && !VALID_ADMIN_STATUSES.includes(body.adminStatus)) {
    return NextResponse.json({ error: "Invalid adminStatus" }, { status: 400 });
  }

  const existing = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = await prisma.questionnaireDraft.update({
    where: { id },
    data: {
      ...(body.adminStatus !== undefined && { adminStatus: body.adminStatus }),
      ...(body.adminNotes !== undefined && { adminNotes: typeof body.adminNotes === "string" ? body.adminNotes.slice(0, 4000) || null : null }),
      ...(body.archived !== undefined && { archived: body.archived === true, ...(body.archived === true ? { nextReminderAt: null } : {}) }),
    },
  });
  return NextResponse.json({ order });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await prisma.questionnaireDraft.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const order = await prisma.questionnaireDraft.update({ where: { id }, data: { archived: true, nextReminderAt: null } });
  return NextResponse.json({ order, archived: true });
}