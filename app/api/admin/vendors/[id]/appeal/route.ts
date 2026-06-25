// app/api/admin/vendors/[id]/appeal/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notify'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const vendorId = parseInt(id, 10)
  if (Number.isNaN(vendorId)) {
    return NextResponse.json({ error: 'Invalid vendor id' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const action: 'accept' | 'dismiss' = body?.action
  const response: string = (body?.response ?? '').toString().trim()

  if (!['accept', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const vendor = await prisma.vendor.findUnique({
    where:  { id: vendorId },
    select: { id: true, status: true, appealStatus: true, userId: true },
  })

  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }

  if (vendor.appealStatus !== 'PENDING') {
    return NextResponse.json({ error: 'This vendor has no pending appeal.' }, { status: 400 })
  }

  if (action === 'accept') {
    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status:            'ACTIVE',
        suspendedAt:       null,
        suspendReason:     null,
        appealStatus:      'NONE',
        appealMessage:     null,
        issueResolved:     false,
        appealedAt:        null,
        appealResponse:    null,
        appealRespondedAt: null,
      },
      select: { id: true, status: true, userId: true },
    })

    if (updated.userId) {
      await notify({
        userId:  updated.userId,
        title:   'Appeal accepted — account reinstated',
        message: 'Your appeal has been reviewed and accepted. Your vendor account is now active again.',
        type:    'SUCCESS',
        link:    '/vendor/dashboard',
      })
    }

    return NextResponse.json({ message: 'Appeal accepted — vendor reinstated', vendor: updated })
  }

  // dismiss
  if (!response) {
    return NextResponse.json(
      { error: 'Please provide a response explaining why the appeal was dismissed.' },
      { status: 400 }
    )
  }

  const updated = await prisma.vendor.update({
    where: { id: vendorId },
    data: {
      appealStatus:      'REJECTED',
      appealResponse:    response,
      appealRespondedAt: new Date(),
    },
    select: { id: true, status: true, appealStatus: true, userId: true },
  })

  if (updated.userId) {
    await notify({
      userId:  updated.userId,
      title:   'Appeal update',
      message: `Your appeal has been reviewed. Unfortunately it was not accepted${response ? `: ${response.slice(0, 120)}` : '.'}`,
      type:    'WARNING',
      link:    '/vendor/dashboard',
    })
  }

  return NextResponse.json({ message: 'Appeal dismissed', vendor: updated })
}