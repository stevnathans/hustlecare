// lib/requirement-description.ts
//
// Resolves which description to show for a requirement template, given the
// current market. Deliberately narrow — most templates never set
// descriptionUS and this just falls through to the generic description.
//
// Resolution order (composed by the caller, not this function):
//   1. BusinessRequirement.descriptionOverride (business-specific, existing)
//   2. selectTemplateDescription() below (market-specific, new)
//   3. null (caller's own final fallback, if any)
//
// This function only handles step 2 — callers still apply their own
// descriptionOverride check before/after, exactly as they did before this
// feature existed, so nothing about the existing override behavior changes.

import type { MarketCode } from '@/lib/markets';

export function selectTemplateDescription(
  template: { description: string | null; descriptionUS?: string | null },
  market: MarketCode
): string | null {
  if (market === 'US' && template.descriptionUS) {
    return template.descriptionUS;
  }
  return template.description ?? null;
}