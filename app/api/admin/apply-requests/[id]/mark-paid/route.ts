// app/api/admin/apply-requests/[id]/mark-paid/route.ts
//
// For manual payment mode: you saw the M-Pesa confirmation SMS, you type
// the receipt code, and the request moves to Paid exactly as an automatic
// payment would. (The button for this arrives with the new admin page.)

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { markRequestPaid } from '@/lib/applyAssistance/lifecycle';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const RECEIPT_RE = /^[A-Z0-9]{6,15}$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const receiptNumber =
      typeof body.receiptNumber === 'string' ? body.receiptNumber.trim().toUpperCase() : '';
    if (!RECEIPT_RE.test(receiptNumber)) {
      return NextResponse.json(
        { error: 'Enter the M-Pesa receipt code from the confirmation SMS (letters and numbers only).' },
        { status: 400 },
      );
    }

    const lead = await prisma.applyAssistanceRequest.findUnique({ where: { id } });
    if (!lead) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (lead.stage !== 'LEAD') {
      return NextResponse.json({ error: `This request is already at stage ${lead.stage}.` }, { status: 409 });
    }

    const duplicate = await prisma.applyAssistancePayment.findFirst({
      where: { receiptNumber, status: 'SUCCESSFUL' },
      select: { id: true },
    });
    if (duplicate) {
      return NextResponse.json({ error: 'That receipt code has already been used on another request.' }, { status: 409 });
    }

    const amount = typeof body.amount === 'number' && body.amount > 0 ? body.amount : lead.serviceFee;
    if (!amount) {
      return NextResponse.json({ error: 'No amount on this request — enter the amount received.' }, { status: 400 });
    }

    // Reuse the pending manual payment if the customer already saw the
    // instructions; otherwise create one so there is always a payment record.
    let payment = await prisma.applyAssistancePayment.findFirst({
      where: { requestId: id, status: 'PENDING', provider: 'manual' },
      orderBy: { createdAt: 'desc' },
    });
    if (!payment) {
      payment = await prisma.applyAssistancePayment.create({
        data: {
          requestId: id,
          amount,
          currency: lead.currency,
          provider: 'manual',
          merchantRef: `MAN-${id.slice(0, 8)}-${Date.now().toString(36)}`,
          payerPhone: lead.contactPhoneE164,
        },
      });
    }

    const result = await markRequestPaid({
      requestId: id,
      paymentId: payment.id,
      receiptNumber,
      actor: 'admin',
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error marking apply-assistance request as paid:', error);
    return NextResponse.json({ error: 'Failed to mark as paid.' }, { status: 500 });
  }
}