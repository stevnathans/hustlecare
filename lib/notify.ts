// lib/notify.ts
import { prisma } from '@/lib/prisma'
import { NotifType } from '@prisma/client'

interface NotifyOptions {
  userId: string
  title: string
  message: string
  type?: NotifType
  link?: string
}

export async function notify(options: NotifyOptions) {
  try {
    return await prisma.internalNotification.create({
      data: {
        userId:  options.userId,
        title:   options.title,
        message: options.message,
        type:    options.type ?? 'INFO',
        link:    options.link ?? null,
      },
    })
  } catch (err) {
    // Never let a notification failure crash the calling flow
    console.error('[notify] Failed to create notification:', (err instanceof Error ? err.message : err))
    return null
  }
}