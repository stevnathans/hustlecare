import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const taskId = parseId(id);
  if (!taskId) {
    return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
  }

  const { status } = await req.json();
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === 'DONE' ? new Date() : null },
  });

  return NextResponse.json(task);
}