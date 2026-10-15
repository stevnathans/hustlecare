// lib/services/validate.ts
//
// Validates what the admin catalog form sends. Nothing from the browser is
// trusted: every number is range-checked and every string is trimmed and
// length-limited before it reaches the database.

import type { ServiceCategory } from '@prisma/client';

export interface PackageInput {
  id?: number;
  key: string;
  name: string;
  tag: string | null;
  price: number;
  depositPercent: number;
  turnaroundMinDays: number | null;
  turnaroundMaxDays: number | null;
  revisionRounds: number;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
}

export interface DocInput {
  id?: number;
  label: string;
  description: string | null;
  isRequired: boolean;
}

export interface ServiceInput {
  name: string;
  shortDescription: string;
  emoji: string;
  category: ServiceCategory;
  ctaLabel: string;
  isActive: boolean;
  displayOrder: number;
  packages: PackageInput[];
  documents: DocInput[];
}

export class ValidationError extends Error {}

const CATEGORIES: ServiceCategory[] = ['PLANNING', 'LEGAL', 'BRANDING', 'DIGITAL'];
const KEY_RE = /^[a-z0-9-]{2,30}$/;
export const SLUG_RE = /^[a-z0-9-]{3,60}$/;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

function optionalDays(v: unknown, label: string): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1 || n > 365) throw new ValidationError(`${label} must be a whole number between 1 and 365.`);
  return n;
}

export function parseServiceInput(body: unknown): { ok: true; data: ServiceInput } | { ok: false; error: string } {
  try {
    const b = (body ?? {}) as Record<string, unknown>;

    const name = text(b.name, 80);
    if (!name) throw new ValidationError('Give the service a name.');
    const shortDescription = text(b.shortDescription, 200);
    if (!shortDescription) throw new ValidationError('Add a one-line description.');
    if (!CATEGORIES.includes(b.category as ServiceCategory)) throw new ValidationError('Choose a category.');

    const displayOrder = Number(b.displayOrder ?? 0);
    if (!Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10_000) {
      throw new ValidationError('Display order must be a whole number.');
    }

    const rawPackages = Array.isArray(b.packages) ? b.packages : [];
    if (rawPackages.length > 8) throw new ValidationError('A service can have at most 8 packages.');

    const seenKeys = new Set<string>();
    const packages: PackageInput[] = rawPackages.map((raw) => {
      const p = raw as Record<string, unknown>;
      const key = text(p.key, 30).toLowerCase();
      if (!KEY_RE.test(key)) throw new ValidationError('Each package key must be 2–30 letters, numbers or dashes (e.g. starter).');
      if (seenKeys.has(key)) throw new ValidationError(`The package key "${key}" is used twice.`);
      seenKeys.add(key);

      const pkgName = text(p.name, 60);
      if (!pkgName) throw new ValidationError('Every package needs a name.');

      const price = Number(p.price);
      if (!Number.isFinite(price) || price <= 0 || price > 10_000_000) {
        throw new ValidationError(`Enter a price above 0 for "${pkgName}".`);
      }

      const depositPercent = Number(p.depositPercent);
      if (!Number.isInteger(depositPercent) || depositPercent < 1 || depositPercent > 100) {
        throw new ValidationError(`The deposit for "${pkgName}" must be a whole number from 1 to 100.`);
      }

      const minDays = optionalDays(p.turnaroundMinDays, `Turnaround for "${pkgName}"`);
      const maxDays = optionalDays(p.turnaroundMaxDays, `Turnaround for "${pkgName}"`);
      if (minDays !== null && maxDays !== null && minDays > maxDays) {
        throw new ValidationError(`For "${pkgName}", the shortest turnaround can't be longer than the longest.`);
      }

      const revisionRounds = Number(p.revisionRounds ?? 1);
      if (!Number.isInteger(revisionRounds) || revisionRounds < 0 || revisionRounds > 10) {
        throw new ValidationError(`Revision rounds for "${pkgName}" must be between 0 and 10.`);
      }

      const features = (Array.isArray(p.features) ? p.features : [])
        .filter((f): f is string => typeof f === 'string')
        .map((f) => f.trim().slice(0, 120))
        .filter(Boolean)
        .slice(0, 20);

      return {
        id: Number.isInteger(p.id) ? (p.id as number) : undefined,
        key,
        name: pkgName,
        tag: text(p.tag, 60) || null,
        price,
        depositPercent,
        turnaroundMinDays: minDays,
        turnaroundMaxDays: maxDays,
        revisionRounds,
        features,
        isPopular: p.isPopular === true,
        isActive: p.isActive !== false,
      };
    });

    const rawDocs = Array.isArray(b.documents) ? b.documents : [];
    if (rawDocs.length > 20) throw new ValidationError('A service can ask for at most 20 files.');
    const documents: DocInput[] = rawDocs.map((raw) => {
      const d = raw as Record<string, unknown>;
      const label = text(d.label, 100);
      if (!label) throw new ValidationError('Every file we ask for needs a name.');
      return {
        id: Number.isInteger(d.id) ? (d.id as number) : undefined,
        label,
        description: text(d.description, 200) || null,
        isRequired: d.isRequired === true,
      };
    });

    return {
      ok: true,
      data: {
        name,
        shortDescription,
        emoji: text(b.emoji, 8),
        category: b.category as ServiceCategory,
        ctaLabel: text(b.ctaLabel, 40) || 'Get started',
        isActive: b.isActive !== false,
        displayOrder,
        packages,
        documents,
      },
    };
  } catch (err) {
    if (err instanceof ValidationError) return { ok: false, error: err.message };
    throw err;
  }
}