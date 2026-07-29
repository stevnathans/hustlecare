// lib/legalFeeScheduleAdmin.ts
//
// Server-only helpers for the shell-product mechanism. Deliberately kept
// separate from lib/legalFeeSchedule.ts (which stays prisma-free and safe
// to import from client components) — these import prisma directly and
// must never end up in a client bundle.

import { prisma } from '@/lib/prisma';

const COUNTY_GOVERNMENT_VENDOR_SLUG = 'county-government-authority';

/**
 * Finds or creates the single shared "County Government" vendor row.
 * Every county-issued permit's shell product points at this one vendor —
 * the actual displayed name ("County Government of Nairobi") is
 * synthesized at render time from the selected county, not stored here.
 */
export async function ensureCountyGovernmentVendorId(): Promise<number> {
  const existing = await prisma.vendor.findUnique({
    where: { slug: COUNTY_GOVERNMENT_VENDOR_SLUG },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.vendor.create({
    data: {
      name: 'County Government',
      slug: COUNTY_GOVERNMENT_VENDOR_SLUG,
      description:
        'Represents county government authorities issuing county-specific permits and licences. The name shown to visitors is dynamically rendered as "County Government of <County>" based on the county they select — this row is a shared anchor, not a real per-county vendor.',
      isVerified: true,
      status: 'ACTIVE',
    },
  });
  return created.id;
}

/**
 * Finds or creates the one "shell" Product for a county-fee-schedule
 * requirement template. Its price is always null (never shown as a normal
 * product — every existing products query already filters price: { not: null }).
 * Its only job is to give CartItem a real Product row to reference, so
 * adding a county fee to the cart persists like any other product instead
 * of living only in browser memory.
 */
export async function ensureFeeScheduleShellProduct(
  templateId: number,
  templateName: string
): Promise<number> {
  const existing = await prisma.product.findFirst({
    where: { templateId, isFeeScheduleShell: true },
    select: { id: true },
  });
  if (existing) return existing.id;

  const vendorId = await ensureCountyGovernmentVendorId();

  const created = await prisma.product.create({
    data: {
      name: templateName,
      description: `County-issued ${templateName}. Actual price depends on the county and is resolved from the fee schedule.`,
      price: null,
      vendorId,
      templateId,
      status: 'ACTIVE',
      isFeeScheduleShell: true,
    },
  });
  return created.id;
}