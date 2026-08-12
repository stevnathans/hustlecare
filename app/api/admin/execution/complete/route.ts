/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { activityId, count = 1, note } = await req.json();
  if (!activityId) return NextResponse.json({ error: 'activityId is required' }, { status: 400 });

  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity || activity.sourceType !== 'MANUAL') {
    return NextResponse.json({ error: 'Only MANUAL activities accept manual completions' }, { status: 400 });
  }

  const completion = await prisma.activityCompletion.create({
    data: { activityId, userId: (session.user as any).id, count, note },
  });

  return NextResponse.json(completion);
}