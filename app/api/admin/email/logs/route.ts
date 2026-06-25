import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/admin-utils'

export async function GET(req: Request) {
  try {
    await requirePermission('users.view')
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '50')
    const type = searchParams.get('type') ?? undefined
    const status = searchParams.get('status') ?? undefined

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: {
          ...(type && { type: type as any }),
          ...(status && { status: status as any }),
        },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { sentAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailLog.count({
        where: {
          ...(type && { type: type as any }),
          ...(status && { status: status as any }),
        },
      }),
    ])

    return NextResponse.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}