/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/legalFeeScheduleAdmin.ts
//
// Server-only helpers for the county-fee-schedule mechanism. Deliberately
// separate from lib/legalFeeSchedule.ts (which stays prisma-free and safe
// to import from client components) — these import prisma directly and
// must never end up in a client bundle.

import { prisma } from '@/lib/prisma';

/**
 * Finds or creates the single shared "County Government" vendor row.
 * Every county-issued permit's shell product points at this one vendor —
 * the actual displayed name ("County Government of Nairobi") is
 * synthesized at render time from the selected county, not stored here.
 *
 * Looked up by a dedicated, non-editable flag (isCountyGovernmentAuthority)
 * rather than by slug/name — those are editable via the normal vendor
 * profile forms, and relying on them as an identity anchor previously
 * caused a duplicate vendor to be silently created whenever the slug was
 * changed.
 */

export async function ensureCountyGovernmentVendorId(): Promise<number> {
  const existing = await prisma.vendor.findFirst({
    where: { isCountyGovernmentAuthority: true },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.vendor.create({
    data: {
      name: 'County Government',
      slug: 'county-government-authority',
      description: '...',
      isVerified: true,
      status: 'ACTIVE',
      isCountyGovernmentAuthority: true,
    },
  });
  return created.id;
}

export interface FeeScheduleShellProduct {
  id: number;
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
}

/**
 * Finds or creates the one "shell" Product for a county-fee-schedule
 * requirement template. Its price is always null (never shown as a normal
 * product — every existing products query already filters price: { not: null }).
 * Its only job is to give CartItem a real Product row to reference, so
 * adding a county fee to the cart persists like any other product instead
 * of living only in browser memory. Name/description/image/url are all
 * admin-editable via the normal product edit form.
 */
export async function ensureFeeScheduleShellProduct(
  templateId: number,
  templateName: string
): Promise<FeeScheduleShellProduct> {
  const existing = await prisma.product.findFirst({
    where: { templateId, isFeeScheduleShell: true },
    select: { id: true, name: true, description: true, image: true, url: true },
  });
  if (existing) return existing;

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
    select: { id: true, name: true, description: true, image: true, url: true },
  });
  return created;
}

/**
 * Shared pricing-mode resolver for the admin fee-schedule routes.
 * `usePriceRange: true` expects priceMin/priceMax (min <= max);
 * otherwise expects a single `price`. Returns exactly one mode
 * populated — never both — matching the schema's invariant that a
 * LegalFeeSchedule row is either fixed-price or a range, never both.
 */
export function resolveFeePricingFromBody(body: Record<string, any>):
  | { error: string }
  | { price: number | null; priceMin: number | null; priceMax: number | null } {
  const usePriceRange = !!body.usePriceRange;

  if (usePriceRange) {
    const min = body.priceMin != null && body.priceMin !== '' ? Number(body.priceMin) : NaN;
    const max = body.priceMax != null && body.priceMax !== '' ? Number(body.priceMax) : NaN;
    if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0) {
      return { error: 'Enter a valid price range.' };
    }
    if (min > max) {
      return { error: 'Minimum price cannot exceed maximum price.' };
    }
    return { price: null, priceMin: min, priceMax: max };
  }

  const price = body.price != null && body.price !== '' ? Number(body.price) : NaN;
  if (Number.isNaN(price) || price < 0) {
    return { error: 'Enter a valid price.' };
  }
  return { price, priceMin: null, priceMax: null };
}