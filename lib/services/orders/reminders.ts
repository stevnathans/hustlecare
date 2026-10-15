// lib/services/orders/reminders.ts
//
// Unpaid-deposit follow-up for service orders. Run by the same scheduled job
// as the Apply For Me reminders. Up to three emails (about 1, 24 and 72 hours
// after the order was submitted), only to customers who ticked consent and
// haven't opted out, and never between 21:00 and 07:00 Kenya time.

import { prisma } from '@/lib/prisma';
import { getPaymentMode } from '@/lib/applyAssistance/lifecycle';
import { notifyOrderCustomer } from '@/lib/services/orders/notifications';

const HOUR = 60 * 60 * 1000;

function nextAfter(attempt: number, submittedAt: Date, now: Date): Date | null {
  if (attempt === 1) {
    const t = new Date(submittedAt.getTime() + 24 * HOUR);
    return t > now ? t : new Date(now.getTime() + 12 * HOUR);
  }
  if (attempt === 2) {
    const t = new Date(submittedAt.getTime() + 72 * HOUR);
    return t > now ? t : new Date(now.getTime() + 24 * HOUR);
  }
  return null;
}

export async function runOrderReminders(now = new Date()): Promise<{ sent: number; skipped?: string }> {
  if (getPaymentMode() === 'off') return { sent: 0, skipped: 'online payment is off' };

  const hourEAT = (now.getUTCHours() + 3) % 24;
  if (hourEAT < 7 || hourEAT >= 21) return { sent: 0, skipped: 'quiet hours (21:00–07:00 Kenya time)' };

  const due = await prisma.questionnaireDraft.findMany({
    where: {
      stage: 'AWAITING_DEPOSIT',
      archived: false,
      contactConsentAt: { not: null },
      optedOutAt: null,
      totalAmount: { gt: 0 },
      nextReminderAt: { lte: now },
      reminderCount: { lt: 3 },
    },
    orderBy: { nextReminderAt: 'asc' },
    take: 40,
  });

  let sent = 0;
  for (const o of due) {
    const attempt = o.reminderCount + 1;

    // Claim first, so overlapping runs can never send the same reminder twice.
    const claimed = await prisma.questionnaireDraft.updateMany({
      where: { id: o.id, stage: 'AWAITING_DEPOSIT', reminderCount: o.reminderCount },
      data: {
        reminderCount: attempt,
        lastReminderAt: now,
        nextReminderAt: nextAfter(attempt, o.submittedAt ?? o.createdAt, now),
      },
    });
    if (claimed.count === 0) continue;

    try {
      await notifyOrderCustomer(o.id, `REMINDER_${attempt}` as 'REMINDER_1' | 'REMINDER_2' | 'REMINDER_3');
      sent += 1;
    } catch (err) {
      console.error('[orders] reminder failed for', o.id, err);
    }
  }
  return { sent };
}