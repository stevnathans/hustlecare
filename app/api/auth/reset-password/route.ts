// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcrypt'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ message: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true } } },
    })

    if (!record) {
      return NextResponse.json({ message: 'Invalid or expired reset link.' }, { status: 400 })
    }

    if (record.usedAt) {
      return NextResponse.json({ message: 'This reset link has already been used.' }, { status: 400 })
    }

    if (record.expiresAt < new Date()) {
      return NextResponse.json({ message: 'This reset link has expired. Please request a new one.' }, { status: 400 })
    }

    const hashedPassword = await hash(password, 10)

    // Update password and mark token used in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Password reset successfully.' })

  } catch (error) {
    console.error('[reset-password]', (error instanceof Error ? error.message : error))
    return NextResponse.json({ message: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}