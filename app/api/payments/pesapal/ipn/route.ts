// app/api/payments/pesapal/ipn/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTransactionStatus, PESAPAL_STATUS } from '@/lib/pesapal'
import { notify } from '@/lib/notify'

export async function GET(request: NextRequest) {
  const orderTrackingId = request.nextUrl.searchParams.get('OrderTrackingId')
  const merchantReference = request.nextUrl.searchParams.get('OrderMerchantReference')

  if (!orderTrackingId) {
    return NextResponse.json({ error: 'Missing OrderTrackingId' }, { status: 400 })
  }

  try {
    const statusResult = await getTransactionStatus(orderTrackingId)

    const payment = await prisma.payment.findFirst({
      where: { providerRef: orderTrackingId },
      include: { order: { include: { vendorSubOrders: { include: { vendor: true } } } } },
    })

    if (!payment) {
      console.error('IPN received for unknown payment, tracking id:', orderTrackingId)
      // Still acknowledge — Pesapal expects a 200 response regardless.
      return NextResponse.json({
        orderNotificationType: 'IPNCHANGE',
        orderTrackingId,
        orderMerchantReference: merchantReference,
        status: 200,
      })
    }

    if (statusResult.status_code === PESAPAL_STATUS.COMPLETED && payment.status !== 'SUCCESSFUL') {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESSFUL' } }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: 'PAID' } }),
      ])

      // Notify vendors now that money has actually moved — not at order creation.
      for (const subOrder of payment.order.vendorSubOrders) {
        if (subOrder.vendor.userId) {
          notify({
            userId: subOrder.vendor.userId,
            title: 'New order received',
            message: `You have a new paid order (${payment.order.orderNumber}) — please confirm and prepare it.`,
            type: 'SUCCESS',
            link: '/vendor/dashboard/orders',
          }).catch(() => {})
        }
      }
    } else if (statusResult.status_code === PESAPAL_STATUS.FAILED && payment.status !== 'FAILED') {
      await prisma.$transaction([
        prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } }),
        prisma.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } }),
      ])
    }

    // Pesapal expects this exact response shape acknowledging receipt.
    return NextResponse.json({
      orderNotificationType: 'IPNCHANGE',
      orderTrackingId,
      orderMerchantReference: merchantReference,
      status: 200,
    })
  } catch (error) {
    console.error('IPN processing error:', error)
    return NextResponse.json({ error: 'IPN processing failed' }, { status: 500 })
  }
}