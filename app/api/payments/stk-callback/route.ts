// app/api/payments/stk-callback/route.ts
//
// Safaricom posts the result of every STK push here — for Apply For Me
// payments and for service-order payments alike. It does not sign its
// callbacks, so we protect the endpoint three ways:
//   1. a secret in the callback URL (set when the push is sent),
//   2. the CheckoutRequestID must match a payment we created ourselves,
//   3. the paid amount must cover what we asked for.
// The path avoids the words "mpesa" / "safaricom" / "daraja" on purpose.
//
// We always answer 200 quickly. If anything goes wrong on our side the
// status routes reconcile with Safaricom directly, so nothing is lost.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { parseStkCallback, type StkCallback } from '@/lib/payments/daraja';
import { markRequestPaid } from '@/lib/applyAssistance/lifecycle';
import { logEvent } from '@/lib/applyAssistance/events';
import { markServicePaymentSuccess } from '@/lib/services/orders/lifecycle';
import { logOrderEvent } from '@/lib/services/orders/events';

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

async function handleApplyPayment(
  payment: { id: string; requestId: string; amount: number },
  cb: StkCallback,
  body: unknown,
) {
  if (cb.resultCode === 0) {
    if (cb.amount !== undefined && cb.amount < Math.ceil(payment.amount)) {
      await prisma.applyAssistancePayment.update({
        where: { id: payment.id },
        data: { failureReason: `Amount mismatch: expected ${Math.ceil(payment.amount)}, received ${cb.amount}.`, rawCallback: body as object },
      });
      await logEvent(
        prisma,
        payment.requestId,
        'NOTE',
        `M-Pesa reported a payment of ${cb.amount} but ${Math.ceil(payment.amount)} was expected. Not marked as paid — check the M-Pesa statement.`,
      );
      return;
    }

    await prisma.applyAssistancePayment.update({ where: { id: payment.id }, data: { rawCallback: body as object } });
    const result = await markRequestPaid({
      requestId: payment.requestId,
      paymentId: payment.id,
      receiptNumber: cb.receiptNumber,
      payerPhone: cb.phone,
    });
    if (result.alreadyProcessed && cb.receiptNumber) {
      await prisma.applyAssistancePayment.updateMany({
        where: { id: payment.id, receiptNumber: null },
        data: { receiptNumber: cb.receiptNumber, payerPhone: cb.phone ?? undefined },
      });
    }
    return;
  }

  const flipped = await prisma.applyAssistancePayment.updateMany({
    where: { id: payment.id, status: 'PENDING' },
    data: { status: 'FAILED', failureReason: cb.resultDesc || 'The payment was not completed.', rawCallback: body as object },
  });
  if (flipped.count > 0) {
    await logEvent(prisma, payment.requestId, 'PAYMENT_FAILED', `Payment not completed: ${cb.resultDesc || 'no reason given'}.`);
  }
}

async function handleOrderPayment(
  payment: { id: string; orderId: string; amount: number },
  cb: StkCallback,
  body: unknown,
) {
  if (cb.resultCode === 0) {
    if (cb.amount !== undefined && cb.amount < Math.ceil(payment.amount)) {
      await prisma.serviceOrderPayment.update({
        where: { id: payment.id },
        data: { failureReason: `Amount mismatch: expected ${Math.ceil(payment.amount)}, received ${cb.amount}.`, rawCallback: body as object },
      });
      await logOrderEvent(
        prisma,
        payment.orderId,
        'NOTE',
        `M-Pesa reported a payment of ${cb.amount} but ${Math.ceil(payment.amount)} was expected. Not marked as paid — check the M-Pesa statement.`,
      );
      return;
    }

    await prisma.serviceOrderPayment.update({ where: { id: payment.id }, data: { rawCallback: body as object } });
    const result = await markServicePaymentSuccess({
      orderId: payment.orderId,
      paymentId: payment.id,
      receiptNumber: cb.receiptNumber,
      payerPhone: cb.phone,
    });
    if (result.alreadyProcessed && cb.receiptNumber) {
      await prisma.serviceOrderPayment.updateMany({
        where: { id: payment.id, receiptNumber: null },
        data: { receiptNumber: cb.receiptNumber, payerPhone: cb.phone ?? undefined },
      });
    }
    return;
  }

  const flipped = await prisma.serviceOrderPayment.updateMany({
    where: { id: payment.id, status: 'PENDING' },
    data: { status: 'FAILED', failureReason: cb.resultDesc || 'The payment was not completed.', rawCallback: body as object },
  });
  if (flipped.count > 0) {
    await logOrderEvent(prisma, payment.orderId, 'PAYMENT_FAILED', `Payment not completed: ${cb.resultDesc || 'no reason given'}.`);
  }
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

    const applyPayment = await prisma.applyAssistancePayment.findUnique({ where: { providerRef: cb.checkoutRequestId } });
    if (applyPayment) {
      await handleApplyPayment(applyPayment, cb, body);
      return NextResponse.json(ACK);
    }

    const orderPayment = await prisma.serviceOrderPayment.findUnique({ where: { providerRef: cb.checkoutRequestId } });
    if (orderPayment) {
      await handleOrderPayment(orderPayment, cb, body);
      return NextResponse.json(ACK);
    }

    console.error('STK callback for unknown CheckoutRequestID:', cb.checkoutRequestId);
    return NextResponse.json(ACK);
  } catch (error) {
    console.error('STK callback error:', error);
    return NextResponse.json(ACK);
  }
}