// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { PER_LEAD_FEE_KES } from '@/lib/constants'

const TOP_PRODUCTS_LIMIT = 50
const TOP_REQUIREMENTS_LIMIT = 25

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const days = Number(request.nextUrl.searchParams.get('days') ?? '30')
  const since = new Date()
  since.setDate(since.getDate() - days)

  // ── Vendor-level rollup (unchanged) ──────────────────────────────────
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ['vendorId', 'type'],
    where: { createdAt: { gte: since }, vendorId: { not: null } },
    _count: { _all: true },
  })

  const vendorIds = Array.from(new Set(grouped.map((g) => g.vendorId).filter((id): id is number => id !== null)))
  const vendors = await prisma.vendor.findMany({
    where: { id: { in: vendorIds } },
    select: { id: true, name: true, status: true },
  })

  type VendorRow = {
    vendorId: number
    vendorName: string
    vendorStatus: string
    buyNowClicks: number
    outboundRedirects: number
    cartAdds: number
    donationClicks: number
    clickThroughRate: number
    suggestedInvoiceKES: number
  }

  const vendorRowsByVendor = new Map<number, VendorRow>()
  for (const vendor of vendors) {
    vendorRowsByVendor.set(vendor.id, {
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorStatus: vendor.status,
      buyNowClicks: 0,
      outboundRedirects: 0,
      cartAdds: 0,
      donationClicks: 0,
      clickThroughRate: 0,
      suggestedInvoiceKES: 0,
    })
  }

  for (const g of grouped) {
    if (!g.vendorId) continue
    const row = vendorRowsByVendor.get(g.vendorId)
    if (!row) continue
    const count = g._count._all
    if (g.type === 'BUY_NOW_CLICK') row.buyNowClicks += count
    if (g.type === 'OUTBOUND_REDIRECT') row.outboundRedirects += count
    if (g.type === 'CART_ADD') row.cartAdds += count
    if (g.type === 'DONATION_CLICK') row.donationClicks += count
  }

  const vendorRows = Array.from(vendorRowsByVendor.values())
    .map((row) => ({
      ...row,
      clickThroughRate: row.buyNowClicks > 0 ? row.outboundRedirects / row.buyNowClicks : 0,
      suggestedInvoiceKES: row.outboundRedirects * PER_LEAD_FEE_KES,
    }))
    .sort((a, b) => b.outboundRedirects - a.outboundRedirects)

  const totalDonationClicks = await prisma.analyticsEvent.count({
    where: { type: 'DONATION_CLICK', createdAt: { gte: since } },
  })

  // ── Product-level rollup ──────────────────────────────────────────────
  // Raw counts per product per event type in the window.
  const productGrouped = await prisma.analyticsEvent.groupBy({
    by: ['productId', 'type'],
    where: { createdAt: { gte: since }, productId: { not: null } },
    _count: { _all: true },
  })

  const productIds = Array.from(
    new Set(productGrouped.map((g) => g.productId).filter((id): id is number => id !== null))
  )

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      priceMin: true,
      priceMax: true,
      currency: true,
      vendor: { select: { id: true, name: true, status: true } },
    },
  })

  // AnalyticsEvent.requirementName/category are denormalized snapshots taken
  // at click time (not a relation), so the same product can in theory show
  // up under more than one requirement context if it's reused across
  // businesses. We pick the requirement/category each product was most
  // often clicked under, rather than joining through Product.template,
  // since the snapshot reflects what the user actually saw.
  const productContextGrouped = await prisma.analyticsEvent.groupBy({
    by: ['productId', 'requirementName', 'category'],
    where: { createdAt: { gte: since }, productId: { in: productIds } },
    _count: { _all: true },
  })

  const bestContextByProduct = new Map<number, { requirementName: string | null; category: string | null; count: number }>()
  for (const c of productContextGrouped) {
    if (!c.productId) continue
    const existing = bestContextByProduct.get(c.productId)
    if (!existing || c._count._all > existing.count) {
      bestContextByProduct.set(c.productId, {
        requirementName: c.requirementName,
        category: c.category,
        count: c._count._all,
      })
    }
  }

  type ProductRow = {
    productId: number
    productName: string
    vendorId: number | null
    vendorName: string | null
    vendorStatus: string | null
    priceKES: number | null
    currency: string
    category: string | null
    requirementName: string | null
    buyNowClicks: number
    outboundRedirects: number
    cartAdds: number
    clickThroughRate: number
  }

  const productRowsByProduct = new Map<number, ProductRow>()
  for (const p of products) {
    const ctx = bestContextByProduct.get(p.id)
    productRowsByProduct.set(p.id, {
      productId: p.id,
      productName: p.name,
      vendorId: p.vendor?.id ?? null,
      vendorName: p.vendor?.name ?? null,
      vendorStatus: p.vendor?.status ?? null,
      priceKES: p.price ?? p.priceMin ?? null,
      currency: p.currency ?? 'KES',
      category: ctx?.category ?? null,
      requirementName: ctx?.requirementName ?? null,
      buyNowClicks: 0,
      outboundRedirects: 0,
      cartAdds: 0,
      clickThroughRate: 0,
    })
  }

  for (const g of productGrouped) {
    if (!g.productId) continue
    const row = productRowsByProduct.get(g.productId)
    if (!row) continue
    const count = g._count._all
    if (g.type === 'BUY_NOW_CLICK') row.buyNowClicks += count
    if (g.type === 'OUTBOUND_REDIRECT') row.outboundRedirects += count
    if (g.type === 'CART_ADD') row.cartAdds += count
  }

  const productRows = Array.from(productRowsByProduct.values())
    .map((row) => ({
      ...row,
      clickThroughRate: row.buyNowClicks > 0 ? row.outboundRedirects / row.buyNowClicks : 0,
    }))
    // Rank by total engagement, not just redirects — a product with heavy
    // cart adds but few outbound clicks (e.g. bundled/legal items) is still
    // worth surfacing.
    .sort((a, b) => (b.buyNowClicks + b.cartAdds) - (a.buyNowClicks + a.cartAdds))
    .slice(0, TOP_PRODUCTS_LIMIT)

  // ── Requirement-level rollup ──────────────────────────────────────────
  // Which requirements (regardless of which specific product) are driving
  // the most engagement — useful for prioritizing which requirements need
  // better/more vendor coverage.
  const requirementGrouped = await prisma.analyticsEvent.groupBy({
    by: ['requirementName', 'category', 'type'],
    where: { createdAt: { gte: since }, requirementName: { not: null } },
    _count: { _all: true },
  })

  type RequirementRow = {
    requirementName: string
    category: string | null
    buyNowClicks: number
    outboundRedirects: number
    cartAdds: number
    clickThroughRate: number
  }

  const requirementRowsByName = new Map<string, RequirementRow>()
  for (const g of requirementGrouped) {
    if (!g.requirementName) continue
    const key = g.requirementName
    if (!requirementRowsByName.has(key)) {
      requirementRowsByName.set(key, {
        requirementName: g.requirementName,
        category: g.category,
        buyNowClicks: 0,
        outboundRedirects: 0,
        cartAdds: 0,
        clickThroughRate: 0,
      })
    }
    const row = requirementRowsByName.get(key)!
    const count = g._count._all
    if (g.type === 'BUY_NOW_CLICK') row.buyNowClicks += count
    if (g.type === 'OUTBOUND_REDIRECT') row.outboundRedirects += count
    if (g.type === 'CART_ADD') row.cartAdds += count
    // category can vary slightly across snapshots for the same requirement
    // name (shouldn't normally happen, but keep the most recent non-null).
    if (!row.category && g.category) row.category = g.category
  }

  const requirementRows = Array.from(requirementRowsByName.values())
    .map((row) => ({
      ...row,
      clickThroughRate: row.buyNowClicks > 0 ? row.outboundRedirects / row.buyNowClicks : 0,
    }))
    .sort((a, b) => (b.buyNowClicks + b.cartAdds) - (a.buyNowClicks + a.cartAdds))
    .slice(0, TOP_REQUIREMENTS_LIMIT)

  return NextResponse.json({
    days,
    perLeadFeeKES: PER_LEAD_FEE_KES,
    totalDonationClicks,
    vendors: vendorRows,
    products: productRows,
    requirements: requirementRows,
  })
}