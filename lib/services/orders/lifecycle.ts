// lib/services/orders/lifecycle.ts
//
// Every move an order makes, in one place:
//
//   AWAITING_DEPOSIT ──deposit paid──▶ IN_PROGRESS ──send preview──▶ IN_REVIEW
//        IN_REVIEW ──customer asks for changes──▶ IN_PROGRESS  (uses a revision)
//        IN_PROGRESS / IN_REVIEW ──work complete / customer approves──▶ AWAITING_BALANCE
//        AWAITING_BALANCE ──balance paid──▶ COMPLETED      (final files unlock)
//   Any stage before COMPLETED ──▶ CANCELLED
//
// When there is no balance to pay (100% up front) or the order has no price
// (an older, manual order), "work complete" goes straight to COMPLETED.
// Payment callbacks, the status check, the admin buttons and the customer's
// own buttons all go through here, so the result is identical every time.

import type { ServiceOrderStage, ServicePaymentKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logOrderEvent } from '@/lib/services/orders/events';
import { notifyOrderCustomer, notifyOrderAdmin } from '@/lib/services/orders/notifications';

export const ORDER_STAGE_LABELS: Record<ServiceOrderStage, string> = {
  DRAFT: 'Draft',
  AWAITING_DEPOSIT: 'Awaiting deposit',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  AWAITING_BALANCE: 'Awaiting balance',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// A failed email must never undo a payment or a status change.
async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[orders] ${label} failed:`, err);
  }
}

/** What the customer should pay next, or null when nothing is due. */
export function nextPayable(o: {
  stage: ServiceOrderStage;
  totalAmount: number | null;
  depositAmount: number | null;
  balanceAmount: number | null;
}): { kind: ServicePaymentKind; amount: number } | null {
  if (!o.totalAmount) return null;
  if (o.stage === 'AWAITING_DEPOSIT') {
    const hasBalance = (o.balanceAmount ?? 0) > 0;
    return { kind: hasBalance ? 'DEPOSIT' : 'FULL', amount: o.depositAmount ?? o.totalAmount };
  }
  if (o.stage === 'AWAITING_BALANCE' && (o.balanceAmount ?? 0) > 0) {
    return { kind: 'BALANCE', amount: o.balanceAmount as number };
  }
  return null;
}

// ── Payment succeeded ────────────────────────────────────────────────────────

export async function markServicePaymentSuccess(args: {
  orderId: string;
  paymentId: string;
  receiptNumber?: string | null;
  payerPhone?: string | null;
  actor?: 'system' | 'admin';
}): Promise<{ alreadyProcessed: boolean; kind: ServicePaymentKind | null; stageChanged: boolean }> {
  const { orderId, paymentId, receiptNumber, payerPhone, actor = 'system' } = args;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.serviceOrderPayment.findUnique({
      where: { id: paymentId },
      select: { kind: true, orderId: true },
    });
    if (!payment || payment.orderId !== orderId) return { alreadyProcessed: true, kind: null, stageChanged: false };

    // Only the first caller flips the payment. FAILED may flip to SUCCESSFUL:
    // a late callback for a prompt we had given up on still means money arrived.
    const flipped = await tx.serviceOrderPayment.updateMany({
      where: { id: paymentId, status: { not: 'SUCCESSFUL' } },
      data: {
        status: 'SUCCESSFUL',
        paidAt: now,
        failureReason: null,
        ...(receiptNumber ? { receiptNumber } : {}),
        ...(payerPhone ? { payerPhone } : {}),
      },
    });
    if (flipped.count === 0) return { alreadyProcessed: true, kind: payment.kind, stageChanged: false };

    let stageChanged = false;

    if (payment.kind === 'DEPOSIT' || payment.kind === 'FULL') {
      const order = await tx.questionnaireDraft.findUnique({ where: { id: orderId }, select: { packageId: true } });
      const pkg = order?.packageId
        ? await tx.servicePackage.findUnique({
            where: { id: order.packageId },
            select: { turnaroundMinDays: true, turnaroundMaxDays: true },
          })
        : null;
      const days = pkg?.turnaroundMaxDays ?? pkg?.turnaroundMinDays ?? null;

      const moved = await tx.questionnaireDraft.updateMany({
        where: { id: orderId, stage: 'AWAITING_DEPOSIT' },
        data: {
          stage: 'IN_PROGRESS',
          nextReminderAt: null,
          ...(days ? { dueDate: new Date(now.getTime() + days * 86_400_000) } : {}),
        },
      });
      stageChanged = moved.count > 0;
    } else {
      const moved = await tx.questionnaireDraft.updateMany({
        where: { id: orderId, stage: 'AWAITING_BALANCE' },
        data: { stage: 'COMPLETED', completedAt: now },
      });
      stageChanged = moved.count > 0;
    }

    const label = payment.kind === 'BALANCE' ? 'Balance' : payment.kind === 'FULL' ? 'Full payment' : 'Deposit';
    await logOrderEvent(tx, orderId, 'PAYMENT_SUCCEEDED', `${label} received${receiptNumber ? ` (receipt ${receiptNumber})` : ''}.`, { actor });

    if (stageChanged) {
      await logOrderEvent(
        tx,
        orderId,
        'STAGE_CHANGED',
        payment.kind === 'BALANCE' ? 'Stage changed: Awaiting balance → Completed. Final files unlocked.' : 'Stage changed: Awaiting deposit → In progress.',
        { actor },
      );
    } else {
      await logOrderEvent(
        tx,
        orderId,
        'NOTE',
        `${label} received for an order that was not waiting for it. Possible duplicate payment — check whether a refund is due.`,
        { actor },
      );
    }

    return { alreadyProcessed: false, kind: payment.kind, stageChanged };
  });

  if (result.stageChanged) {
    if (result.kind === 'BALANCE') {
      await safely('completed message', () => notifyOrderCustomer(orderId, 'COMPLETED'));
      await safely('admin balance message', () => notifyOrderAdmin(orderId, 'BALANCE_PAID'));
    } else {
      await safely('deposit message', () => notifyOrderCustomer(orderId, 'DEPOSIT_PAID'));
      await safely('admin deposit message', () => notifyOrderAdmin(orderId, 'DEPOSIT_PAID'));
    }
  }

  return result;
}

// ── Admin stage changes ──────────────────────────────────────────────────────

const ALLOWED: Record<ServiceOrderStage, ServiceOrderStage[]> = {
  DRAFT: [],
  AWAITING_DEPOSIT: ['CANCELLED'],
  IN_PROGRESS: ['IN_REVIEW', 'AWAITING_BALANCE', 'CANCELLED'],
  IN_REVIEW: ['IN_PROGRESS', 'AWAITING_BALANCE', 'CANCELLED'],
  AWAITING_BALANCE: ['CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Move an order forward. `AWAITING_BALANCE` means "the work is complete". */
export async function changeOrderStage(args: {
  orderId: string;
  to: ServiceOrderStage;
  reason?: string | null;
  actor?: 'admin' | 'customer' | 'system';
}): Promise<{ ok: true; stage: ServiceOrderStage } | { ok: false; error: string }> {
  const { orderId, reason, actor = 'admin' } = args;
  let to = args.to;

  const order = await prisma.questionnaireDraft.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: 'Order not found.' };
  if (!ALLOWED[order.stage].includes(to)) {
    return { ok: false, error: `An order that is ${ORDER_STAGE_LABELS[order.stage].toLowerCase()} can't be moved to ${ORDER_STAGE_LABELS[to].toLowerCase()}.` };
  }

  const fileCount = (kind: 'PREVIEW' | 'FINAL') => prisma.serviceOrderFile.count({ where: { orderId, kind } });

  if (to === 'IN_REVIEW') {
    const previews = await fileCount('PREVIEW');
    if (previews === 0) return { ok: false, error: 'Upload at least one preview file first, so the customer has something to review.' };
  }

  // "Work complete" needs the final files; with nothing left to pay it completes outright.
  let completesNow = false;
  if (to === 'AWAITING_BALANCE') {
    const finals = await fileCount('FINAL');
    if (finals === 0) return { ok: false, error: 'Upload the final files first. They unlock for the customer once everything is paid.' };
    if (!order.totalAmount || (order.balanceAmount ?? 0) <= 0) {
      to = 'COMPLETED';
      completesNow = true;
    }
  }

  const now = new Date();
  const data: Record<string, unknown> = { stage: to, nextReminderAt: null };
  if (to === 'IN_REVIEW') data.deliveredAt = now;
  if (to === 'COMPLETED') data.completedAt = now;
  if (to === 'CANCELLED') {
    data.cancelledAt = now;
    data.cancelReason = reason?.trim().slice(0, 300) || null;
  }

  const flipped = await prisma.questionnaireDraft.updateMany({ where: { id: orderId, stage: order.stage }, data });
  if (flipped.count === 0) return { ok: false, error: 'This order was just changed by someone else. Reload and try again.' };

  await logOrderEvent(prisma, orderId, 'STAGE_CHANGED', `Stage changed: ${ORDER_STAGE_LABELS[order.stage]} → ${ORDER_STAGE_LABELS[to]}.`, { actor });
  if (to === 'IN_REVIEW') await logOrderEvent(prisma, orderId, 'PREVIEW_DELIVERED', 'Preview sent to the customer for review.', { actor });
  if (to === 'COMPLETED') await logOrderEvent(prisma, orderId, 'FINAL_DELIVERED', 'Final files unlocked for the customer.', { actor });
  if (to === 'CANCELLED' && order.stage !== 'AWAITING_DEPOSIT') {
    await logOrderEvent(prisma, orderId, 'NOTE', 'Cancelled after the deposit was paid. Check whether a refund is due.', { actor });
  }

  if (to === 'IN_REVIEW') await safely('preview message', () => notifyOrderCustomer(orderId, 'PREVIEW_READY'));
  if (to === 'AWAITING_BALANCE') await safely('balance message', () => notifyOrderCustomer(orderId, 'BALANCE_DUE'));
  if (completesNow) await safely('completed message', () => notifyOrderCustomer(orderId, 'COMPLETED'));

  return { ok: true, stage: to };
}

