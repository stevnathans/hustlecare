import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { title, description, priority = 'MEDIUM', dueDate, assignedToId, projectId } = await req.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      assignedToId: assignedToId || null,
      projectId: projectId || null,
    },
  });

  return NextResponse.json(task);
}