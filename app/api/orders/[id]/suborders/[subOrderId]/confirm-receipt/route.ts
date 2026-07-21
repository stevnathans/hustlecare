// app/api/orders/[id]/suborders/[subOrderId]/confirm-receipt/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { notify } from '@/lib/notify'
import { recomputeOrderStatus } from '@/lib/orders'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; subOrderId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { id, subOrderId } = await params
  const subOrder = await prisma.vendorSubOrder.findUnique({
    where: { id: subOrderId },
    include: { order: true, vendor: true },
  })

  if (!subOrder || subOrder.orderId !== id || subOrder.order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (subOrder.status !== 'CONFIRMED') {
    return NextResponse.json({ error: 'This item is not yet confirmed by the vendor' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.vendorSubOrder.update({ where: { id: subOrderId }, data: { status: 'DELIVERED' } }),
    prisma.vendorPayout.upsert({
      where: { vendorSubOrderId: subOrderId },
      update: { status: 'DUE' },
      create: {
        vendorSubOrderId: subOrderId,
        vendorId: subOrder.vendorId,
        amount: subOrder.payoutAmount,
        status: 'DUE',
      },
    }),
  ])

  await recomputeOrderStatus(id)

  if (subOrder.vendor.userId) {
    notify({
      userId: subOrder.vendor.userId,
      title: 'Delivery confirmed',
      message: `The buyer confirmed receipt for order ${subOrder.order.orderNumber}. Payout is now due.`,
      type: 'SUCCESS',
      link: '/vendor/dashboard/orders',
    }).catch(() => {})
  }

  return NextResponse.json({ success: true })
}