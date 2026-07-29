/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/cart/item/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { notify } from '@/lib/notify'
import { trackEvent } from '@/lib/analytics'
import { resolveFeeSchedule } from '@/lib/legalFeeSchedule'

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
    // product, the client-sent price is only a hint — the authoritative
    // price is re-resolved here from LegalFeeSchedule using the county the
    // client says it's adding for. This mirrors the project's existing
    // "never trust a client-sent price, snapshot the real one" pattern
    // (see OrderItem.unitPrice).
    const productRecord = await prisma.product.findUnique({
      where: { id: Number(product.productId) },
      select: { id: true, isFeeScheduleShell: true, templateId: true },
    })

    if (!productRecord) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    let unitPrice = product.price

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
          id: true, templateId: true, countyId: true, businessCategoryId: true, sizeBand: true,
          price: true, validityValue: true, validityUnit: true,
          processingTimeMinDays: true, processingTimeMaxDays: true, notes: true,
        },
      })

      const resolution = resolveFeeSchedule(schedules as any, countyId, {})

      if (resolution.status === 'unavailable') {
        return NextResponse.json(
          { error: 'No price is available for this county yet.' },
          { status: 400 }
        )
      }
      if (resolution.status === 'range') {
        return NextResponse.json(
          { error: 'Price varies by business type/size — use the Permit Cost Calculator for an exact figure.' },
          { status: 400 }
        )
      }

      unitPrice = resolution.price
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

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId:    cart.id,
        productId: product.productId,
      },
    })

    if (existingItem) {
      if (productRecord.isFeeScheduleShell) {
        // For a fee-schedule shell, re-adding (e.g. after switching county)
        // should REPLACE the snapshotted price, not blindly increment
        // quantity like a normal product — a business only needs one
        // Business Permit, priced for wherever it's actually located.
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data:  { unitPrice },
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
          cartId:          cart.id,
          productId:       product.productId,
          quantity:        1,
          unitPrice,
          category:        product.category        || 'Uncategorized',
          requirementName: product.requirementName || 'Unspecified Requirement',
        },
      })
    }

    // Notify the vendor + log the analytics event — both fire-and-forget,
    // neither should ever block the cart add itself.
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
      id:              item.id,
      productId:       item.productId,
      name:            item.product.name,
      price:           item.unitPrice,
      quantity:        item.quantity,
      image:           item.product.image || undefined,
      category:        item.category        || 'Uncategorized',
      requirementName: item.requirementName || 'Unspecified Requirement',
    })) || []

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error adding to cart:', error)
    return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 })
  }
}