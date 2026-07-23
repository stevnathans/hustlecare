// lib/buyAction.ts
//
// Buy-button label per category — Legal permits get "Apply", software gets
// "Subscribe", everything else defaults to "Buy Now". Same lookup pattern
// as necessityStyle() in lib/necessity.ts.

const BUY_ACTION_LABELS: Record<string, string> = {
  Legal: 'Apply',
  Software: 'Subscribe',
};

const DEFAULT_BUY_ACTION_LABEL = 'Buy Now';

export function getBuyActionLabel(category: string): string {
  return BUY_ACTION_LABELS[category] ?? DEFAULT_BUY_ACTION_LABEL;
}