// app/api/user/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { emailNotifications: true, pushNotifications: true, marketingEmails: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json({ settings: user })
  } catch (error) {
    console.error('[notifications GET]', (error instanceof Error ? error.message : error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emailNotifications, pushNotifications, marketingEmails } = await req.json()

    if (
      typeof emailNotifications !== 'boolean' ||
      typeof pushNotifications  !== 'boolean' ||
      typeof marketingEmails    !== 'boolean'
    ) {
      return NextResponse.json({ error: 'Invalid settings format' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { emailNotifications, pushNotifications, marketingEmails },
    })

    return NextResponse.json({
      message: 'Notification settings saved',
      settings: { emailNotifications, pushNotifications, marketingEmails },
    })
  } catch (error) {
    console.error('[notifications PUT]', (error instanceof Error ? error.message : error))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}