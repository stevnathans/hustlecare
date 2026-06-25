// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import PasswordResetEmail from '@/emails/PasswordResetEmail'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Always return the same response whether the user exists or not.
    // This prevents email enumeration — attacker can't probe which
    // emails are registered by watching the response.
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true, password: true },
    })

    if (!user || !user.password) {
      // OAuth-only account or non-existent — return success silently
      return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
    }

    // Invalidate any existing unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    })

    // Generate a cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: rawToken, expiresAt },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}`

    await sendEmail({
      to: user.email,
      subject: 'Reset your HustleCare password',
      react: PasswordResetEmail({ name: user.name, resetUrl }),
      type: 'PASSWORD_RESET',
      userId: user.id,
      metadata: { expiresAt: expiresAt.toISOString() },
    })

    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })

  } catch (error) {
    console.error('[forgot-password]', (error instanceof Error ? error.message : error))
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}