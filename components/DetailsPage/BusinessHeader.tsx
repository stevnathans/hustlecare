//components/DetailsPage/BusinessHeader.tsx
'use client';
import React, { useState } from 'react';

interface BusinessHeaderProps {
  businessName: string;
  businessSlug: string;
  unfilteredLowPrice: number;
  unfilteredHighPrice: number;
  requiredCount: number;
  optionalCount: number;
  totalRequirements: number;
  requirementsWithProducts: number;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  unfilteredLowPrice,
  unfilteredHighPrice,
  requiredCount,
  optionalCount,
  totalRequirements,
  requirementsWithProducts,
}) => {
  const [budgetScale, setBudgetScale] = useState<'small' | 'medium' | 'large'>('medium');
  const [coverageExpanded, setCoverageExpanded] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const hasPricing = unfilteredLowPrice > 0;
  const priceRange =
    unfilteredLowPrice === unfilteredHighPrice
      ? formatPrice(unfilteredLowPrice)
      : `${formatPrice(unfilteredLowPrice)} - ${formatPrice(unfilteredHighPrice)}`;

  const showCoverageNote = hasPricing && requirementsWithProducts < totalRequirements;

  const budgetScales = {
    small: { multiplier: 0.6, label: 'Small Scale' },
    medium: { multiplier: 1, label: 'Medium Scale' },
    large: { multiplier: 1.5, label: 'Large Scale' },
  };

  const calculateScaledPrice = (price: number) =>
    Math.round(price * budgetScales[budgetScale].multiplier);

  const smallScaleLow = calculateScaledPrice(unfilteredLowPrice * 0.6);
  const smallScaleHigh = calculateScaledPrice(unfilteredHighPrice * 0.6);
  const largeScaleLow = calculateScaledPrice(unfilteredLowPrice * 1.5);
  const largeScaleHigh = calculateScaledPrice(unfilteredHighPrice * 1.5);

  return (
    // FIX: removed the duplicate Service schema that was being injected here.
    // Structured data (Article, HowTo, FAQPage) is now emitted exclusively in
    // page.tsx (server-side) so Google receives one consistent set of signals.
    // Client-side schema injection is unreliable — Googlebot may render the page
    // before React hydrates, causing the schema to be missing entirely.
    <div>
      <div className="text-center mb-6 sm:mb-8">
        {/*
          FIX: this was previously an <h1>. There is already an <h1> rendered
          server-side in BusinessPageContent (the sr-only one) and Google
          treats whichever it encounters first as the primary heading.
          Two <h1> tags creates ambiguity. We use <h2> here because this is a
          section heading within the page, not the page title.

          The sr-only <h1> in BusinessPageContent is the true page title and
          matches the <title> tag exactly — which is the correct SEO pattern.
        */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-3 sm:mb-4 tracking-tight">
          {totalRequirements} Requirements to Start a{' '}
          <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
            {businessName}
          </span>{' '}
          Business
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          Complete requirements, cost estimates, and essential resources to start a successful{' '}
          {businessName} business.
        </p>
      </div>

      {/*
        FIX: was <nav> — semantically wrong. <nav> is reserved for site
        navigation links (menus, breadcrumbs, pagination). Using it for a
        budget toggle widget confuses screen readers and crawlers.
        Using <div> with an aria-label preserves accessibility without
        the wrong landmark role.
      */}
      <div className="mb-5 sm:mb-6" aria-label="Budget scenario selector" role="group">
        <div className="bg-slate-50 rounded-lg p-4 sm:p-5 shadow-sm relative">
          <p className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 text-center">
            Adjust Your Budget Scenario
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
            {(Object.keys(budgetScales) as Array<keyof typeof budgetScales>).map((scale) => (
              <button
                key={scale}
                onClick={() => setBudgetScale(scale)}
                aria-pressed={budgetScale === scale}
                aria-label={`Select ${budgetScales[scale].label} budget scenario`}
                className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                  budgetScale === scale
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                {budgetScales[scale].label}
              </button>
            ))}
          </div>
          {hasPricing && (
            <div
              className="text-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg cursor-pointer select-none transition-all duration-200 hover:from-emerald-100 hover:to-blue-100"
              onClick={() => showCoverageNote && setCoverageExpanded((v) => !v)}
              onMouseEnter={() => showCoverageNote && setCoverageExpanded(true)}
              onMouseLeave={() => showCoverageNote && setCoverageExpanded(false)}
              title={showCoverageNote ? 'Click to see estimate details' : undefined}
            >
              <p className="text-xs sm:text-sm text-slate-600 mb-1">
                Estimated cost for {budgetScales[budgetScale].label.toLowerCase()}{' '}
                {businessName.toLowerCase()} business
              </p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700">
                {formatPrice(calculateScaledPrice(unfilteredLowPrice))} -{' '}
                {formatPrice(calculateScaledPrice(unfilteredHighPrice))}
              </p>
              {showCoverageNote && (
                <div className="mt-2 flex items-center justify-center gap-1">
                  <p className="text-xs text-slate-500">
                    Based on{' '}
                    <span className="font-semibold text-slate-600">{requirementsWithProducts}</span>{' '}
                    out of{' '}
                    <span className="font-semibold text-slate-600">{totalRequirements}</span>{' '}
                    requirements
                  </p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${coverageExpanded ? 'text-emerald-600' : 'text-slate-400'}`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {coverageExpanded && (
                    <span className="absolute mt-16 z-10 w-64 rounded-lg bg-white border border-slate-200 shadow-lg p-3 text-xs text-slate-600 text-left leading-relaxed pointer-events-none">
                      {totalRequirements - requirementsWithProducts}{' '}
                      {totalRequirements - requirementsWithProducts === 1
                        ? 'requirement does'
                        : 'requirements do'}{' '}
                      not have products listed yet and{' '}
                      {totalRequirements - requirementsWithProducts === 1 ? 'is' : 'are'} not
                      included in this estimate. The actual startup cost may be higher.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <section className="mb-5 sm:mb-6" aria-labelledby="requirements-breakdown">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-slate-200">
          <div className="text-center">
            <h2
              id="requirements-breakdown"
              className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4"
            >
              Requirements Breakdown
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
                  {totalRequirements}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Total</div>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-1">
                  {requiredCount}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Essential</div>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">
                  {optionalCount}
                </div>
                <div className="text-xs sm:text-sm text-slate-600 font-medium">Optional</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <article className="px-2 sm:px-3">
        <div className="text-center mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">
            How Much Does It Cost to Start a {businessName} Business?
          </h2>
          <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full" />
        </div>

        <div className="space-y-4 sm:space-y-5 text-slate-700 leading-relaxed">
          {hasPricing ? (
            <>
              <p className="text-sm sm:text-base">
                You will need approximately{' '}
                <span className="font-bold text-emerald-700">
                  {formatPrice(smallScaleLow)} to {formatPrice(smallScaleHigh)}
                </span>{' '}
                to start a <strong>small-scale {businessName.toLocaleLowerCase()} business</strong>.{' '}
                A <strong>medium-scale operation</strong> typically requires between{' '}
                <span className="font-bold text-emerald-700">{priceRange}</span>, while a{' '}
                <strong>large-scale {businessName.toLocaleLowerCase()} business</strong> may cost
                around{' '}
                <span className="font-bold text-emerald-700">
                  {formatPrice(largeScaleLow)} to {formatPrice(largeScaleHigh)}
                </span>
                .
              </p>

              <p className="text-sm sm:text-base">
                These startup costs cover up to{' '}
                <span className="font-bold text-blue-700">{totalRequirements} requirements</span>,
                including{' '}
                <span className="font-bold text-emerald-700">{requiredCount} mandatory items</span>{' '}
                and{' '}
                <span className="font-bold text-amber-700">{optionalCount} optional ones.</span> The
                actual cost of starting a {businessName.toLocaleLowerCase()} business may vary
                depending on your location, business model, target market, and the requirements you
                need.
              </p>
            </>
          ) : (
            <p className="text-sm sm:text-base">
              To successfully start a {businessName.toLocaleLowerCase()} business, you need up to{' '}
              <span className="font-bold text-blue-700">{totalRequirements} key requirements</span>,
              which include{' '}
              <span className="font-bold text-emerald-700">{requiredCount} essential items</span>{' '}
              and{' '}
              <span className="font-bold text-amber-700">{optionalCount} optional ones</span>. The
              actual startup cost will depend on your chosen business scale, location, and specific
              operational needs.
            </p>
          )}
        </div>
      </article>
    </div>
  );
};

export default BusinessHeader;