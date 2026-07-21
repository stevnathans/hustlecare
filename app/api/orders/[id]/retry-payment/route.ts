// app/api/orders/[id]/retry-payment/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { submitOrder } from '@/lib/pesapal'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, include: { payment: true } })

  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }
  if (order.status !== 'PENDING_PAYMENT' && order.payment?.status !== 'FAILED') {
    return NextResponse.json({ error: 'This order does not need payment retry' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // NOTE: Pesapal requires a unique merchant reference per SubmitOrderRequest.
  // Appending -R{n} avoids colliding with the original attempt — verify this
  // behaves as expected against the sandbox before relying on it in production.
  const result = await submitOrder({
    merchantReference: `${order.orderNumber}-R${(order.payment?.attempts ?? 0) + 1}`,
    amount: order.totalAmount,
    description: `Hustlecare order ${order.orderNumber} (retry)`,
    callbackUrl: `${appUrl}/orders/${order.id}/payment-callback`,
    notificationId: process.env.PESAPAL_IPN_ID as string,
    customerEmail: session.user.email as string,
  })

  await prisma.payment.update({
    where: { orderId: order.id },
    data: {
      provider: 'pesapal',
      providerRef: result.order_tracking_id,
      status: 'PENDING',
      attempts: { increment: 1 },
    },
  })

  return NextResponse.json({ redirectUrl: result.redirect_url })
}