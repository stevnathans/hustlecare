// components/DetailsPage/BusinessHeader.tsx
//
// SIZE BAND SELECTOR (replaces the old price-tier control): now a real
// Micro/Small/Medium/Large toggle backed by lib/cost-engine.ts's SizeBand.
// State is owned by the caller (BusinessPageContent), not here — the fee-
// range computation there needs to know the current band before this
// component even renders, so lifting the state up avoids a circular
// dependency. This is honest about where it stands today: the fee-
// schedule dimension is fully live (no new data needed — see
// BusinessPageContent's comments), while the quantity dimension will show
// identical numbers across every band until real per-business quantities
// are entered in the admin (BusinessRequirementQuantity has zero rows
// site-wide right now). The plumbing is correct either way.
//
// "HOW MUCH DOES IT COST" SECTION: removed entirely, per direction — that
// content now lives properly, with real category-by-category numbers, on
// /businesses/{slug}/cost. A plain text link to it sits just after the
// price display, inside the same card, rather than as a section of its
// own or a button.

"use client";
import React, { useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/currency";
import { DEFAULT_MARKET, type MarketCode } from "@/lib/markets";
import { ALL_SIZE_BANDS, type CostSource, type SizeBand } from "@/lib/cost-engine";

interface BusinessHeaderProps {
  businessName: string;
  totalRequirements: number;
  requiredCount: number;
  optionalCount: number;

  unfilteredRequiredLowPrice: number;
  unfilteredRequiredMediumPrice: number;
  unfilteredRequiredHighPrice: number;
  unfilteredLowPrice: number;
  unfilteredMediumPrice: number;
  unfilteredHighPrice: number;

  requiredRequirementsWithProducts: number;
  requirementsWithProducts: number;

  unfilteredStockCount?: number;
  unfilteredStockLowPrice?: number;
  unfilteredStockMedianPrice?: number;
  unfilteredStockHighPrice?: number;

  costSourceRequired?: CostSource;
  costSourceAll?: CostSource;

  /** Which size band the current prices reflect. Owned by the caller. */
  sizeBand: SizeBand;
  onSizeBandChange: (band: SizeBand) => void;

  slug?: string;
  market?: MarketCode;
}

const SIZE_BAND_LABELS: Record<SizeBand, string> = {
  MICRO: 'Micro',
  SMALL: 'Small',
  MEDIUM: 'Medium',
  LARGE: 'Large',
};

const BusinessHeader: React.FC<BusinessHeaderProps> = ({
  businessName,
  totalRequirements,
  requiredCount,
  optionalCount,
  unfilteredRequiredLowPrice,
  unfilteredRequiredMediumPrice,
  unfilteredRequiredHighPrice,
  unfilteredLowPrice,
  unfilteredMediumPrice,
  unfilteredHighPrice,
  requiredRequirementsWithProducts,
  requirementsWithProducts,
  unfilteredStockCount = 0,
  costSourceRequired = 'COMPUTED',
  costSourceAll = 'COMPUTED',
  sizeBand,
  onSizeBandChange,
  slug,
  market = DEFAULT_MARKET,
}) => {
  const [coverageExpanded, setCoverageExpanded] = useState(false);
  const [includeOptional, setIncludeOptional] = useState(false);

  const formatPrice = (price: number) => formatCurrency(price, market);
  const countryPhrase = market === "KE" ? "Kenya" : "the US";

  const activeLowPrice = includeOptional ? unfilteredLowPrice : unfilteredRequiredLowPrice;
  const activeMediumPrice = includeOptional ? unfilteredMediumPrice : unfilteredRequiredMediumPrice;
  const activeHighPrice = includeOptional ? unfilteredHighPrice : unfilteredRequiredHighPrice;
  const activeRequirementCount = includeOptional ? totalRequirements : requiredCount;
  const activeRequirementsWithProducts = includeOptional
    ? requirementsWithProducts
    : requiredRequirementsWithProducts;
  const activeSource = includeOptional ? costSourceAll : costSourceRequired;
  const isEditorialEstimate = activeSource === 'EDITORIAL';

  const hasPricing = activeLowPrice > 0 && activeHighPrice > 0;
  const missingProductsCount = activeRequirementCount - activeRequirementsWithProducts;
  const showCoverageNote = hasPricing && missingProductsCount > 0 && !isEditorialEstimate;
  const hasStock = unfilteredStockCount > 0;
  const hasOptionalItems = optionalCount > 0;

  const costPageHref = slug
    ? market === 'KE'
      ? `/businesses/${slug}/cost`
      : `/us/businesses/${slug}/cost`
    : null;

  return (
    <header>
      <div>
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-3 sm:mb-4 tracking-tight">
            {totalRequirements} Requirements to Start a{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
              {businessName}
            </span>{" "}
            Business in {countryPhrase}
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            Complete requirements, cost estimates, and essential resources to
            start a successful {businessName} business.
          </p>
        </div>

        {hasPricing && (
          <fieldset className="mb-5 sm:mb-6 border-0 p-0 m-0">
            <div className="bg-slate-50 rounded-lg p-4 sm:p-5 shadow-sm">
              <div className="mb-4 sm:mb-5 text-center">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                  {businessName} Business Estimated Cost
                </h2>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  {formatPrice(activeLowPrice)} – {formatPrice(activeHighPrice)}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  {includeOptional
                    ? "Includes required and optional items"
                    : "Required items only"}
                  {hasStock ? " — excludes stock/inventory costs" : ""}
                </p>

                {isEditorialEstimate && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Estimated range — we&apos;re still pricing individual
                    requirements for this business.
                  </p>
                )}

                {hasOptionalItems && (
                  <label className="mt-3 inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeOptional}
                      onChange={(e) => setIncludeOptional(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Include {optionalCount} optional item
                    {optionalCount === 1 ? "" : "s"} in this estimate
                  </label>
                )}
              </div>

              <div className="border-t border-slate-200 mb-4 sm:mb-5" />

              <legend className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4 text-center w-full">
                Business Size
              </legend>

              <div className="grid grid-cols-4 gap-2 mb-3 sm:mb-4">
                {ALL_SIZE_BANDS.map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => onSizeBandChange(band)}
                    aria-pressed={sizeBand === band}
                    aria-label={`Select ${SIZE_BAND_LABELS[band]} business size`}
                    className={`px-2 sm:px-3 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
                      sizeBand === band
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-white text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {SIZE_BAND_LABELS[band]}
                  </button>
                ))}
              </div>

              <div className="text-center p-3 sm:p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-slate-600 mb-1">
                  Estimated cost for a {SIZE_BAND_LABELS[sizeBand].toLowerCase()}-scale{" "}
                  {businessName.toLowerCase()} business
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-700">
                  {formatPrice(activeMediumPrice)}
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
                        Based on{" "}
                        <span className="font-semibold text-slate-600">
                          {activeRequirementsWithProducts}
                        </span>{" "}
                        out of{" "}
                        <span className="font-semibold text-slate-600">
                          {activeRequirementCount}
                        </span>{" "}
                        requirements
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                        className={`w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200 ${
                          coverageExpanded ? "text-emerald-600" : "text-slate-400"
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
                        {missingProductsCount}{" "}
                        {missingProductsCount === 1 ? "requirement does" : "requirements do"}{" "}
                        not have products listed yet and{" "}
                        {missingProductsCount === 1 ? "is" : "are"} not included
                        in this estimate. The actual startup cost may be higher.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Link to the full breakdown — plain text, not a button,
                  placed just after the price display but still inside
                  this card. */}
              {costPageHref && (
                <div className="mt-4 text-center">
                  <Link
                    href={costPageHref}
                    className="text-sm text-emerald-700 hover:text-emerald-800 hover:underline"
                  >
                    See the complete cost breakdown →
                  </Link>
                </div>
              )}
            </div>
          </fieldset>
        )}

        <section
          className="mb-5 sm:mb-6"
          aria-labelledby="requirements-breakdown"
        >
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
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    Total
                  </div>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600 mb-1">
                    {requiredCount}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    Essential
                  </div>
                </div>
                <div className="text-center p-3 bg-amber-50 rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-amber-600 mb-1">
                    {optionalCount}
                  </div>
                  <div className="text-xs sm:text-sm text-slate-600 font-medium">
                    Optional
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </header>
  );
};

export default BusinessHeader;