// app/api/cart/item/add/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { notify } from '@/lib/notify'

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
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data:  { quantity: { increment: 1 } },
      })
    } else {
      await prisma.cartItem.create({
        data: {
          cartId:          cart.id,
          productId:       product.productId,
          quantity:        1,
          unitPrice:       product.price,
          category:        product.category        || 'Uncategorized',
          requirementName: product.requirementName || 'Unspecified Requirement',
        },
      })
    }

    // Notify the vendor — fire and forget, never block the cart add
    prisma.product.findUnique({
      where:  { id: Number(product.productId) },
      select: { name: true, vendor: { select: { userId: true } } },
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
    }).catch(() => {
      // Silently ignore — notification failure must never affect cart
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