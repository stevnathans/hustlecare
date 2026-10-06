// lib/applyAssistance/lifecycle.ts
//
// Every move a request makes through its life, in one place:
//   Lead → Paid → Ready → Submitted → Completed   (or Cancelled)
// The M-Pesa callback, the status check, the admin "mark as paid" button,
// document uploads and the admin stage buttons all go through here, so the
// result (timeline entries, messages sent) is identical however it happened.

import type { ApplyStage } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { logEvent } from '@/lib/applyAssistance/events';
import { notifyCustomer, notifyAdmin } from '@/lib/applyAssistance/notifications';
import type { ApplyPaymentMode } from '@/lib/applyAssistance/config';

/**
 * APPLY_PAYMENT_MODE:
 *   off     — default. Details are saved as a lead, no payment step.
 *   manual  — customer is shown how to pay; you confirm it in admin ("mark as paid").
 *   daraja  — automatic M-Pesa STK push (sandbox or live, see DARAJA_ENV).
 */
export function getPaymentMode(): ApplyPaymentMode {
  const mode = process.env.APPLY_PAYMENT_MODE;
  return mode === 'daraja' || mode === 'manual' ? mode : 'off';
}

// A failed email must never undo a payment or a status change.
async function safely(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (err) {
    console.error(`[apply] ${label} failed:`, err);
  }
}

export const STAGE_LABELS: Record<ApplyStage, string> = {
  LEAD: 'Lead',
  PAID: 'Paid',
  READY: 'Ready to apply',
  SUBMITTED: 'Submitted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// ── Paid ─────────────────────────────────────────────────────────────────────

interface MarkPaidArgs {
  requestId: string;
  paymentId: string;
  receiptNumber?: string | null;
  payerPhone?: string | null;
  actor?: 'system' | 'admin';
}

export async function markRequestPaid({
  requestId,
  paymentId,
  receiptNumber,
  payerPhone,
  actor = 'system',
}: MarkPaidArgs): Promise<{ alreadyProcessed: boolean; stageChanged: boolean }> {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Only the first caller flips the payment; later callers see count 0.
    // FAILED is allowed to flip to SUCCESSFUL: a late callback for a prompt
    // we had already given up on still means the money arrived.
    const flipped = await tx.applyAssistancePayment.updateMany({
      where: { id: paymentId, status: { not: 'SUCCESSFUL' } },
      data: {
        status: 'SUCCESSFUL',
        paidAt: now,
        failureReason: null,
        ...(receiptNumber ? { receiptNumber } : {}),
        ...(payerPhone ? { payerPhone } : {}),
      },
    });
    if (flipped.count === 0) return { alreadyProcessed: true, stageChanged: false };

    const staged = await tx.applyAssistanceRequest.updateMany({
      where: { id: requestId, stage: 'LEAD' },
      data: { stage: 'PAID', paidAt: now, nextReminderAt: null, archived: false },
    });

    const receiptText = receiptNumber ? ` (receipt ${receiptNumber})` : '';
    await logEvent(tx, requestId, 'PAYMENT_SUCCEEDED', `Payment received${receiptText}.`, { actor });

    if (staged.count > 0) {
      await logEvent(tx, requestId, 'STAGE_CHANGED', 'Stage changed: Lead → Paid.', { actor });
    } else {
      // Money arrived but the request wasn't a lead any more (already paid,
      // cancelled, ...). Almost always a double payment — flag it for a refund check.
      await logEvent(
        tx,
        requestId,
        'NOTE',
        'Payment received for a request that was not awaiting payment. Possible duplicate — check whether a refund is due.',
        { actor },
      );
    }

    return { alreadyProcessed: false, stageChanged: staged.count > 0 };
  });

  if (result.stageChanged) {
    await safely('customer paid message', () => notifyCustomer(requestId, 'PAID'));
    await safely('admin paid message', () => notifyAdmin(requestId, 'PAID'));
    // If no documents are required for this service, it is ready straight away.
    await safely('ready check', () => syncReadyStage(requestId));
  }

  return result;
}

// ── Paid ⇄ Ready (driven by the document checklist) ──────────────────────────

/**
 * A paid request becomes READY once every required checklist item has at
 * least one document that hasn't been rejected. If a document is later
 * removed or rejected, it drops back to PAID. Does nothing at any other stage.
 */
