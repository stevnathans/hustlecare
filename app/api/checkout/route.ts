// app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { submitOrder } from '@/lib/pesapal'
import { VENDOR_COMMISSION_RATE, CONSOLIDATION_FEE_FLAT } from '@/lib/constants'

async function generateOrderNumber() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const countToday = await prisma.order.count({
    where: { createdAt: { gte: new Date(new Date().toDateString()) } },
  })
  return `HC-ORD-${datePart}-${String(countToday + 1).padStart(4, '0')}`
}

type CheckoutItemInput = { productId: number; quantity: number }

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const userId = session.user.id as string
    const userEmail = session.user.email as string

    const body = await request.json()
    const { businessId, items: explicitItems } = body as {
      businessId: number
      items?: CheckoutItemInput[]
    }

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 })
    }

    // ── Resolve line items: either explicit (Buy Now / single-item) or the full cart ──
    let resolvedItems: { productId: number; quantity: number; unitPrice: number }[]

    if (explicitItems && explicitItems.length > 0) {
      const productIds = explicitItems.map((i) => i.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, price: true, vendorId: true, status: true },
      })

      const missing = productIds.filter((id) => !products.find((p) => p.id === id))
      if (missing.length > 0) {
        return NextResponse.json({ error: 'One or more products not found', missing }, { status: 404 })
      }
      const unavailable = products.filter((p) => p.status !== 'ACTIVE' || !p.vendorId)
      if (unavailable.length > 0) {
        return NextResponse.json(
          { error: 'One or more products are unavailable for purchase', productIds: unavailable.map((p) => p.id) },
          { status: 422 }
        )
      }

      resolvedItems = explicitItems.map((i) => {
        const product = products.find((p) => p.id === i.productId)!
        return { productId: i.productId, quantity: i.quantity, unitPrice: product.price ?? 0 }
      })
    } else {
      const cart = await prisma.cart.findUnique({
        where: { userId_businessId: { userId, businessId: Number(businessId) } },
        include: { items: { include: { product: true } } },
      })
      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
      }
      const unassignable = cart.items.filter((item) => !item.product.vendorId)
      if (unassignable.length > 0) {
        return NextResponse.json(
          {
            error: 'Some items are missing vendor information and cannot be ordered',
            items: unassignable.map((i) => i.id),
          },
          { status: 422 }
        )
      }
      resolvedItems = cart.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      }))
    }

    // ── Fetch vendor context for grouping ──
    const productMap = await prisma.product.findMany({
      where: { id: { in: resolvedItems.map((i) => i.productId) } },
      select: { id: true, vendorId: true },
    })

    const byVendor = new Map<number, typeof resolvedItems>()
    for (const item of resolvedItems) {
      const vendorId = productMap.find((p) => p.id === item.productId)?.vendorId
      if (!vendorId) continue // already validated above, defensive only
      if (!byVendor.has(vendorId)) byVendor.set(vendorId, [])
      byVendor.get(vendorId)!.push(item)
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
    const consolidationFee = byVendor.size > 1 ? CONSOLIDATION_FEE_FLAT : 0
    const totalAmount = subtotal + consolidationFee
    const orderNumber = await generateOrderNumber()

    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          businessId: Number(businessId),
          subtotal,
          consolidationFee,
          totalAmount,
          status: 'PENDING_PAYMENT',
        },
      })

      for (const [vendorId, items] of byVendor.entries()) {
        const vendorSubtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
        const commissionAmount = vendorSubtotal * VENDOR_COMMISSION_RATE
        const payoutAmount = vendorSubtotal - commissionAmount

        const subOrder = await tx.vendorSubOrder.create({
          data: {
            orderId: createdOrder.id,
            vendorId,
            subtotal: vendorSubtotal,
            commissionRate: VENDOR_COMMISSION_RATE,
            commissionAmount,
            payoutAmount,
            status: 'PENDING_VENDOR_CONFIRMATION',
          },
        })

        await tx.orderItem.createMany({
          data: items.map((i) => ({
            vendorSubOrderId: subOrder.id,
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            lineTotal: i.unitPrice * i.quantity,
          })),
        })
      }

      await tx.payment.create({
        data: { orderId: createdOrder.id, amount: totalAmount, status: 'PENDING', attempts: 1 },
      })

      return createdOrder
    })

    // ── Kick off Pesapal payment ──
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    let pesapalResult
    try {
      pesapalResult = await submitOrder({
        merchantReference: orderNumber,
        amount: totalAmount,
        description: `Hustlecare order ${orderNumber}`,
        callbackUrl: `${appUrl}/orders/${order.id}/payment-callback`,
        notificationId: process.env.PESAPAL_IPN_ID as string,
        customerEmail: userEmail,
        firstName: session.user.name?.split(' ')[0],
        lastName: session.user.name?.split(' ').slice(1).join(' '),
      })
    } catch (pesapalError) {
      console.error('Pesapal submit order failed:', pesapalError)
      // Order + Payment already exist as PENDING — user can retry from the
      // order page instead of losing the whole checkout.
      return NextResponse.json(
        { success: true, orderId: order.id, orderNumber, paymentError: true },
        { status: 202 }
      )
    }

    await prisma.payment.update({
      where: { orderId: order.id },
      data: { provider: 'pesapal', providerRef: pesapalResult.order_tracking_id },
    })

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber,
      totalAmount,
      redirectUrl: pesapalResult.redirect_url,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}