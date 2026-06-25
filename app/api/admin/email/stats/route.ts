// app/api/admin/email/stats/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/admin-utils'

export async function GET() {
  try {
    await requirePermission('users.view')

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek  = new Date(startOfToday); startOfWeek.setDate(startOfToday.getDate() - 7)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      total, sent, delivered, opened, bounced, failed,
      today, thisWeek, thisMonth,
      byType,
    ] = await Promise.all([
      prisma.emailLog.count(),
      prisma.emailLog.count({ where: { status: 'SENT' } }),
      prisma.emailLog.count({ where: { status: 'DELIVERED' } }),
      prisma.emailLog.count({ where: { status: 'OPENED' } }),
      prisma.emailLog.count({ where: { status: 'BOUNCED' } }),
      prisma.emailLog.count({ where: { status: 'FAILED' } }),
      prisma.emailLog.count({ where: { sentAt: { gte: startOfToday } } }),
      prisma.emailLog.count({ where: { sentAt: { gte: startOfWeek } } }),
      prisma.emailLog.count({ where: { sentAt: { gte: startOfMonth } } }),
      prisma.emailLog.groupBy({ by: ['type'], _count: { _all: true } }),
    ])

    return NextResponse.json({
      total, sent, delivered, opened, bounced, failed,
      today, thisWeek, thisMonth,
      byType: Object.fromEntries(byType.map(r => [r.type, r._count._all])),
    })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}