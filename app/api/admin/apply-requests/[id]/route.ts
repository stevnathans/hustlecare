// app/api/admin/apply-requests/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['new', 'contacted', 'completed'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const item = await prisma.applyAssistanceRequest.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    return NextResponse.json({ request: item });
  } catch (error) {
    console.error('Error fetching apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to fetch request.' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
      }
      data.status = body.status;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    const updated = await prisma.applyAssistanceRequest.update({
      where: { id },
      data,
    });

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error('Error updating apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to update request.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.applyAssistanceRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to delete request.' }, { status: 500 });
  }
}