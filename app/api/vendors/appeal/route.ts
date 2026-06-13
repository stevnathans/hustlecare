// app/api/vendors/appeal/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const message: string = (body?.message ?? '').toString().trim();
  const issueResolved: boolean = !!body?.issueResolved;

  if (!message) {
    return NextResponse.json({ error: 'Please describe what you have done to resolve this issue.' }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message is too long (max 2000 characters).' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, vendorProfile: { select: { id: true, status: true, appealStatus: true } } },
  });

  const vendor = user?.vendorProfile;
  if (!vendor) {
    return NextResponse.json({ error: 'Vendor profile not found' }, { status: 404 });
  }

  if (vendor.status !== 'SUSPENDED') {
    return NextResponse.json({ error: 'Your account is not currently suspended.' }, { status: 400 });
  }

  if (vendor.appealStatus === 'PENDING') {
    return NextResponse.json({ error: 'You already have an appeal under review.' }, { status: 400 });
  }

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      appealStatus: 'PENDING',
      appealMessage: message,
      issueResolved,
      appealedAt: new Date(),
      appealResponse: null,
      appealRespondedAt: null,
    },
    select: {
      appealStatus: true,
      appealMessage: true,
      issueResolved: true,
      appealedAt: true,
      appealResponse: true,
      appealRespondedAt: true,
    },
  });

  return NextResponse.json(updated);
}