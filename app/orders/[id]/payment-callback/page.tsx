// app/orders/[id]/payment-callback/page.tsx
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getTransactionStatus, PESAPAL_STATUS } from '@/lib/pesapal'

export default async function PaymentCallbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payment = await prisma.payment.findFirst({ where: { orderId: id } })
  if (!payment?.providerRef) redirect(`/orders/${id}?status=unknown`)

  // The IPN is the real source of truth, but it can arrive with a small
  // delay — do one live check here too so the user isn't stuck on a
  // stale "pending" screen right after paying.
  try {
    const statusResult = await getTransactionStatus(payment.providerRef)
    if (statusResult.status_code === PESAPAL_STATUS.COMPLETED) {
      redirect(`/orders/${id}?status=success`)
    } else if (statusResult.status_code === PESAPAL_STATUS.FAILED) {
      redirect(`/orders/${id}?status=failed`)
    }
  } catch {
    // fall through to pending
  }
  redirect(`/orders/${id}?status=pending`)
}