import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { status } = await req.json();
  const task = await prisma.task.update({
    where: { id: Number(params.id) },
    data: { status, completedAt: status === 'DONE' ? new Date() : null },
  });

  return NextResponse.json(task);
}