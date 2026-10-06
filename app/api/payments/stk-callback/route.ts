// app/api/payments/stk-callback/route.ts
//
// Safaricom posts the result of every STK push here. It does not sign its
// callbacks, so we protect the endpoint three ways:
//   1. a secret in the callback URL (set when the push is sent),
//   2. the CheckoutRequestID must match a payment we created ourselves,
//   3. the paid amount must cover what we asked for.
// The path avoids the words "mpesa" / "safaricom" / "daraja" on purpose.
//
// We always answer 200 quickly. If anything goes wrong on our side the
// status route reconciles with Safaricom directly, so nothing is lost.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { parseStkCallback } from '@/lib/payments/daraja';
import { markRequestPaid } from '@/lib/applyAssistance/lifecycle';
import { logEvent } from '@/lib/applyAssistance/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACK = { ResultCode: 0, ResultDesc: 'Accepted' };

function secretMatches(provided: string | null): boolean {
  const expected = process.env.DARAJA_CALLBACK_SECRET;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    if (!secretMatches(url.searchParams.get('secret'))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const cb = parseStkCallback(body);
    if (!cb) return NextResponse.json(ACK);

    const payment = await prisma.applyAssistancePayment.findUnique({
      where: { providerRef: cb.checkoutRequestId },
    });
    if (!payment) {
      console.error('STK callback for unknown CheckoutRequestID:', cb.checkoutRequestId);
      return NextResponse.json(ACK);
    }

    if (cb.resultCode === 0) {
      // STK amounts are whole shillings (we round up when sending).
      if (cb.amount !== undefined && cb.amount < Math.ceil(payment.amount)) {
        await prisma.applyAssistancePayment.update({
          where: { id: payment.id },
          data: {
            failureReason: `Amount mismatch: expected ${Math.ceil(payment.amount)}, received ${cb.amount}.`,
            rawCallback: body as object,
          },
        });
        await logEvent(
          prisma,
          payment.requestId,
          'NOTE',
          `M-Pesa reported a payment of ${cb.amount} but ${Math.ceil(payment.amount)} was expected. Not marked as paid — check the M-Pesa statement.`,
        );
        return NextResponse.json(ACK);
      }

      await prisma.applyAssistancePayment.update({
        where: { id: payment.id },
        data: { rawCallback: body as object },
      });

      const result = await markRequestPaid({
        requestId: payment.requestId,
        paymentId: payment.id,
        receiptNumber: cb.receiptNumber,
        payerPhone: cb.phone,
      });

      // The status check may have confirmed this payment first, without a
      // receipt number. Fill it in now.
      if (result.alreadyProcessed && cb.receiptNumber) {
        await prisma.applyAssistancePayment.updateMany({
          where: { id: payment.id, receiptNumber: null },
          data: { receiptNumber: cb.receiptNumber, payerPhone: cb.phone ?? undefined },
        });
      }
    } else {
      const flipped = await prisma.applyAssistancePayment.updateMany({
        where: { id: payment.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          failureReason: cb.resultDesc || 'The payment was not completed.',
          rawCallback: body as object,
        },
      });
      if (flipped.count > 0) {
        await logEvent(
          prisma,
          payment.requestId,
          'PAYMENT_FAILED',
          `Payment not completed: ${cb.resultDesc || 'no reason given'}.`,
        );
      }
    }

    return NextResponse.json(ACK);
  } catch (error) {
    console.error('STK callback error:', error);
    return NextResponse.json(ACK);
  }
}