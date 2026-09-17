// app/businesses/[slug]/cost/CountyFeeTable.tsx
//
// Renders every county's resolved price for every county-fee requirement
// this business has (Business Permit, Health Certificate, etc.) — the
// single highest-value, hardest-to-replicate content on this page. Server
// component, no interactivity, so it renders directly from page.tsx's
// already-fetched data.

import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import type { MarketCode } from '@/lib/markets';
import type { CountyFeeTableRow } from '@/lib/cost-data';

interface CountyFeeTableProps {
  rows: CountyFeeTableRow[];
  market: MarketCode;
  businessSlug: string;
}

function priceCell(row: CountyFeeTableRow, market: MarketCode): string {
  const r = row.resolution;
  if (r.status === 'exact') return formatCurrency(r.price, market);
  if (r.status === 'range') return `${formatCurrency(r.lowPrice, market)} – ${formatCurrency(r.highPrice, market)}`;
  return '—';
}

function verifiedLabel(row: CountyFeeTableRow, market: MarketCode): string | null {
  const r = row.resolution;
  const matchedRow = r.status === 'exact' || r.status === 'range' ? r.matchedRow : undefined;
  if (!matchedRow?.verifiedAt) return null;
  const locale = market === 'KE' ? 'en-KE' : 'en-US';
  return new Date(matchedRow.verifiedAt).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CountyFeeTable({ rows, market, businessSlug }: CountyFeeTableProps) {
  if (rows.length === 0) return null;

  const byRequirement = new Map<string, CountyFeeTableRow[]>();
  for (const row of rows) {
    if (!byRequirement.has(row.requirementName)) byRequirement.set(row.requirementName, []);
    byRequirement.get(row.requirementName)!.push(row);
  }

  return (
    <div className="space-y-8">
      {Array.from(byRequirement.entries()).map(([requirementName, countyRows]) => {
        const sorted = [...countyRows].sort((a, b) => a.countyName.localeCompare(b.countyName));
        const requirementSlug = sorted[0]?.requirementSlug;

        return (
          <div key={requirementName}>
            <h3 className="font-semibold text-slate-900 mb-1">
              {requirementSlug ? (
                <Link href={`/requirements/${requirementSlug}`} className="hover:text-emerald-700 hover:underline">
                  {requirementName}
                </Link>
              ) : (
                requirementName
              )}{' '}
              <span className="font-normal text-sm text-slate-500">by county</span>
            </h3>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-2 font-semibold text-slate-600">County</th>
                    <th className="px-4 py-2 font-semibold text-slate-600 text-right">Fee</th>
                    <th className="px-4 py-2 font-semibold text-slate-600 text-right">Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sorted.map((row) => {
                    const verified = verifiedLabel(row, market);
                    return (
                      <tr key={row.countyId}>
                        <td className="px-4 py-2 text-slate-800">{row.countyName}</td>
                        <td className="px-4 py-2 text-right font-medium text-slate-900">
                          {priceCell(row, market)}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-slate-400">
                          {verified ?? 'Not yet verified'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-slate-500">
        Select your county on the{' '}
        <Link href={`/businesses/${businessSlug}/requirements`} className="text-emerald-700 hover:underline">
          requirements page
        </Link>{' '}
        to see the exact fee for your location and apply directly.
      </p>
    </div>
  );
}