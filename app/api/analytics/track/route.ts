// app/api/analytics/track/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { trackEvent } from '@/lib/analytics'
import type { AnalyticsEventType } from '@prisma/client'

// Only these types may be logged from the client — BUY_NOW_CLICK and CART_ADD
// are logged server-side where the action actually happens, so a forged
// client call can't inflate a vendor's billable click count.
const CLIENT_ALLOWED_TYPES: AnalyticsEventType[] = ['OUTBOUND_REDIRECT', 'DONATION_CLICK']

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { type, vendorId, productId, businessId, requirementName, category, metadata } = body

    if (!CLIENT_ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Event type not allowed from client' }, { status: 400 })
    }

    await trackEvent({
      type,
      userId: session?.user?.id ?? null,
      vendorId: vendorId ?? null,
      productId: productId ?? null,
      businessId: businessId ?? null,
      requirementName: requirementName ?? null,
      category: category ?? null,
      metadata,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking event:', error)
    // Analytics failures should never surface as errors to the user
    return NextResponse.json({ success: false })
  }
}