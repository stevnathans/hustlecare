// app/api/admin/apply-requests/[id]/stage/route.ts
//
// Admin moves a request forward: Submitted (with the authority's reference
// number), Completed, or Cancelled. The customer is emailed automatically
// for Submitted and Completed.

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { changeStage } from '@/lib/applyAssistance/lifecycle';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const MOVES = ['SUBMITTED', 'COMPLETED', 'CANCELLED'] as const;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    if (!MOVES.includes(body.stage)) {
      return NextResponse.json({ error: 'Stage must be SUBMITTED, COMPLETED or CANCELLED.' }, { status: 400 });
    }

    const result = await changeStage({
      requestId: id,
      to: body.stage,
      authorityReference: typeof body.authorityReference === 'string' ? body.authorityReference : null,
      cancelReason: typeof body.cancelReason === 'string' ? body.cancelReason : null,
    });

    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing apply-assistance stage:', error);
    return NextResponse.json({ error: 'Failed to change stage.' }, { status: 500 });
  }
}