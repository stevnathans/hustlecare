// lib/applyAssistance/reminders.ts
//
// The abandoned-lead follow-up. Run on a schedule (see vercel.json). Finds
// people who saved their details but never paid, and sends up to three
// reminders: roughly 1 hour, 24 hours and 72 hours after they started.
//
// A lead is only contacted if ALL of these hold:
//   - they ticked the consent box (contactConsentAt is set)
//   - they haven't opted out
//   - online payment is switched on and they were quoted a price
//   - it is between 07:00 and 21:00 in Kenya (no late-night messages)
// Paying, cancelling or archiving the request stops the reminders.

import { prisma } from '@/lib/prisma';
import { getPaymentMode } from '@/lib/applyAssistance/lifecycle';
import { notifyLeadReminder } from '@/lib/applyAssistance/notifications';

const HOUR = 60 * 60 * 1000;
const MAX_PER_RUN = 40;

function nextReminderAfter(attempt: number, createdAt: Date, now: Date): Date | null {
  if (attempt === 1) {
    const target = new Date(createdAt.getTime() + 24 * HOUR);
    return target > now ? target : new Date(now.getTime() + 12 * HOUR);
  }
  if (attempt === 2) {
    const target = new Date(createdAt.getTime() + 72 * HOUR);
    return target > now ? target : new Date(now.getTime() + 24 * HOUR);
  }
  return null; // third reminder was the last
}

export async function runLeadReminders(now = new Date()): Promise<{ sent: number; skipped?: string }> {
  if (getPaymentMode() === 'off') return { sent: 0, skipped: 'online payment is off' };

  const hourEAT = (now.getUTCHours() + 3) % 24;
  if (hourEAT < 7 || hourEAT >= 21) return { sent: 0, skipped: 'quiet hours (21:00–07:00 Kenya time)' };

  const due = await prisma.applyAssistanceRequest.findMany({
    where: {
      stage: 'LEAD',
      archived: false,
      contactConsentAt: { not: null },
      optedOutAt: null,
      serviceFee: { gt: 0 },
      nextReminderAt: { lte: now },
      reminderCount: { lt: 3 },
    },
    orderBy: { nextReminderAt: 'asc' },
    take: MAX_PER_RUN,
  });

  let sent = 0;
  for (const r of due) {
    const attempt = r.reminderCount + 1;

    // Claim it first, so two overlapping runs can never send the same reminder twice.
    const claimed = await prisma.applyAssistanceRequest.updateMany({
      where: { id: r.id, stage: 'LEAD', reminderCount: r.reminderCount },
      data: {
        reminderCount: attempt,
        lastReminderAt: now,
        nextReminderAt: nextReminderAfter(attempt, r.createdAt, now),
      },
    });
    if (claimed.count === 0) continue;

    try {
      await notifyLeadReminder(r.id, attempt as 1 | 2 | 3);
      sent += 1;
    } catch (err) {
      console.error('[apply] reminder failed for', r.id, err);
    }
  }
  return { sent };
}