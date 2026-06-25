import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import WelcomeEmail from '@/emails/WelcomeEmail'

// This is called internally — not a public endpoint
// Call it from your signup/register logic after user creation
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const result = await sendEmail({
      to: user.email,
      subject: 'Welcome to HustleCare 🚀',
      react: WelcomeEmail({ name: user.name }),
      type: 'WELCOME',
      userId: user.id,
    })

    return NextResponse.json({ success: result.success })
  } catch {
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}