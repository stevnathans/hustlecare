// lib/vendor-utils.ts
import { prisma } from '@/lib/prisma';
import { createSlug } from '@/lib/utils';

const LOWER_EXCEPTIONS = new Set([
  'a', 'an', 'and', 'as', 'at', 'but', 'by', 'for',
  'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'with',
]);

/** "acme hardware & tools" -> "Acme Hardware & Tools" */
export function toTitleCase(input: string): string {
  const words = input.trim().toLowerCase().split(/\s+/);
  return words
    .map((word, i) => {
      if (i !== 0 && i !== words.length - 1 && LOWER_EXCEPTIONS.has(word)) return word;
      // Handles hyphenated names like "m-pesa" -> "M-Pesa"
      return word
        .split('-')
        .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
        .join('-');
    })
    .join(' ');
}

/**
 * Generates a slug guaranteed unique against both live Vendor slugs and
 * any pending/approved VendorApplication slug (which will become a Vendor
 * slug once approved). Appends -2, -3, ... on collision.
 */
export async function generateUniqueVendorSlug(name: string, preferredSlug?: string): Promise<string> {
  const root = createSlug(preferredSlug?.trim() || name) || 'vendor';
  let candidate = root;
  let suffix = 2;

  while (await slugInUse(candidate)) {
    candidate = `${root}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

async function slugInUse(slug: string): Promise<boolean> {
  const [vendor, application] = await Promise.all([
    prisma.vendor.findUnique({ where: { slug }, select: { id: true } }),
    prisma.vendorApplication.findFirst({
      where: { slug, status: { in: ['PENDING', 'APPROVED'] } },
      select: { id: true },
    }),
  ]);
  return !!vendor || !!application;
}