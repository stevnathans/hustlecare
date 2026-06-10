// app/api/vendors/public/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const vendor = await prisma.vendor.findUnique({ where: { slug }, select: { id: true } });
  if (!vendor) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ slug });
}