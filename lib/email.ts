// lib/email.ts
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { EmailType, Prisma } from '@prisma/client'
import { ReactElement } from 'react'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = 'Hustlecare <hello@hustlecare.net>'
export const REPLY_TO   = 'hello@hustlecare.net'
export const INFO_EMAIL = 'Hustlecare <info@hustlecare.net>'

interface SendEmailOptions {
  to: string
  subject: string
  react: ReactElement
  type: EmailType
  userId?: string
  metadata?: Record<string, unknown>
  from?: string
}

export async function sendEmail({
  to,
  subject,
  react,
  type,
  userId,
  metadata,
  from,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  // Cast metadata once — Prisma's Json field requires InputJsonValue, not
  // Record<string, unknown>, even though they're structurally identical.
  const metaJson = metadata
    ? (metadata as Prisma.InputJsonValue)
    : undefined

  try {
    const { data, error } = await resend.emails.send({
      from:    from ?? FROM_EMAIL,
      replyTo: REPLY_TO,
      to:      [to],
      subject,
      react,
    })

    if (error) {
      await prisma.emailLog.create({
        data: { to, subject, type, status: 'FAILED', error: error.message, userId, metadata: metaJson },
      })
      console.error(`[email] Failed to send ${type} to ${to}:`, error.message)
      return { success: false, error: error.message }
    }

    await prisma.emailLog.create({
      data: { to, subject, type, status: 'SENT', resendId: data?.id, userId, metadata: metaJson },
    })

    return { success: true, id: data?.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await prisma.emailLog.create({
      data: { to, subject, type, status: 'FAILED', error: message, userId, metadata: metaJson },
    })
    console.error(`[email] Exception sending ${type} to ${to}:`, message)
    return { success: false, error: message }
  }
}

export function generateUnsubscribeUrl(userId: string): string {
  const token = crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(userId)
    .digest('hex')
  return `${process.env.NEXTAUTH_URL}/api/auth/unsubscribe?userId=${userId}&token=${token}`
}