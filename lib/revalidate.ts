// lib/revalidate.ts
//
// Shared helper for invalidating the statically-generated business pages
// after any admin/API action that changes a business's requirements.
// Used by /api/requirements/[id]/businesses/route.ts and
// /api/requirements/route.ts (requirement creation + CSV import), so both
// code paths stay in sync instead of each keeping its own copy that can
// silently drift — which is exactly what happened here: the businesses
// route had this revalidation logic, but the requirements route (used by
// CSV import's businessId-linking path) never did, so CSV-imported
// requirements linked to a business wouldn't appear on the statically
// generated business pages in production until a full rebuild.

import { revalidatePath } from "next/cache";

export function revalidateBusinessPages(slug: string) {
  revalidatePath(`/businesses/${slug}`);
  revalidatePath(`/businesses/${slug}/requirements`);
}