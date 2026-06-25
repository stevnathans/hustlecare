// app/api/user/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET — fetch notifications for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [notifications, unreadCount] = await Promise.all([
      prisma.internalNotification.findMany({
        where: {
          userId: user.id,
          ...(unreadOnly && { isRead: false }),
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.internalNotification.count({
        where: { userId: user.id, isRead: false },
      }),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (err) {
    console.error('[notifications GET]', (err instanceof Error ? err.message : err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — mark one or all as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id, markAll } = await req.json()

    if (markAll) {
      await prisma.internalNotification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    if (id) {
      // Ensure the notification belongs to this user
      await prisma.internalNotification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true, readAt: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide id or markAll' }, { status: 400 })
  } catch (err) {
    console.error('[notifications PATCH]', (err instanceof Error ? err.message : err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}