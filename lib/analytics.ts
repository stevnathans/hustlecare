// lib/analytics.ts
import { prisma } from '@/lib/prisma'
import type { AnalyticsEventType } from '@prisma/client'

type TrackEventParams = {
  type: AnalyticsEventType
  userId?: string | null
  vendorId?: number | null
  productId?: number | null
  businessId?: number | null
  requirementName?: string | null
  category?: string | null
  metadata?: Record<string, unknown>
}

// Maps event types onto the existing VendorAnalytics daily counters, so the
// vendor's own dashboard (Profile Views / Product Clicks / Cart Adds) keeps
// working without changes. Types with no mapping just get logged raw.
const ROLLUP_FIELD: Partial<Record<AnalyticsEventType, 'productClicks' | 'cartAdds'>> = {
  BUY_NOW_CLICK: 'productClicks',
  CART_ADD: 'cartAdds',
}

// Never let analytics failures break the user-facing action that triggered
// them — same fire-and-forget philosophy as notify().
export async function trackEvent(params: TrackEventParams) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type: params.type,
        userId: params.userId ?? null,
        vendorId: params.vendorId ?? null,
        productId: params.productId ?? null,
        businessId: params.businessId ?? null,
        requirementName: params.requirementName ?? null,
        category: params.category ?? null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : undefined,
      },
    })

    const rollupField = ROLLUP_FIELD[params.type]
    if (rollupField && params.vendorId) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.vendorAnalytics.upsert({
        where: { vendorId_date: { vendorId: params.vendorId, date: today } },
        update: { [rollupField]: { increment: 1 } },
        create: {
          vendorId: params.vendorId,
          date: today,
          [rollupField]: 1,
        },
      })
    }
  } catch (error) {
    console.error('[analytics] trackEvent failed:', error)
  }
}