// ── Customer actions ─────────────────────────────────────────────────────────

export async function requestRevision(orderId: string, message: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const order = await prisma.questionnaireDraft.findUnique({
    where: { id: orderId },
    select: { stage: true, revisionsAllowed: true, revisionsUsed: true },
  });
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.stage !== 'IN_REVIEW') return { ok: false, error: 'You can ask for changes while a preview is waiting for your review.' };

  const allowed = order.revisionsAllowed ?? 0;
  if (order.revisionsUsed >= allowed) {
    return {
      ok: false,
      error: `You have used all ${allowed} revision round${allowed === 1 ? '' : 's'} included in your package. Reply to any of our emails to talk about further changes.`,
    };
  }

  const moved = await prisma.questionnaireDraft.updateMany({
    where: { id: orderId, stage: 'IN_REVIEW', revisionsUsed: order.revisionsUsed },
    data: { stage: 'IN_PROGRESS', revisionsUsed: { increment: 1 } },
  });
  if (moved.count === 0) return { ok: false, error: 'Something changed while you were typing. Please reload and try again.' };

  const clean = message.trim().slice(0, 1000);
  await logOrderEvent(prisma, orderId, 'REVISION_REQUESTED', `Changes requested: ${clean}`, {
    actor: 'customer',
    metadata: { message: clean },
  });
  await logOrderEvent(prisma, orderId, 'STAGE_CHANGED', 'Stage changed: In review → In progress (changes requested).', { actor: 'customer' });
  await safely('admin revision message', () => notifyOrderAdmin(orderId, 'REVISION_REQUESTED', { message: clean }));
  return { ok: true };
}

