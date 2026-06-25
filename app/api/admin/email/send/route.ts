// app/api/admin/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requirePermission, createAuditLog } from '@/lib/admin-utils'
import { sendEmail, generateUnsubscribeUrl } from '@/lib/email'
import NotificationEmail from '@/emails/NotificationEmail'

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requirePermission('users.update')
    const { userIds, title, message, ctaLabel, ctaUrl } = await req.json()

    if (!userIds?.length || !title || !message) {
      return NextResponse.json({ error: 'userIds, title, and message are required' }, { status: 400 })
    }

    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, isActive: true, emailNotifications: true },
      select: { id: true, name: true, email: true },
    })

    if (!users.length) {
      return NextResponse.json({ error: 'No eligible users found (must be active with email notifications enabled)' }, { status: 400 })
    }

    const results = await Promise.allSettled(
      users.map(user =>
        sendEmail({
          to: user.email,
          subject: title,
          react: NotificationEmail({
            name: user.name,
            title,
            message,
            ctaLabel,
            ctaUrl,
            unsubscribeUrl: generateUnsubscribeUrl(user.id), // unique per user
          }),
          type: 'NOTIFICATION',
          userId: user.id,
          metadata: { sentBy: currentUser.id, ctaUrl },
        })
      )
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length

   await createAuditLog({
  action: 'SEND', 
  entity: 'User',
  entityId: userIds.join(','),
  changes: { type: 'NOTIFICATION', subject: title, succeeded, failed },
  req,
})

    return NextResponse.json({ success: true, succeeded, failed, total: users.length })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes('Unauthorized') ? 401 : 403 })
    }
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}