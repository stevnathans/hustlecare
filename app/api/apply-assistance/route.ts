// app/api/apply-assistance/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requirementName, countyName, businessName, businessId, contactName, contactPhone, contactEmail, notes } = body;

    if (!requirementName?.trim()) {
      return NextResponse.json({ error: 'Requirement name is required.' }, { status: 400 });
    }
    if (!contactName?.trim() || !contactPhone?.trim()) {
      return NextResponse.json({ error: 'Your name and phone number are required so we can reach you.' }, { status: 400 });
    }

    const created = await prisma.applyAssistanceRequest.create({
      data: {
        requirementName: requirementName.trim(),
        countyName: countyName?.trim() || null,
        businessName: businessName?.trim() || null,
        businessId: businessId ? Number(businessId) : null,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating apply-assistance request:', error);
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 });
  }
}