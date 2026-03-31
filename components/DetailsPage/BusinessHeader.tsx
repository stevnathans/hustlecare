// components/DetailsPage/BusinessHeader.tsx
//
// SEO note: The JSON-LD Service schema that was previously injected here has been
// removed. Client components are hydrated after the initial HTML is sent, so any
// <script type="application/ld+json"> injected from a 'use client' component may
// not be present in the static HTML that crawlers see. The Service schema is now
// emitted by the server component (page.tsx) alongside the Article schema, which
// guarantees it appears in the raw HTML response.

'use client';
import React, { useState } from 'react';

interface BusinessHeaderProps {
  businessName: string;
  unfilteredLowPrice: number;
  unfilteredMediumPrice: number;
  unfilteredHighPrice: number;
  requiredCount: number;
  optionalCount: number;
  totalRequirements: number;
  requirementsWithProducts: number;
}

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  unfilteredLowPrice,
  unfilteredMediumPrice,
  unfilteredHighPrice,
  requiredCount,
  optionalCount,
  totalRequirements,
  requirementsWithProducts,
}) => {
  const [budgetScale, setBudgetScale] = useState<'small' | 'medium' | 'large'>('medium');
  const [coverageExpanded, setCoverageExpanded] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const hasPricing = unfilteredLowPrice > 0 && unfilteredHighPrice > 0;
  const missingProductsCount = totalRequirements - requirementsWithProducts;
  const showCoverageNote = hasPricing && missingProductsCount > 0;

  const budgetScales = {
    small:  { label: 'Small Scale',  price: unfilteredLowPrice },
    medium: { label: 'Medium Scale', price: unfilteredMediumPrice },
    large:  { label: 'Large Scale',  price: unfilteredHighPrice },
  };

  const activeScale = budgetScales[budgetScale];

  return (
    <header>
      <div>
        <div className="text-center mb-6 sm:mb-8">
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

        {hasPricing && (
          <fieldset className="mb-5 sm:mb-6 border-0 p-0 m-0">
            <div className="bg-slate-50 rounded-lg p-4 sm:p-5 shadow-sm">

              {/* ── Cost range overview ─────────────────────────────────────
                  Shows the full small-to-large spread upfront so the user
                  sees the range before interacting with the toggle. */}
              <div className="mb-4 sm:mb-5 text-center">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                  {businessName} Business Estimated Cost
                </h2>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  {formatPrice(unfilteredLowPrice)} – {formatPrice(unfilteredHighPrice)}
                </p>
                
              </div>

              {/* ── Divider ──────────────────────────────────────────────── */}
              <div className="border-t border-slate-200 mb-4 sm:mb-5" />

              {/* ── Scale toggle ─────────────────────────────────────────── */}
              <legend className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 text-center w-full">
                Adjust Your Budget Scenario
              </legend>

              <div className="grid grid-cols-3 gap-2 mb-3 sm:mb-4">
                {(Object.keys(budgetScales) as Array<keyof typeof budgetScales>).map((scale) => (
                  <button
                    key={scale}
                    type="button"
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

              <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Estimated cost for a {activeScale.label.toLowerCase()}{' '}
                  {businessName.toLowerCase()} business
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700">
                  {formatPrice(activeScale.price)}
                </p>

                {showCoverageNote && (
                  <div className="relative mt-2 inline-block">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 rounded"
                      aria-expanded={coverageExpanded}
                      aria-describedby="coverage-tooltip"
                      onClick={() => setCoverageExpanded((v) => !v)}
                      onMouseEnter={() => setCoverageExpanded(true)}
                      onMouseLeave={() => setCoverageExpanded(false)}
                      onFocus={() => setCoverageExpanded(true)}
                      onBlur={() => setCoverageExpanded(false)}
                    >
                      <span>
                        Based on{' '}
                        <span className="font-semibold text-slate-600">
                          {requirementsWithProducts}
                        </span>{' '}
                        out of{' '}
                        <span className="font-semibold text-slate-600">{totalRequirements}</span>{' '}
                        requirements
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${
                          coverageExpanded ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>

                    {coverageExpanded && (
                      <div
                        id="coverage-tooltip"
                        role="tooltip"
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 w-64 rounded-lg bg-white border border-slate-200 shadow-lg p-3 text-xs text-slate-600 text-left leading-relaxed pointer-events-none"
                      >
                        {missingProductsCount}{' '}
                        {missingProductsCount === 1 ? 'requirement does' : 'requirements do'} not
                        have products listed yet and{' '}
                        {missingProductsCount === 1 ? 'is' : 'are'} not included in this estimate.
                        The actual startup cost may be higher.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </fieldset>
        )}

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

        {hasPricing && (
          <section aria-labelledby="cost-section-heading" className="px-2 sm:px-3">
            <div className="text-center mb-5 sm:mb-6">
              <h2
                id="cost-section-heading"
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3 sm:mb-4"
              >
                How Much Does It Cost to Start a {businessName} Business?
              </h2>
              <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-emerald-500 to-blue-500 mx-auto rounded-full" />
            </div>

            <div className="space-y-4 sm:space-y-5 text-slate-700 leading-relaxed">
              <p className="text-sm sm:text-base">
                Starting a <strong>{businessName.toLowerCase()} business</strong> can cost between {' '}
                <span className="font-bold text-emerald-700">
                  {formatPrice(unfilteredLowPrice)}
                </span>{' '}
               to{' '}
                <span className="font-bold text-emerald-700">
                  {formatPrice(unfilteredHighPrice)}
                </span>{' '}
                depending on the specific requirements you need for your business. A {' '}
                <strong>medium-scale {businessName.toLowerCase()} business</strong> will cost around{' '}
                <span className="font-bold text-emerald-700">
                  {formatPrice(unfilteredMediumPrice)}
                </span>
                .
              </p>

              <p className="text-sm sm:text-base">
                {showCoverageNote ? (
                  <>
                    Note that these cost estimates are based on{' '}
                    <span className="font-bold text-blue-700">
                      {requirementsWithProducts} out of {totalRequirements} requirements
                    </span>{' '}
                     — {missingProductsCount}{' '}
                    {missingProductsCount === 1 ? 'requirement does' : 'requirements do'} not 
                    have products yet, so the actual cost may be higher. Out of the total {totalRequirements} requirements,
                    <span className="font-bold text-emerald-700"> {requiredCount} are mandatory</span> for your {businessName.toLowerCase()} business{' '}
                    while{' '}
                    <span className="font-bold text-amber-700">{optionalCount} are optional</span>.
                  </>
                ) : (
                  <>
                    These estimates cover all{' '}
                    <span className="font-bold text-blue-700">{totalRequirements} requirements</span>,
                    including{' '}
                    <span className="font-bold text-emerald-700">{requiredCount} mandatory items</span>{' '}
                    and{' '}
                    <span className="font-bold text-amber-700">{optionalCount} optional ones</span>.
                  </>
                )}{' '}
                
              </p>
            </div>
          </section>
        )}
      </div>
    </header>
  );
};

export default BusinessHeader;