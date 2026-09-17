// app/businesses/[slug]/cost/CostCategoryBreakdown.tsx
//
// Server component — no interactivity, so it renders directly from
// page.tsx's fetched data with no client boundary needed. This is the
// "extensive breakdown" the /cost page exists to provide: every category,
// every priced requirement within it, linked back to its own
// /requirements/{slug} page where one exists.

import Link from 'next/link';
import { formatMoneyRange } from '@/lib/currency';
import type { MarketCode } from '@/lib/markets';
import type { CategoryBreakdown, CostLine, CostRecurrence } from '@/lib/cost-engine';

interface CostCategoryBreakdownProps {
  categories: CategoryBreakdown[];
  lines: CostLine[];
  market: MarketCode;
  businessSlug: string;
}

/** Same slugify used by CategorySection.tsx's section ids — kept in sync manually, same as that file's own note about categorySlug duplication elsewhere. */
function categoryAnchor(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function recurrenceLabel(recurrence: CostRecurrence): string | null {
  if (recurrence === 'MONTHLY') return 'Monthly';
  if (recurrence === 'ANNUAL') return 'Annual';
  return null;
}

export default function CostCategoryBreakdown({
  categories,
  lines,
  market,
  businessSlug,
}: CostCategoryBreakdownProps) {
  const linesByCategory = new Map<string, CostLine[]>();
  for (const line of lines) {
    if (!linesByCategory.has(line.category)) linesByCategory.set(line.category, []);
    linesByCategory.get(line.category)!.push(line);
  }

  const visibleCategories = categories.filter((c) => c.lineCount > 0);
  if (visibleCategories.length === 0) return null;

  return (
    <div className="space-y-6">
      {visibleCategories.map((category) => {
        const categoryLines = linesByCategory.get(category.name) ?? [];
        return (
          <div key={category.name} className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-50 px-5 py-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{category.name}</h3>
                <p className="text-xs text-slate-500">
                  {category.linesWithPricing} of {category.lineCount} priced
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-slate-900">{formatMoneyRange(category.oneTime, market)}</p>
                {category.monthlyRecurring.high > 0 && (
                  <p className="text-xs text-slate-500">
                    + {formatMoneyRange(category.monthlyRecurring, market)}/mo
                  </p>
                )}
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {categoryLines.map((line) => {
                const recurrence = recurrenceLabel(line.recurrence);
                const nameContent = line.slug ? (
                  <Link
                    href={`/requirements/${line.slug}`}
                    className="font-medium text-slate-800 hover:text-emerald-700 hover:underline"
                  >
                    {line.name}
                  </Link>
                ) : (
                  <span className="font-medium text-slate-800">{line.name}</span>
                );

                return (
                  <li key={line.requirementId} className="px-5 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {nameContent}
                        {line.quantity > 1 && (
                          <span className="text-xs text-slate-400">× {line.quantity}</span>
                        )}
                        {recurrence && (
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {recurrence}
                          </span>
                        )}
                        {!line.isRequired && (
                          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {line.hasPricing ? (
                        <span className="text-sm font-semibold text-slate-800">
                          {formatMoneyRange(line.total, market)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Not priced yet</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 text-right">
              <Link
                href={`/businesses/${businessSlug}/requirements#${categoryAnchor(category.name)}`}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Browse {category.name} products →
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}