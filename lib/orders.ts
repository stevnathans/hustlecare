/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/orders.ts
import { prisma } from '@/lib/prisma'

// Rolls up Order.status from the state of its VendorSubOrders.
// Call this any time a VendorSubOrder's status changes, rather than
// setting Order.status directly in multiple places.
export async function recomputeOrderStatus(orderId: string) {
  const subOrders = await prisma.vendorSubOrder.findMany({
    where: { orderId },
    select: { status: true },
  })

  if (subOrders.length === 0) return

  const allDelivered = subOrders.every((s) => s.status === 'DELIVERED')
  const allCancelledOrRejected = subOrders.every(
    (s) => s.status === 'CANCELLED' || s.status === 'REJECTED'
  )
  const anyDelivered = subOrders.some((s) => s.status === 'DELIVERED')
  const anyConfirmedOrDelivered = subOrders.some(
    (s) => s.status === 'CONFIRMED' || s.status === 'DELIVERED'
  )

  let newStatus: string | null = null
  if (allDelivered) newStatus = 'COMPLETED'
  else if (allCancelledOrRejected) newStatus = 'CANCELLED'
  else if (anyDelivered) newStatus = 'PARTIALLY_FULFILLED'
  else if (anyConfirmedOrDelivered) newStatus = 'PROCESSING'

  if (!newStatus) return // still PENDING_PAYMENT/PAID — no rollup change needed

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus as any },
  })
}