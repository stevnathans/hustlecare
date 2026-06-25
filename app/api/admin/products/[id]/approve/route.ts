// app/api/admin/products/[id]/approve/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createAuditLog } from '@/lib/admin-utils'
import { notify } from '@/lib/notify'

type Params = { params: Promise<{ id: string }> }

function parseId(value: string): number | null {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : null
}

const VALID_ACTIONS = new Set(['approve', 'reject'])

export async function POST(request: Request, { params }: Params) {
  try {
    const user = await requirePermission('products.update')

    const { id } = await params
    const productId = parseId(id)
    if (!productId) {
      return NextResponse.json({ error: 'Invalid product ID.' }, { status: 400 })
    }

    const body = await request.json()
    const { action, rejectReason } = body

    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: 'Action must be "approve" or "reject".' }, { status: 400 })
    }

    if (action === 'reject' && rejectReason && String(rejectReason).length > 1000) {
      return NextResponse.json({ error: 'Reject reason must be 1000 characters or fewer.' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        vendor: { select: { userId: true, name: true } },
        template: {
          include: {
            businesses: { where: { isActive: true }, select: { businessId: true } },
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 })
    }

    if (product.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: `Product status is "${product.status}" — only PENDING_REVIEW products can be reviewed.` },
        { status: 400 }
      )
    }

    if (action === 'reject') {
      await prisma.product.update({
        where: { id: productId },
        data: {
          status:       'REJECTED',
          rejectedAt:   new Date(),
          rejectReason: rejectReason ? String(rejectReason).trim().slice(0, 1000) : null,
        },
      })

      await createAuditLog({
        action:   'REJECT',
        entity:   'Product',
        entityId: productId.toString(),
        changes:  { rejectReason: rejectReason?.trim() || null, reviewedBy: user.id },
      })

      if (product.vendor?.userId) {
        await notify({
          userId:  product.vendor.userId,
          title:   'Product needs attention',
          message: `Your product "${product.name}" was not approved${rejectReason ? `: ${String(rejectReason).slice(0, 120)}` : '. Please review the feedback and resubmit.'}`,
          type:    'WARNING',
          link:    '/vendor/dashboard/products',
        })
      }

      return NextResponse.json({ message: 'Product rejected.' })
    }

    // APPROVE
    const autoTags   = product.template?.businesses.map(b => b.businessId) ?? []
    const manualTags = product.businessTags.filter(id => !autoTags.includes(id))
    const finalTags  = [...new Set([...autoTags, ...manualTags])]

    await prisma.product.update({
      where: { id: productId },
      data: {
        status:       'ACTIVE',
        publishedAt:  new Date(),
        businessTags: finalTags,
        rejectedAt:   null,
        rejectReason: null,
      },
    })

    await createAuditLog({
      action:   'APPROVE',
      entity:   'Product',
      entityId: productId.toString(),
      changes:  { businessTags: finalTags, reviewedBy: user.id },
    })

    if (product.vendor?.userId) {
      await notify({
        userId:  product.vendor.userId,
        title:   'Product approved 🎉',
        message: `Your product "${product.name}" is now live on Hustlecare and visible to entrepreneurs.`,
        type:    'SUCCESS',
        link:    '/vendor/dashboard/products',
      })
    }

    return NextResponse.json({ message: 'Product approved and live in marketplace.' })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 })
    }
    console.error('Error reviewing product:', (error as Error).message)
    return NextResponse.json({ error: 'Failed to process product review.' }, { status: 500 })
  }
}