// app/api/apply-assistance/[token]/payment-status/route.ts
//
// The form polls this while the customer is entering their M-Pesa PIN.
// Normally the callback has already updated the payment by the time it is
// asked. If the callback is late or lost, this route asks Safaricom
// directly (at most once every few seconds) so the customer is never left
// staring at a spinner after they have actually paid.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { markRequestPaid } from '@/lib/applyAssistance/lifecycle';
import { logEvent } from '@/lib/applyAssistance/events';
import { queryStkStatus } from '@/lib/payments/daraja';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MIN_AGE_BEFORE_CHECK_MS = 15_000;
const MAX_AGE_TO_CHECK_MS = 15 * 60_000;
const MIN_GAP_BETWEEN_CHECKS_MS = 8_000;

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const lead = await prisma.applyAssistanceRequest.findUnique({
      where: { publicToken: token },
      select: { id: true },
    });
    if (!lead) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    const latest = await prisma.applyAssistancePayment.findFirst({
      where: { requestId: lead.id },
      orderBy: { createdAt: 'desc' },
    });

    if (latest && latest.status === 'PENDING' && latest.provider === 'daraja' && latest.providerRef) {
      const now = Date.now();
      const age = now - latest.createdAt.getTime();
      const sinceLastTouch = now - latest.updatedAt.getTime();

      if (age > MIN_AGE_BEFORE_CHECK_MS && age < MAX_AGE_TO_CHECK_MS && sinceLastTouch > MIN_GAP_BETWEEN_CHECKS_MS) {
        try {
          const result = await queryStkStatus(latest.providerRef);

          if (result.state === 'success') {
            // No receipt number here; the callback fills it in if it ever arrives.
            await markRequestPaid({ requestId: lead.id, paymentId: latest.id });
          } else if (result.state === 'failed') {
            const flipped = await prisma.applyAssistancePayment.updateMany({
              where: { id: latest.id, status: 'PENDING' },
              data: { status: 'FAILED', failureReason: result.resultDesc || 'The payment was not completed.' },
            });
            if (flipped.count > 0) {
              await logEvent(prisma, lead.id, 'PAYMENT_FAILED', `Payment not completed: ${result.resultDesc || 'no reason given'}.`);
            }
          } else {
            await prisma.applyAssistancePayment.update({ where: { id: latest.id }, data: { updatedAt: new Date() } });
          }
        } catch (err) {
          console.error('STK status check failed:', err);
          // Touch the row so a failing check isn't repeated on every poll.
          await prisma.applyAssistancePayment
            .update({ where: { id: latest.id }, data: { updatedAt: new Date() } })
            .catch(() => {});
        }
      }
    }

    const [request, payment] = await Promise.all([
      prisma.applyAssistanceRequest.findUnique({ where: { id: lead.id }, select: { stage: true } }),
      prisma.applyAssistancePayment.findFirst({
        where: { requestId: lead.id },
        orderBy: { createdAt: 'desc' },
        select: { status: true, failureReason: true, receiptNumber: true },
      }),
    ]);

    return NextResponse.json({
      stage: request?.stage ?? null,
      paid: !!request && request.stage !== 'LEAD' && payment?.status === 'SUCCESSFUL',
      payment,
    });
  } catch (error) {
    console.error('Error checking apply-assistance payment status:', error);
    return NextResponse.json({ error: 'Could not check payment status.' }, { status: 500 });
  }
}