// app/api/apply-assistance/[token]/pay/route.ts
//
// Step 2 of the form: start a payment for a saved lead. The amount is the
// price snapshotted on the request when the customer started — never a
// number sent from the browser.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { normalizeKenyanPhone, toMpesaMsisdn, formatPhoneLocal } from '@/lib/phone';
import { getPaymentMode } from '@/lib/applyAssistance/lifecycle';
import { logEvent } from '@/lib/applyAssistance/events';
import { initiateStkPush, DarajaError } from '@/lib/payments/daraja';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MAX_ATTEMPTS_PER_HOUR = 5;
// A prompt younger than this is still on the customer's phone — reuse it
// instead of sending a second one.
const REUSE_PENDING_WITHIN_MS = 60_000;

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));

    const lead = await prisma.applyAssistanceRequest.findUnique({ where: { publicToken: token } });
    if (!lead) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    const mode = getPaymentMode();
    if (mode === 'off') {
      return NextResponse.json({ error: 'Online payment is not available yet.' }, { status: 503 });
    }
    if (lead.stage !== 'LEAD') {
      return NextResponse.json({ error: 'This request has already been paid.', stage: lead.stage }, { status: 409 });
    }
    if (!lead.serviceFee || lead.serviceFee <= 0) {
      return NextResponse.json({ error: 'No price is set for this request.' }, { status: 400 });
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const attemptsThisHour = await prisma.applyAssistancePayment.count({
      where: { requestId: lead.id, createdAt: { gte: hourAgo } },
    });
    if (attemptsThisHour >= MAX_ATTEMPTS_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many payment attempts. Please wait a little while and try again.' },
        { status: 429 },
      );
    }

    const pending = await prisma.applyAssistancePayment.findFirst({
      where: { requestId: lead.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    // ── Manual mode: show how to pay; you confirm it in admin ───────────────
    if (mode === 'manual') {
      if (!pending) {
        const payment = await prisma.applyAssistancePayment.create({
          data: {
            requestId: lead.id,
            amount: lead.serviceFee,
            currency: lead.currency,
            provider: 'manual',
            merchantRef: `MAN-${lead.id.slice(0, 8)}-${Date.now().toString(36)}`,
            payerPhone: lead.contactPhoneE164,
          },
        });
        await logEvent(prisma, lead.id, 'PAYMENT_STARTED', 'Customer was shown manual M-Pesa payment instructions.', {
          actor: 'customer',
          metadata: { paymentId: payment.id },
        });
      }
      return NextResponse.json({
        mode: 'manual',
        amount: lead.serviceFee,
        currency: lead.currency,
        payTo: process.env.APPLY_MANUAL_PAY_TO || null,
        payFromPhone: lead.contactPhoneE164 ? formatPhoneLocal(lead.contactPhoneE164) : null,
      });
    }

    // ── Daraja mode: send the STK prompt ────────────────────────────────────
    if (pending && Date.now() - pending.createdAt.getTime() < REUSE_PENDING_WITHIN_MS && pending.provider === 'daraja') {
      return NextResponse.json({ mode: 'daraja', paymentId: pending.id, reused: true });
    }

    const phoneE164 = normalizeKenyanPhone(typeof body.mpesaPhone === 'string' ? body.mpesaPhone : lead.contactPhoneE164);
    if (!phoneE164) {
      return NextResponse.json({ error: 'Enter a valid Safaricom number, like 0712 345 678.' }, { status: 400 });
    }

    // An older prompt we're giving up on. If its callback still arrives and
    // the customer did pay, markRequestPaid accepts it anyway.
    if (pending) {
      await prisma.applyAssistancePayment.update({
        where: { id: pending.id },
        data: { status: 'FAILED', failureReason: 'Replaced by a newer payment attempt.' },
      });
    }

    const payment = await prisma.applyAssistancePayment.create({
      data: {
        requestId: lead.id,
        amount: lead.serviceFee,
        currency: lead.currency,
        provider: 'daraja',
        merchantRef: `AA-${lead.id.slice(0, 8)}-${attemptsThisHour + 1}-${Date.now().toString(36)}`,
        payerPhone: phoneE164,
      },
    });

    try {
      const stk = await initiateStkPush({
        amount: lead.serviceFee,
        msisdn: toMpesaMsisdn(phoneE164),
        accountReference: 'Hustlecare',
        description: 'Apply for me',
      });

      await prisma.applyAssistancePayment.update({
        where: { id: payment.id },
        data: { providerRef: stk.checkoutRequestId },
      });
      await logEvent(prisma, lead.id, 'PAYMENT_STARTED', `M-Pesa prompt sent to ${formatPhoneLocal(phoneE164)}.`, {
        actor: 'customer',
        metadata: { paymentId: payment.id },
      });

      return NextResponse.json({ mode: 'daraja', paymentId: payment.id });
    } catch (err) {
      const reason = err instanceof DarajaError ? err.message : 'Unexpected error sending the M-Pesa prompt.';
      console.error('STK push failed:', err);
      await prisma.applyAssistancePayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: reason },
      });
      await logEvent(prisma, lead.id, 'PAYMENT_FAILED', `Could not send the M-Pesa prompt: ${reason}`);
      return NextResponse.json(
        { error: 'We could not send the M-Pesa prompt. Check the number and try again.' },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error('Error starting apply-assistance payment:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}