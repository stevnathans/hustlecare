// app/api/auth/unsubscribe/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

// Deterministic token — derived from userId + secret.
// No DB table needed: we can verify it on the fly.
function generateUnsubToken(userId: string) {
  return crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET!)
    .update(userId)
    .digest('hex')
}

export function verifyUnsubToken(userId: string, token: string) {
  const expected = generateUnsubToken(userId)
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))
}

// GET /api/auth/unsubscribe?userId=xxx&token=yyy
// Called when user clicks the unsubscribe link in an email
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const token  = searchParams.get('token')

  if (!userId || !token) {
    return NextResponse.redirect(new URL('/unsubscribe?error=invalid', req.url))
  }

  try {
    const valid = verifyUnsubToken(userId, token)
    if (!valid) {
      return NextResponse.redirect(new URL('/unsubscribe?error=invalid', req.url))
    }

    await prisma.user.update({
      where: { id: userId },
      data: { marketingEmails: false },
    })

    return NextResponse.redirect(new URL('/unsubscribe?success=true', req.url))
  } catch {
    return NextResponse.redirect(new URL('/unsubscribe?error=server', req.url))
  }
}