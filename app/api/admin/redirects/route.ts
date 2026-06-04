import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function canManageRedirects(role: string) {
  return ['editor', 'admin'].includes(role);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canManageRedirects(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(redirects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canManageRedirects(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { source, destination, permanent } = await req.json();
  if (!source || !destination) {
    return NextResponse.json({ error: 'source and destination are required' }, { status: 400 });
  }
  const existing = await prisma.redirect.findUnique({ where: { source } });
  if (existing) {
    return NextResponse.json({ error: 'A redirect with this source already exists' }, { status: 409 });
  }
  const redirect = await prisma.redirect.create({ data: { source, destination, permanent: permanent ?? true } });
  return NextResponse.json(redirect, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canManageRedirects(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id, source, destination, permanent } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  const redirect = await prisma.redirect.update({
    where: { id },
    data: { source, destination, permanent },
  });
  return NextResponse.json(redirect);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !canManageRedirects(session.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.redirect.delete({ where: { id } });
  return NextResponse.json({ success: true });
}