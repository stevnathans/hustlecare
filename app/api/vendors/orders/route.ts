// app/api/vendors/orders/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  const vendorId = (session?.user as { vendorId?: number | null } | undefined)?.vendorId
  if (!session?.user || !vendorId) {
    return NextResponse.json({ error: 'Vendor access required' }, { status: 403 })
  }

  const subOrders = await prisma.vendorSubOrder.findMany({
    where: { vendorId },
    include: {
      order: { select: { orderNumber: true, createdAt: true, status: true } },
      items: { include: { product: { select: { name: true, image: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(subOrders)
}