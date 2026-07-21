// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { PER_LEAD_FEE_KES } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const days = Number(request.nextUrl.searchParams.get('days') ?? '30')
  const since = new Date()
  since.setDate(since.getDate() - days)

  // Raw counts per vendor per event type, in the window.
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ['vendorId', 'type'],
    where: { createdAt: { gte: since }, vendorId: { not: null } },
    _count: { _all: true },
  })

  const vendorIds = Array.from(new Set(grouped.map((g) => g.vendorId).filter((id): id is number => id !== null)))
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, name: true, status: true },
  })

  type Row = {
    vendorId: number
    vendorName: string
    vendorStatus: string
    buyNowClicks: number
    outboundRedirects: number
    cartAdds: number
    donationClicks: number
    clickThroughRate: number // outboundRedirects / buyNowClicks
    suggestedInvoiceKES: number
  }

  const rowsByVendor = new Map<number, Row>()

  for (const vendor of vendors) {
    rowsByVendor.set(vendor.id, {
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorStatus: vendor.status,
      buyNowClicks: 0,
      outboundRedirects: 0,
      cartAdds: 0,
      donationClicks: 0,
      clickThroughRate: 0,
      suggestedInvoiceKES: 0,
    })
  }

  for (const g of grouped) {
    if (!g.vendorId) continue
    const row = rowsByVendor.get(g.vendorId)
    if (!row) continue
    const count = g._count._all
    if (g.type === 'BUY_NOW_CLICK') row.buyNowClicks += count
    if (g.type === 'OUTBOUND_REDIRECT') row.outboundRedirects += count
    if (g.type === 'CART_ADD') row.cartAdds += count
    if (g.type === 'DONATION_CLICK') row.donationClicks += count
  }

  const rows = Array.from(rowsByVendor.values())
    .map((row) => ({
      ...row,
      clickThroughRate: row.buyNowClicks > 0 ? row.outboundRedirects / row.buyNowClicks : 0,
      suggestedInvoiceKES: row.outboundRedirects * PER_LEAD_FEE_KES,
    }))
    .sort((a, b) => b.outboundRedirects - a.outboundRedirects)

  // Site-wide totals, independent of vendor (e.g. donation clicks aren't vendor-specific
  // in spirit even though they're logged with vendor context for the product they came from).
  const totalDonationClicks = await prisma.analyticsEvent.count({
    where: { type: 'DONATION_CLICK', createdAt: { gte: since } },
  })

  return NextResponse.json({
    days,
    perLeadFeeKES: PER_LEAD_FEE_KES,
    totalDonationClicks,
    vendors: rows,
  })
}