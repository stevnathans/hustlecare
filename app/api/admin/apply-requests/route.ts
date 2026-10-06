// app/api/admin/apply-requests/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Returns every request (newest first) with a document count. Volumes are
// small, so the admin page filters, searches and pages them in the browser.
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const requests = await prisma.applyAssistanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        requirementName: true,
        countyName: true,
        businessId: true,
        businessName: true,
        contactName: true,
        contactPhone: true,
        contactPhoneE164: true,
        contactEmail: true,
        stage: true,
        serviceFee: true,
        governmentFeeMin: true,
        governmentFeeMax: true,
        currency: true,
        createdAt: true,
        paidAt: true,
        archived: true,
        contactConsentAt: true,
        optedOutAt: true,
        reminderCount: true,
        _count: { select: { documents: { where: { isDeliverable: false } } } },
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Error fetching apply-assistance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch requests.' }, { status: 500 });
  }
}