export async function syncReadyStage(requestId: string): Promise<void> {
  const r = await prisma.applyAssistanceRequest.findUnique({
    where: { id: requestId },
    select: { stage: true, templateId: true },
  });
  if (!r || (r.stage !== 'PAID' && r.stage !== 'READY')) return;

  const [offering, docs] = await Promise.all([
    r.templateId
      ? prisma.applyServiceOffering.findUnique({
          where: { templateId: r.templateId },
          include: { documents: { where: { isRequired: true } } },
        })
      : null,
    prisma.applyAssistanceDocument.findMany({
      where: { requestId, isDeliverable: false, status: { not: 'REJECTED' } },
      select: { specId: true },
    }),
  ]);

  const required = offering?.documents ?? [];
  const have = new Set(docs.map((d) => d.specId));
  const complete = required.every((spec) => have.has(spec.id));

  if (complete && r.stage === 'PAID') {
    const flipped = await prisma.applyAssistanceRequest.updateMany({
      where: { id: requestId, stage: 'PAID' },
      data: { stage: 'READY' },
    });
    if (flipped.count > 0) {
      await logEvent(prisma, requestId, 'STAGE_CHANGED', 'Stage changed: Paid → Ready to apply.');
      if (required.length > 0) {
        await safely('customer docs-complete message', () => notifyCustomer(requestId, 'DOCS_COMPLETE'));
      }
      await safely('admin ready message', () => notifyAdmin(requestId, 'READY'));
    }
  } else if (!complete && r.stage === 'READY') {
    const flipped = await prisma.applyAssistanceRequest.updateMany({
      where: { id: requestId, stage: 'READY' },
      data: { stage: 'PAID' },
    });
    if (flipped.count > 0) {
      await logEvent(prisma, requestId, 'STAGE_CHANGED', 'Stage changed: Ready to apply → Paid (a required document is missing again).');
    }
  }
}

// ── Admin stage changes ──────────────────────────────────────────────────────

const ALLOWED: Record<ApplyStage, ApplyStage[]> = {
  LEAD: ['CANCELLED'],
  PAID: ['SUBMITTED', 'CANCELLED'],
  READY: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export async function changeStage(args: {
  requestId: string;
  to: ApplyStage;
  authorityReference?: string | null;
  cancelReason?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const r = await prisma.applyAssistanceRequest.findUnique({ where: { id: args.requestId } });
  if (!r) return { ok: false, error: 'Request not found.' };

  if (!ALLOWED[r.stage].includes(args.to)) {
    return { ok: false, error: `A request that is ${STAGE_LABELS[r.stage].toLowerCase()} can't be moved to ${STAGE_LABELS[args.to].toLowerCase()}.` };
  }

  const now = new Date();
  const data: Record<string, unknown> = { stage: args.to, nextReminderAt: null };
  if (args.to === 'SUBMITTED') {
    data.submittedAt = now;
    if (args.authorityReference?.trim()) data.authorityReference = args.authorityReference.trim().slice(0, 100);
  }
  if (args.to === 'COMPLETED') data.completedAt = now;
  if (args.to === 'CANCELLED') {
    data.cancelledAt = now;
    data.cancelReason = args.cancelReason?.trim().slice(0, 300) || null;
  }

  const flipped = await prisma.applyAssistanceRequest.updateMany({
    where: { id: r.id, stage: r.stage },
    data,
  });
  if (flipped.count === 0) return { ok: false, error: 'This request was just changed by someone else. Reload and try again.' };

  await logEvent(prisma, r.id, 'STAGE_CHANGED', `Stage changed: ${STAGE_LABELS[r.stage]} → ${STAGE_LABELS[args.to]}.`, { actor: 'admin' });
  if (args.to === 'CANCELLED' && r.paidAt) {
    await logEvent(prisma, r.id, 'NOTE', 'Cancelled after payment — check whether a refund is due.', { actor: 'admin' });
  }

  if (args.to === 'SUBMITTED') await safely('submitted message', () => notifyCustomer(r.id, 'SUBMITTED'));
  if (args.to === 'COMPLETED') await safely('completed message', () => notifyCustomer(r.id, 'COMPLETED'));

  return { ok: true };
}