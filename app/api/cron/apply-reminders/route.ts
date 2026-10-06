// app/api/cron/apply-reminders/route.ts
//
// Called on a schedule by Vercel Cron (see vercel.json). Vercel sends
// "Authorization: Bearer <CRON_SECRET>" automatically when the CRON_SECRET
// environment variable is set; anything else is rejected.

import { NextResponse } from 'next/server';
import { runLeadReminders } from '@/lib/applyAssistance/reminders';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runLeadReminders();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Reminder run failed:', error);
    return NextResponse.json({ error: 'Reminder run failed.' }, { status: 500 });
  }
}