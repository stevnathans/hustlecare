// app/api/vendors/orders/[subOrderId]/confirm/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { notify } from '@/lib/notify'
import { recomputeOrderStatus } from '@/lib/orders'

export async function POST(request: Request, { params }: { params: Promise<{ subOrderId: string }> }) {
  const session = await getServerSession(authOptions)
const vendorId = (session?.user as { vendorId?: number | null } | undefined)?.vendorId
if (!session?.user || !vendorId) {
  return NextResponse.json({ error: 'Vendor access required' }, { status: 403 })
}

  const { subOrderId } = await params
  const subOrder = await prisma.vendorSubOrder.findUnique({
    where: { id: subOrderId },
    include: { order: true },
  })

  if (!subOrder || subOrder.vendorId !== vendorId) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (subOrder.status !== 'PENDING_VENDOR_CONFIRMATION') {
    return NextResponse.json({ error: 'This order is not awaiting confirmation' }, { status: 400 })
  }

  await prisma.vendorSubOrder.update({ where: { id: subOrderId }, data: { status: 'CONFIRMED' } })
  await recomputeOrderStatus(subOrder.orderId)

  notify({
    userId: subOrder.order.userId,
    title: 'Order confirmed',
    message: `Your order ${subOrder.order.orderNumber} was confirmed and is being prepared.`,
    type: 'INFO',
    link: `/orders/${subOrder.orderId}`,
  }).catch(() => {})

  return NextResponse.json({ success: true })
}