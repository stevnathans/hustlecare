// app/requirements/[slug]/RequirementPageContent.tsx
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, ShieldCheck } from 'lucide-react';
import type { RequirementDetail } from '@/lib/requirement-data';

interface Props {
  requirement: RequirementDetail;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTypeLabel(type: string | null): string | null {
  if (!type) return null;
  return type.charAt(0) + type.slice(1).toLowerCase();
}

function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatProductPrice(product: RequirementDetail['products'][number]): string | null {
  if (product.price != null) return formatKES(product.price);
  if (product.priceMin != null && product.priceMax != null) {
    return `${formatKES(product.priceMin)} – ${formatKES(product.priceMax)}`;
  }
  if (product.priceMin != null) return `From ${formatKES(product.priceMin)}`;
  return null;
}

function formatFeePrice(fee: RequirementDetail['feeSchedules'][number]): string {
  if (fee.price != null) return formatKES(fee.price);
  if (fee.priceMin != null && fee.priceMax != null) {
    return `${formatKES(fee.priceMin)} – ${formatKES(fee.priceMax)}`;
  }
  if (fee.priceMin != null) return `From ${formatKES(fee.priceMin)}`;
  return 'Contact county office';
}

function formatVerifiedDate(date: Date | string | null): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const CATEGORY_TO_BUSINESS_SUBPAGE: Record<string, string> = {
  Equipment: 'requirements',
  Software: 'requirements',
  Documents: 'requirements',
  Legal: 'requirements',
  Branding: 'requirements',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function RequirementPageContent({ requirement }: Props) {
  const {
    name,
    description,
    image,
    category,
    type,
    isCountyFeeSchedule,
    sourceName,
    sourceUrl,
    verifiedAt,
    businessSummaries,
    products,
    feeSchedules,
    related,
  } = requirement;

  const typeLabel = formatTypeLabel(type);
  const verifiedLabel = formatVerifiedDate(verifiedAt);
  const hasTrustInfo = Boolean(sourceName || sourceUrl || verifiedLabel);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/requirements" className="inline-flex items-center gap-1 hover:text-emerald-600 transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Requirements
            </Link>
          </nav>

          <div className="flex items-start gap-6 flex-wrap sm:flex-nowrap">
            {image && (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0">
                <Image src={image} alt={name} fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {category}
                </span>
                {typeLabel && (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                    {typeLabel}
                  </span>
                )}
                {isCountyFeeSchedule && (
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100">
                    County fee varies
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight mb-3">
                {name}
              </h1>
              {description && (
                <p className="text-gray-600 text-base leading-relaxed max-w-2xl">{description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── Businesses that need this ── */}
        {businessSummaries.length > 0 && (
          <section aria-labelledby="businesses-heading">
            <h2 id="businesses-heading" className="text-xl font-bold text-gray-900 mb-1">
              Businesses that need {name}
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              {businessSummaries.length} business type{businessSummaries.length !== 1 ? 's' : ''} in Kenya {businessSummaries.length !== 1 ? 'require' : 'requires'} this.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {businessSummaries.map((b) => (
                <Link
                  key={b.id}
                  href={`/businesses/${b.slug}`}
                  className="group flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition-all"
                >
                  {b.image ? (
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={b.image} alt={b.name} fill className="object-cover" sizes="40px" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors truncate">
                      {b.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.necessity}
                      {b.categoryName ? ` · ${b.categoryName}` : ''}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── County fee schedule ── */}
        {isCountyFeeSchedule && feeSchedules.length > 0 && (
          <section aria-labelledby="fees-heading">
            <h2 id="fees-heading" className="text-xl font-bold text-gray-900 mb-1">
              {name} cost by county
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Prices are set by individual county governments and can change — always confirm with the issuing office before paying.
            </p>
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">County</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Cost</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Applies to</th>
                      <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Apply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeSchedules.map((fee) => (
                      <tr key={fee.id} className="border-b border-gray-50 last:border-0">
                        <td className="px-5 py-3 font-medium text-gray-800">{fee.county.name}</td>
                        <td className="px-5 py-3 text-gray-700">{formatFeePrice(fee)}</td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {fee.tradeClass?.name || fee.businessCategory?.name || 'All businesses'}
                        </td>
                        <td className="px-5 py-3">
                          {fee.applyUrl ? (
                            <a
                              href={fee.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 text-xs font-semibold"
                            >
                              Apply
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── Products ── */}
        {products.length > 0 && (
          <section aria-labelledby="products-heading">
            <h2 id="products-heading" className="text-xl font-bold text-gray-900 mb-5">
              {name} — options to buy
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => {
                const price = formatProductPrice(product);
                const card = (
                  <div className="flex gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-emerald-300 hover:shadow-sm transition-all h-full">
                    {product.image ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="64px" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-50 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{product.name}</p>
                      {product.vendor && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          {product.vendor.name}
                          {product.vendor.isVerified && (
                            <ShieldCheck className="w-3 h-3 text-emerald-500" aria-label="Verified vendor" />
                          )}
                        </p>
                      )}
                      {price && (
                        <p className="text-sm font-bold text-emerald-700 mt-1.5">{price}</p>
                      )}
                    </div>
                  </div>
                );
                return product.url ? (
                  <a key={product.id} href={product.url} target="_blank" rel="noopener noreferrer">
                    {card}
                  </a>
                ) : (
                  <div key={product.id}>{card}</div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Related requirements ── */}
        {related.length > 0 && (
          <section aria-labelledby="related-heading">
            <h2 id="related-heading" className="text-xl font-bold text-gray-900 mb-5">
              Related requirements
            </h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/requirements/${r.slug}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Source / verification ── */}
        {hasTrustInfo && (
          <section
            aria-label="Source and verification"
            className="bg-gray-100/70 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-500"
          >
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {verifiedLabel && <span>Last verified {verifiedLabel}</span>}
              {sourceName && (
                <span>
                  Source: {sourceUrl ? (
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      {sourceName}
                    </a>
                  ) : (
                    <span className="text-gray-600 font-medium">{sourceName}</span>
                  )}
                </span>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}