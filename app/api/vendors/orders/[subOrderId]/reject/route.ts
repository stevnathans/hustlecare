// app/api/vendors/orders/[subOrderId]/reject/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { notify } from '@/lib/notify'
import { recomputeOrderStatus } from '@/lib/orders'

// NOTE: no automated refund happens here yet. If a buyer already paid via
// Pesapal and a vendor rejects their part of a multi-vendor order, the
// partial refund is currently a manual process. Worth automating before
// real volume — see the accompanying summary for details.
export async function POST(request: Request, { params }: { params: Promise<{ subOrderId: string }> }) {
  const session = await getServerSession(authOptions)
const vendorId = (session?.user as { vendorId?: number | null } | undefined)?.vendorId
if (!session?.user || !vendorId) {
  return NextResponse.json({ error: 'Vendor access required' }, { status: 403 })
}

  const { subOrderId } = await params
  const { reason } = await request.json()

  const subOrder = await prisma.vendorSubOrder.findUnique({ where: { id: subOrderId }, include: { order: true } })
  if (!subOrder || subOrder.vendorId !== vendorId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (subOrder.status !== 'PENDING_VENDOR_CONFIRMATION') {
    return NextResponse.json({ error: 'This order is not awaiting confirmation' }, { status: 400 })
  }

  await prisma.vendorSubOrder.update({
    where: { id: subOrderId },
    data: { status: 'REJECTED', vendorNotes: reason || null },
  })
  await recomputeOrderStatus(subOrder.orderId)

  notify({
    userId: subOrder.order.userId,
    title: 'Vendor could not fulfil part of your order',
    message: `A vendor was unable to fulfil part of order ${subOrder.order.orderNumber}${
      reason ? `: ${reason}` : ''
    }. We'll follow up about your refund.`,
    type: 'WARNING',
    link: `/orders/${subOrder.orderId}`,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}