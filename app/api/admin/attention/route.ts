// app/api/admin/attention/route.ts
//
// Counts and money for the admin menu badges and the dashboard: what needs
// you right now, and what has come in.

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [
      applyReady,
      applyWaiting,
      applyLeads,
      ordersToWork,
      ordersInReview,
      ordersAwaitingBalance,
      ordersAwaitingDeposit,
      applyRevenue,
      orderRevenue,
      applyRevenueMonth,
      orderRevenueMonth,
      outstanding,
    ] = await Promise.all([
      prisma.applyAssistanceRequest.count({ where: { stage: 'READY', archived: false } }),
      prisma.applyAssistanceRequest.count({ where: { stage: 'PAID', archived: false } }),
      prisma.applyAssistanceRequest.count({ where: { stage: 'LEAD', archived: false, contactConsentAt: { not: null } } }),
      prisma.questionnaireDraft.count({ where: { stage: 'IN_PROGRESS', archived: false } }),
      prisma.questionnaireDraft.count({ where: { stage: 'IN_REVIEW', archived: false } }),
      prisma.questionnaireDraft.count({ where: { stage: 'AWAITING_BALANCE', archived: false } }),
      prisma.questionnaireDraft.count({ where: { stage: 'AWAITING_DEPOSIT', archived: false } }),
      prisma.applyAssistancePayment.aggregate({ where: { status: 'SUCCESSFUL' }, _sum: { amount: true } }),
      prisma.serviceOrderPayment.aggregate({ where: { status: 'SUCCESSFUL' }, _sum: { amount: true } }),
      prisma.applyAssistancePayment.aggregate({ where: { status: 'SUCCESSFUL', paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      prisma.serviceOrderPayment.aggregate({ where: { status: 'SUCCESSFUL', paidAt: { gte: monthStart } }, _sum: { amount: true } }),
      // Money still to collect on orders that have started: balances not yet paid.
      prisma.questionnaireDraft.aggregate({
        where: { stage: { in: ['IN_PROGRESS', 'IN_REVIEW', 'AWAITING_BALANCE'] }, archived: false },
        _sum: { balanceAmount: true },
      }),
    ]);

    return NextResponse.json({
      applyReady,
      applyWaiting,
      applyLeads,
      ordersToWork,
      ordersInReview,
      ordersAwaitingBalance,
      ordersAwaitingDeposit,
      revenueTotal: (applyRevenue._sum.amount ?? 0) + (orderRevenue._sum.amount ?? 0),
      revenueThisMonth: (applyRevenueMonth._sum.amount ?? 0) + (orderRevenueMonth._sum.amount ?? 0),
      outstandingBalances: outstanding._sum.balanceAmount ?? 0,
    });
  } catch (error) {
    console.error('Error loading attention counts:', error);
    return NextResponse.json({ error: 'Failed to load.' }, { status: 500 });
  }
}