// lib/slugify.ts
//
// Shared slugify + uniqueness-resolution helpers for RequirementTemplate
// slugs, used by both the admin API routes (auto-generating a slug when
// one isn't supplied, or re-generating one on rename) and the one-off
// backfill script for existing rows. Kept as a standalone module with no
// Prisma import of its own — callers pass in their own lookup function —
// so it's safe to use from anywhere without pulling in a Prisma Client
// dependency chain.

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Given a desired base slug and a lookup function that reports whether a
 * candidate slug is already taken, returns the first available slug — the
 * base slug itself if free, otherwise `base-2`, `base-3`, and so on.
 *
 * The caller's `isTaken` function is responsible for any "exclude the
 * current row" logic needed during an update (see
 * app/api/requirements/[id]/route.ts, which excludes the template's own
 * id so renaming back to a slug it already owns doesn't falsely collide).
 */
export async function resolveUniqueSlug(
  baseSlug: string,
  isTaken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 2;
  while (await isTaken(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}