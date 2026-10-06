// app/api/apply-assistance/optout/route.ts
//
// The "stop these reminders" link in reminder emails. Opting out stops
// reminders only — a customer who still goes ahead and pays keeps getting
// the confirmation and progress emails for their own request.

import { prisma } from '@/lib/prisma';
import { logEvent } from '@/lib/applyAssistance/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function page(message: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Hustlecare</title></head><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f1f5f9;margin:0;padding:48px 16px"><div style="max-width:420px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:28px"><div style="font-size:14px;font-weight:700;color:#059669">Hustlecare</div><p style="font-size:16px;line-height:24px;color:#0f172a;margin:12px 0 0">${message}</p></div></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return page('This link is not valid.', 400);

  const r = await prisma.applyAssistanceRequest.findUnique({
    where: { publicToken: token },
    select: { id: true, optedOutAt: true },
  });
  if (!r) return page('This link is not valid.', 404);

  if (!r.optedOutAt) {
    await prisma.applyAssistanceRequest.update({
      where: { id: r.id },
      data: { optedOutAt: new Date(), nextReminderAt: null },
    });
    await logEvent(prisma, r.id, 'OPTED_OUT', 'Customer stopped reminders using the link in an email.', { actor: 'customer' });
  }

  return page('Done. We will not send you any more reminders about this request.');
}