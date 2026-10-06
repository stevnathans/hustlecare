// app/api/admin/apply-requests/[id]/remind/route.ts
//
// "Send reminder now" for an unpaid lead. Same checks as the automatic job
// (consent, not opted out, price quoted, payment switched on), minus the
// timing rules.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { getPaymentMode } from '@/lib/applyAssistance/lifecycle';
import { notifyLeadReminder } from '@/lib/applyAssistance/notifications';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const r = await prisma.applyAssistanceRequest.findUnique({ where: { id } });
    if (!r) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    if (r.stage !== 'LEAD') return NextResponse.json({ error: 'Only unpaid leads can be reminded.' }, { status: 409 });
    if (!r.contactConsentAt) {
      return NextResponse.json({ error: 'This customer never agreed to be contacted (an older request). Contact them yourself.' }, { status: 409 });
    }
    if (r.optedOutAt) return NextResponse.json({ error: 'This customer opted out of reminders.' }, { status: 409 });
    if (!r.serviceFee || getPaymentMode() === 'off') {
      return NextResponse.json({ error: 'Online payment is not available for this request.' }, { status: 409 });
    }

    await notifyLeadReminder(r.id, 'manual');
    await prisma.applyAssistanceRequest.update({ where: { id: r.id }, data: { lastReminderAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending manual reminder:', error);
    return NextResponse.json({ error: 'Failed to send the reminder.' }, { status: 500 });
  }
}