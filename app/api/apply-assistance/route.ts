// app/api/apply-assistance/route.ts
//
// Step 1 of "Apply For Me": saves the customer's details as a LEAD the
// moment they continue, so someone who never pays is still a known lead.
// Everything that matters (business name, county, price) is looked up here
// on the server — the form is never trusted for it.

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { normalizeKenyanPhone, formatPhoneLocal } from '@/lib/phone';
import { APPLY_REQUIRE_EMAIL } from '@/lib/applyAssistance/config';
import { resolveTemplateId, getActiveOffering } from '@/lib/applyAssistance/offering';
import { getPaymentMode } from '@/lib/applyAssistance/lifecycle';
import { estimateGovFeeByCounty } from '@/lib/applyAssistance/govFee';
import { logEvent } from '@/lib/applyAssistance/events';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Safety valve: if something is hammering the form, stop saving leads
// rather than filling the database. (A proper per-IP limit needs a shared
// store such as Upstash — worth adding when traffic justifies it.)
const MAX_LEADS_PER_HOUR = 300;

function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }

    // Honeypot: real people never see or fill this field. Pretend it worked.
    if (typeof body.website === 'string' && body.website.trim() !== '') {
      return NextResponse.json(
        { token: crypto.randomBytes(24).toString('base64url'), mode: 'received', quote: null },
        { status: 201 },
      );
    }

    const requirementName = str(body.requirementName, 200);
    const contactName = str(body.contactName, 100);
    const contactEmail = str(body.contactEmail, 200).toLowerCase();
    const notes = str(body.notes, 1000);
    const phoneE164 = normalizeKenyanPhone(str(body.contactPhone, 30));

    if (!requirementName) {
      return NextResponse.json({ error: 'Tell us what you need help applying for.' }, { status: 400 });
    }
    if (!contactName) {
      return NextResponse.json({ error: 'Please enter your name.' }, { status: 400 });
    }
    if (!phoneE164) {
      return NextResponse.json(
        { error: 'Enter a valid Kenyan mobile number, like 0712 345 678.' },
        { status: 400 },
      );
    }
    if (APPLY_REQUIRE_EMAIL && !contactEmail) {
      return NextResponse.json({ error: 'Please enter your email address.' }, { status: 400 });
    }
    if (contactEmail && !EMAIL_RE.test(contactEmail)) {
      return NextResponse.json({ error: 'That email address does not look right.' }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json(
        { error: 'Please tick the box to confirm we may contact you about this request.' },
        { status: 400 },
      );
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.applyAssistanceRequest.count({ where: { createdAt: { gte: hourAgo } } });
    if (recentCount >= MAX_LEADS_PER_HOUR) {
      return NextResponse.json({ error: 'Too many requests right now. Please try again shortly.' }, { status: 429 });
    }

    // ── Business: name always comes from our own database ────────────────────
    const rawBusinessId = Number(body.businessId);
    let businessId: number | null = null;
    let businessName: string | null = null;
    if (Number.isInteger(rawBusinessId) && rawBusinessId > 0) {
      const business = await prisma.business.findUnique({
        where: { id: rawBusinessId },
        select: { id: true, name: true },
      });
      if (business) {
        businessId = business.id;
        businessName = business.name;
      }
    }

    // ── County: use our canonical record when we can match one ───────────────
    let countyId: number | null = null;
    let countyName: string | null = str(body.countyName, 100) || null;
    const rawCountyId = Number(body.countyId);
    if (Number.isInteger(rawCountyId) && rawCountyId > 0) {
      const county = await prisma.county.findUnique({ where: { id: rawCountyId }, select: { id: true, name: true } });
      if (county) {
        countyId = county.id;
        countyName = county.name;
      }
    } else if (countyName) {
      const county = await prisma.county.findFirst({
        where: { name: { equals: countyName, mode: 'insensitive' } },
        select: { id: true, name: true },
      });
      if (county) {
        countyId = county.id;
        countyName = county.name;
      }
    }

    // ── Price: from the active offering, never from the client ───────────────
    const templateId = await resolveTemplateId({ businessId, requirementName });
    const offering = await getActiveOffering(templateId);
    const paymentMode = getPaymentMode();
    const canPay = !!offering && paymentMode !== 'off';
    // Estimate only — see lib/applyAssistance/govFee.ts.
    const govFee = countyId ? (await estimateGovFeeByCounty({ templateId, businessId }))[countyId] ?? null : null;

    const sourcePathRaw = str(body.sourcePath, 200);
    const sourcePath = sourcePathRaw.startsWith('/') ? sourcePathRaw : null;

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

    // A returning customer shouldn't pile up duplicate open leads for the
    // same requirement — archive the old ones (they stay visible in admin).
    await prisma.applyAssistanceRequest.updateMany({
      where: { contactPhoneE164: phoneE164, requirementName, stage: 'LEAD', archived: false },
      data: { archived: true, nextReminderAt: null },
    });

    const now = new Date();
    const created = await prisma.applyAssistanceRequest.create({
      data: {
        publicToken: crypto.randomBytes(24).toString('base64url'),
        requirementName,
        templateId,
        countyName,
        countyId,
        businessId,
        businessName,
        contactName,
        contactPhone: str(body.contactPhone, 30),
        contactPhoneE164: phoneE164,
        contactEmail: contactEmail || null,
        notes: notes || null,
        contactConsentAt: now,
        serviceFee: offering?.serviceFee ?? null,
        governmentFeeMin: govFee?.low ?? null,
        governmentFeeMax: govFee?.high ?? null,
        currency: offering?.currency ?? 'KES',
        // The abandoned-lead follow-up (a later step) picks up leads whose
        // reminder time has passed. Only people who could actually pay get one.
        nextReminderAt: canPay ? new Date(now.getTime() + 60 * 60 * 1000) : null,
        sourcePath,
        userId,
      },
      select: { id: true, publicToken: true },
    });

    await logEvent(
      prisma,
      created.id,
      'CREATED',
      canPay
        ? 'Request started — details saved, awaiting payment.'
        : 'Request received — no online payment available for this requirement yet.',
      { actor: 'customer' },
    );

    return NextResponse.json(
      {
        token: created.publicToken,
        mode: canPay ? 'pay' : 'received',
        paymentMode,
        contactPhone: formatPhoneLocal(phoneE164),
        contactEmail: contactEmail || null,
        quote: offering
          ? {
              serviceFee: offering.serviceFee,
              currency: offering.currency,
              typicalDaysMin: offering.typicalDaysMin,
              typicalDaysMax: offering.typicalDaysMax,
              whatsIncluded: offering.whatsIncluded,
            }
          : null,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating apply-assistance request:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}