export async function approveOrder(orderId: string): Promise<{ ok: true; stage: ServiceOrderStage } | { ok: false; error: string }> {
  const order = await prisma.questionnaireDraft.findUnique({
    where: { id: orderId },
    select: { stage: true, totalAmount: true, balanceAmount: true },
  });
  if (!order) return { ok: false, error: 'Order not found.' };
  if (order.stage !== 'IN_REVIEW') return { ok: false, error: 'There is no preview waiting for your approval.' };

  const finals = await prisma.serviceOrderFile.count({ where: { orderId, kind: 'FINAL' } });
  if (finals === 0) {
    // The preview is approved but the final files are not uploaded yet: record it and wait for us.
    await logOrderEvent(prisma, orderId, 'APPROVED', 'Customer approved the preview. Final files still need to be uploaded.', { actor: 'customer' });
    await safely('admin approved message', () => notifyOrderAdmin(orderId, 'APPROVED'));
    return { ok: true, stage: 'IN_REVIEW' };
  }

  await logOrderEvent(prisma, orderId, 'APPROVED', 'Customer approved the preview.', { actor: 'customer' });
  const moved = await changeOrderStage({ orderId, to: 'AWAITING_BALANCE', actor: 'customer' });
  if (!moved.ok) return moved;
  await safely('admin approved message', () => notifyOrderAdmin(orderId, 'APPROVED'));
  return { ok: true, stage: moved.stage };
}