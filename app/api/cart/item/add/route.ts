/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cart/item/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { notify } from '@/lib/notify'
import { trackEvent } from '@/lib/analytics'
import { resolveFeeSchedule } from '@/lib/legalFeeSchedule'

export const dynamic = 'force-dynamic';

function billingPeriodLabelFor(billingPeriod: string): string {
  switch (billingPeriod) {
    case 'MONTHLY': return 'Monthly'
    case 'QUARTERLY': return 'Quarterly'
    case 'YEARLY': return 'Yearly'
    case 'ONE_TIME': return 'One-time'
    default: return billingPeriod
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { businessId, product } = await request.json()

    if (!businessId || !product || !product.productId) {
      return NextResponse.json(
        { error: 'Business ID and product details are required' },
        { status: 400 }
      )
    }

    const userId = session.user.id as string

    // Look up the real product row being added. For a fee-schedule shell
    // product or a Software package selection, the client-sent price is
    // only a hint — the authoritative price is re-resolved here. Currency
    // gets the same treatment: read from the product row, never trusted
    // from the client.
    const productRecord = await prisma.product.findUnique({
      where: { id: Number(product.productId) },
      select: { id: true, isFeeScheduleShell: true, templateId: true, currency: true },
    })

    if (!productRecord) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    let unitPrice = product.price
    let packageId: number | null = null
    let billingPeriodLabel: string | null = null
    const currency = productRecord.currency ?? 'KES'

    if (productRecord.isFeeScheduleShell) {
      const countyId = product.countyId ? Number(product.countyId) : null
      if (!countyId || !productRecord.templateId) {
        return NextResponse.json(
          { error: 'A county must be selected to add this requirement.' },
          { status: 400 }
        )
      }

      const schedules = await prisma.legalFeeSchedule.findMany({
        where: { templateId: productRecord.templateId, countyId },
        select: {
          id: true, templateId: true, countyId: true,
          businessCategoryId: true, tradeClassId: true, sizeBand: true,
          employeeCountMax: true, floorAreaSqm: true,
          price: true, priceMin: true, priceMax: true,
          validityValue: true, validityUnit: true,
          processingTimeMinDays: true, processingTimeMaxDays: true,
          applyUrl: true, notes: true,
        },
      })

      const business = await prisma.business.findUnique({
        where: { id: parseInt(businessId.toString()) },
        select: {
          categoryId: true,
          tradeClassId: true,
          category: { select: { defaultTradeClassId: true } },
        },
      })
      const businessCategoryId = business?.categoryId ?? null
      const tradeClassId = business?.tradeClassId ?? business?.category?.defaultTradeClassId ?? null

      const resolution = resolveFeeSchedule(schedules as any, countyId, { businessCategoryId, tradeClassId })

      if (resolution.status === 'unavailable') {
        return NextResponse.json(
          { error: 'No price is available for this county yet.' },
          { status: 400 }
        )
      }
      if (resolution.status === 'range') {
        return NextResponse.json(
          { error: 'Price varies by trade class/size — use the Permit Cost Calculator for an exact figure.' },
          { status: 400 }
        )
      }

      unitPrice = resolution.price
    } else if (product.packageId) {
      const pkg = await prisma.softwarePackage.findUnique({
        where: { id: Number(product.packageId) },
        select: { id: true, productId: true, price: true, billingPeriod: true },
      })

      if (!pkg || pkg.productId !== productRecord.id) {
        return NextResponse.json(
          { error: 'Selected package was not found for this product.' },
          { status: 400 }
        )
      }

      unitPrice = pkg.price
      packageId = pkg.id
      billingPeriodLabel = billingPeriodLabelFor(pkg.billingPeriod)
    }

    // Find or create cart for this user and business
    let cart = await prisma.cart.findUnique({
      where: {
        userId_businessId: {
          userId,
          businessId: parseInt(businessId.toString()),
        },
      },
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          businessId: parseInt(businessId.toString()),
        },
      })
    }

    // CURRENCY GUARD (new): one cart exists per (user, business) and is
    // shared across markets, so the Kenya and US pages for the same
    // business point at the same cart. Cart totals just sum
    // price × quantity with no currency conversion, so mixing KES and USD
    // lines would produce a meaningless total. Reject the add instead,
    // ignoring the product's own existing line (a same-product re-add is
    // never a conflict).
    const conflictingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        currency: { not: currency },
        NOT: { productId: Number(product.productId) },
      },
      select: { id: true },
    })

    if (conflictingItem) {
      return NextResponse.json(
        {
          error:
            'Your list for this business already contains items priced in a different currency. Clear it on the requirements page before adding this item.',
        },
        { status: 409 }
      )
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId:    cart.id,
        productId: product.productId,
      },
    })

    const replacesExistingLine = productRecord.isFeeScheduleShell || packageId !== null

    if (existingItem) {
      if (replacesExistingLine) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data:  { unitPrice, currency, packageId, billingPeriodLabel },
        })
      } else {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data:  { quantity: { increment: 1 } },
        })
      }
    } else {
      await prisma.cartItem.create({
        data: {
          cartId:             cart.id,
          productId:          product.productId,
          quantity:           1,
          unitPrice,
          currency,
          packageId,
          billingPeriodLabel,
          category:           product.category        || 'Uncategorized',
          requirementName:    product.requirementName || 'Unspecified Requirement',
        },
      })
    }

    // Notify the vendor + log the analytics event — both fire-and-forget.
    prisma.product.findUnique({
      where:  { id: Number(product.productId) },
      select: { name: true, vendorId: true, vendor: { select: { userId: true } } },
    }).then(async (foundProduct) => {
      if (foundProduct?.vendor?.userId) {
        await notify({
          userId:  foundProduct.vendor.userId,
          title:   'Product added to a startup plan',
          message: `"${foundProduct.name}" was added to an entrepreneur's startup cost list.`,
          type:    'INFO',
          link:    '/vendor/dashboard',
        })
      }

      await trackEvent({
        type: 'CART_ADD',
        userId,
        vendorId: foundProduct?.vendorId ?? null,
        productId: Number(product.productId),
        businessId: parseInt(businessId.toString()),
        requirementName: product.requirementName || 'Unspecified Requirement',
        category: product.category || 'Uncategorized',
      })
    }).catch(() => {
      // Silently ignore — neither notification nor analytics failure should affect cart
    })

    const updatedCart = await prisma.cart.findUnique({
      where:   { id: cart.id },
      include: { items: { include: { product: true } } },
    })

    const items = updatedCart?.items.map(item => ({
      id:                 item.id,
      productId:          item.productId,
      name:               item.product.name,
      price:              item.unitPrice,
      currency:           item.currency,
      quantity:           item.quantity,
      image:              item.product.image || undefined,
      category:           item.category        || 'Uncategorized',
      requirementName:    item.requirementName || 'Unspecified Requirement',
      packageId:          item.packageId ?? undefined,
      billingPeriodLabel: item.billingPeriodLabel ?? undefined,
    })) || []

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 })
  }
}