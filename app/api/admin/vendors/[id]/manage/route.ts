// app/api/admin/vendors/[id]/manage/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'
import { sendEmail } from '@/lib/email'
import VendorStatusEmail from '@/emails/VendorStatusEmail'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })
    }

    const { id } = await params
    const vendorId = parseInt(id)
    const body = await request.json()
    const { action, reason } = body

    if (!['suspend', 'unsuspend', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "suspend", "unsuspend", or "delete".' },
        { status: 400 }
      )
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { user: { select: { id: true, name: true, email: true } } },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 })
    }

    if (action === 'suspend') {
      if (!reason?.trim()) {
        return NextResponse.json({ error: 'A reason is required to suspend a vendor.' }, { status: 400 })
      }
      if (vendor.status === 'SUSPENDED') {
        return NextResponse.json({ error: 'Vendor is already suspended.' }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            status:        'SUSPENDED',
            suspendedAt:   new Date(),
            suspendReason: reason.trim(),
          },
        })
        await tx.product.updateMany({
          where: { vendorId, status: 'ACTIVE' },
          data:  { status: 'ARCHIVED' },
        })
      })

      if (vendor.user) {
        await notify({
          userId:  vendor.user.id,
          title:   'Account suspended',
          message: `Your Hustlecare vendor account has been suspended. Reason: ${reason.trim()}. You can submit an appeal from your dashboard.`,
          type:    'WARNING',
          link:    '/vendor/dashboard',
        })

        await sendEmail({
          to:      vendor.user.email,
          subject: 'Your Hustlecare vendor account has been suspended',
          react:   VendorStatusEmail({ name: vendor.user.name, status: 'suspended', reason: reason.trim() }),
          type:    'NOTIFICATION',
          userId:  vendor.user.id,
        }).catch((err) => console.error('[email] Vendor suspension email failed:', err?.message))
      }

      return NextResponse.json({ message: 'Vendor suspended and products archived.' })
    }

    if (action === 'unsuspend') {
      if (vendor.status !== 'SUSPENDED') {
        return NextResponse.json({ error: 'Vendor is not currently suspended.' }, { status: 400 })
      }

      await prisma.$transaction(async (tx) => {
        await tx.vendor.update({
          where: { id: vendorId },
          data: {
            status:        'ACTIVE',
            suspendedAt:   null,
            suspendReason: null,
          },
        })
        await tx.product.updateMany({
          where: {
            vendorId,
            status:      'ARCHIVED',
            publishedAt: { not: null },
          },
          data: { status: 'ACTIVE' },
        })
      })

      if (vendor.user) {
        await notify({
          userId:  vendor.user.id,
          title:   'Account reinstated',
          message: 'Your Hustlecare vendor account is active again. Your products have been restored to the marketplace.',
          type:    'SUCCESS',
          link:    '/vendor/dashboard',
        })

        await sendEmail({
          to:      vendor.user.email,
          subject: 'Your Hustlecare vendor account is active again',
          react:   VendorStatusEmail({ name: vendor.user.name, status: 'reinstated' }),
          type:    'NOTIFICATION',
          userId:  vendor.user.id,
        }).catch((err) => console.error('[email] Vendor reinstatement email failed:', err?.message))
      }

      return NextResponse.json({ message: 'Vendor reinstated and products restored.' })
    }

    if (action === 'delete') {
      await prisma.$transaction(async (tx) => {
        await tx.product.updateMany({
          where: { vendorId },
          data:  { status: 'ARCHIVED' },
        })
        if (vendor.userId) {
          await tx.user.update({
            where: { id: vendor.userId },
            data:  { role: 'user' },
          })
        }
        await tx.vendor.delete({ where: { id: vendorId } })
      })

      if (vendor.user) {
        await notify({
          userId:  vendor.user.id,
          title:   'Vendor account removed',
          message: 'Your Hustlecare vendor account has been removed. Contact support if you have any questions.',
          type:    'WARNING',
        })
      }

      return NextResponse.json({ message: 'Vendor deleted. Products archived. User role reverted.' })
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 })
  } catch (error) {
    console.error('Error managing vendor:', error)
    return NextResponse.json({ error: 'Failed to process vendor action.' }, { status: 500 })
  }
}