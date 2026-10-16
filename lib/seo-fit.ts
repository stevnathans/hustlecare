export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** First candidate within `max`; if none fit, the last (shortest) one. */
export function pickWithinLimit(candidates: string[], max: number): string {
  return candidates.find((c) => c.length <= max) ?? candidates[candidates.length - 1];
}