/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useMemo, useState } from 'react';
import CostCalculator from '@/components/CostCalculator';
import BusinessHeader from '@/components/DetailsPage/BusinessHeader';
import RequirementsSection, { type CategoryLinkInfo } from '@/components/DetailsPage/RequirementsSection';
import { CountyProvider, useCounty } from '@/contexts/CountyContext';
import {
  useBusinessData,
  type Business as BusinessData,
  type Requirement as RequirementData,
} from 'hooks/useBusinessData';
import { useFilterState, type FeeRange } from 'hooks/useFilterState';
import { Product as ProductType } from '@/types';
import {
  resolveFeeSchedule,
  resolveFeeScheduleAcrossCounties,
  feeResolutionToRange,
  FeeScheduleResolution,
} from '@/lib/legalFeeSchedule';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';
import { DEFAULT_SIZE_BAND, type RequirementsPageCostSummary, type SizeBand } from '@/lib/cost-engine';
import Link from 'next/link';

interface Faq {
  question: string;
  answer: string;
}

interface BusinessPageContentProps {
  slug: string;
  initialBusiness?: BusinessData;
  initialRequirements?: RequirementData[];
  faqs?: Faq[];
  // Which market this page is rendering for. Defaults to Kenya to match
  // every other file's pre-existing default — but every caller (the KE
  // and US requirements/hub page routes) should pass this explicitly.
  // Drives: which market's requirements/products useBusinessData fetches
  // on any client-side re-fetch, whether the county selector renders at
  // all (Kenya-only concept), and which currency the cost calculator uses.
  market?: MarketCode;
  // Stage 4.5 — per-category links to that category's own checklist
  // sub-page, computed server-side (see the requirements page components
  // that build this via lib/business-data.ts's groupRequirementsByCategory)
  // and threaded straight through to RequirementsSection, which passes
  // the relevant entry to each CategorySection as it renders.
  categoryLinks?: Record<string, CategoryLinkInfo>;
  // Server-computed headline cost figures, PER SIZE BAND (see
  // lib/cost-data.ts#getRequirementsPageCostSummary), rendered as real
  // numbers in the initial HTML. useFilterState uses the entry for the
  // selected band as a fallback ONLY until useBusinessData's own
  // client-side product fetch resolves — see hooks/useFilterState.ts.
  initialCost?: Record<SizeBand, RequirementsPageCostSummary> | null;
}

function vendorServesCounty(vendor: any, countyId: number): boolean {
  if (!vendor) return false;
  if (vendor.servesAllCounties) return true;
  return (vendor.counties ?? []).some((vc: any) => vc.countyId === countyId);
}

function countyPriority(vendor: any, countyId: number): number {
  if (!vendor) return 1;
  if (vendor.servesAllCounties) return 1;
  const serves = (vendor.counties ?? []).some((vc: any) => vc.countyId === countyId);
  return serves ? 0 : 2;
}

function BusinessPageContentInner({
  slug,
  initialBusiness,
  initialRequirements,
  faqs,
  market = DEFAULT_MARKET,
  categoryLinks,
  initialCost = null,
}: Required<Pick<BusinessPageContentProps, 'market'>> & Omit<BusinessPageContentProps, 'market'>) {
  const isKenya = market === 'KE';

  // County selection only exists as a concept in Kenya (county-fee permits,
  // vendor county coverage). On any other market, selectedCounty is always
  // null — CountyProvider is never mounted for those markets (see the
  // outer BusinessPageContent below), and useCounty() safely returns a
  // null-county default outside its provider.
  const { selectedCounty } = useCounty();

  // Business-size selector shown in BusinessHeader (Micro/Small/Medium/
  // Large). Owned here, not in BusinessHeader, because the fee-range
  // computation below needs the current band BEFORE useFilterState runs.
  //
  // Defaults to DEFAULT_SIZE_BAND (cost-engine.ts's 'MEDIUM') so this page
  // and the /cost pages can never silently drift apart.
  //
  // The band now drives two things: county-fee resolution (below), and the
  // headline totals via useFilterState (sizeBand option) — which resolves
  // per-band quantities through the same lib/cost-engine.ts the /cost
  // pages use. Quantities are all 1 until entered in the admin
  // (BusinessRequirementQuantity), so only fee-tiered counties will show
  // movement between bands today.
  const [sizeBand, setSizeBand] = useState<SizeBand>(DEFAULT_SIZE_BAND);

  const {
    business,
    requirements,
    products,
    feeSchedules,
    countyFeeScheduleNames,
    countyFeeShellProductIds,
    countyFeeShellProductDetails,
    error,
    groupedRequirements,
    sortedCategories,
    refreshProducts,
    productsLoaded,
  } = useBusinessData(
    slug,
    initialBusiness && initialRequirements
      ? { business: initialBusiness, requirements: initialRequirements }
      : undefined,
    market
  );

  // Stage 3 Part B: reads the RequirementCategory.usesLegalCountyFilter
  // flag threaded through each requirement object — see the
  // excludedFromTotals/usesLegalCountyFilter comment in the page
  // components that build initialRequirements and in
  // app/api/business/[slug]/requirements/route.ts for the client-refetch
  // path. Falls back to the legacy `category === 'Legal'` comparison only
  // for a requirement whose template has no categoryRef yet.
  const requirementUsesLegalCountyFilterByName = useMemo(() => {
    const map: Record<string, boolean> = {};
    requirements.forEach((r) => {
      map[r.name] = r.usesLegalCountyFilter ?? r.category === 'Legal';
    });
    return map;
  }, [requirements]);

  // Legal (vendor-issued, e.g. KRA/KEBS): hard filter by vendor county coverage.
  // Everything else: soft sort only. Fee-schedule requirements are handled
  // separately below and untouched here (their "products" array is empty
  // by design — they have no real Product rows).
  //
  // isKenya guard: county-based filtering/sorting is a Kenya-only concept.
  const { countyAdjustedProducts, legalUnavailableInCounty } = useMemo(() => {
    if (!isKenya || !selectedCounty) {
      return { countyAdjustedProducts: products, legalUnavailableInCounty: {} as Record<string, boolean> };
    }

    const out: Record<string, ProductType[]> = {};
    const unavailable: Record<string, boolean> = {};

    for (const [reqName, prods] of Object.entries(products)) {
      const usesLegalCountyFilter = requirementUsesLegalCountyFilterByName[reqName];

      if (usesLegalCountyFilter && !countyFeeScheduleNames.has(reqName)) {
        const filtered = prods.filter((p) => vendorServesCounty(p.vendor, selectedCounty.id));
        out[reqName] = filtered;
        unavailable[reqName] = prods.length > 0 && filtered.length === 0;
      } else {
        out[reqName] = [...prods].sort(
          (a, b) => countyPriority(a.vendor, selectedCounty.id) - countyPriority(b.vendor, selectedCounty.id)
        );
      }
    }

    return { countyAdjustedProducts: out, legalUnavailableInCounty: unavailable };
  }, [isKenya, products, selectedCounty, requirementUsesLegalCountyFilterByName, countyFeeScheduleNames]);

  // County-issued permits (Business Permit, Health Certificate, etc.) —
  // resolved from LegalFeeSchedule. Only computed once a county is picked;
  // countyFeeScheduleNames (from useBusinessData) already tells the UI
  // which requirements are this type even before that.
  //
  // Passes both the business's EFFECTIVE trade class and the visitor's
  // selected sizeBand, so a fee row tiered by either dimension resolves to
  // the right price — see resolveFeeSchedule's scoring in
  // lib/legalFeeSchedule.ts.
  //
  // isKenya guard: county fee schedules are a Kenya-only mechanism.
  const feeScheduleResolutions = useMemo(() => {
    if (!isKenya || !selectedCounty) return {} as Record<string, FeeScheduleResolution>;
    const out: Record<string, FeeScheduleResolution> = {};
    const tradeClassId = business?.effectiveTradeClassId ?? null;
    for (const [reqName, schedules] of Object.entries(feeSchedules)) {
      if (!countyFeeScheduleNames.has(reqName)) continue;
      out[reqName] = resolveFeeSchedule(schedules, selectedCounty.id, { tradeClassId, sizeBand });
    }
    return out;
  }, [isKenya, feeSchedules, selectedCounty, countyFeeScheduleNames, business, sizeBand]);

  // Cost engine: county-fee range per requirement, at the current size
  // band. When a county IS selected, use that county's exact/range
  // resolution (computed above for CountyFeeCard). When none is selected,
  // aggregate across every county with data using the SAME pure function
  // lib/cost-data.ts calls server-side, over the same raw rows — so this
  // can never disagree with the server-rendered fallback that's live until
  // this resolves. A requirement absent here resolves to null and the cost
  // engine treats it as unpriced, honestly.
  const feeRangesByRequirementName = useMemo(() => {
    const out: Record<string, FeeRange> = {};
    if (!isKenya) return out;

    const tradeClassId = business?.effectiveTradeClassId ?? null;

    countyFeeScheduleNames.forEach((name) => {
      if (selectedCounty && feeScheduleResolutions[name]) {
        out[name] = feeResolutionToRange(feeScheduleResolutions[name]);
      } else {
        const aggregate = resolveFeeScheduleAcrossCounties(feeSchedules[name] ?? [], { tradeClassId, sizeBand });
        out[name] = aggregate ? { low: aggregate.low, high: aggregate.high } : null;
      }
    });

    return out;
  }, [isKenya, countyFeeScheduleNames, selectedCounty, feeScheduleResolutions, feeSchedules, business, sizeBand]);

  const {
    categoryStates,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalFilter,
    setGlobalFilter,
    availableNecessities,
    requiredCount,
    optionalCount,
    unfilteredRequiredLowPrice,
    unfilteredRequiredMediumPrice,
    unfilteredRequiredHighPrice,
    unfilteredLowPrice,
    unfilteredMediumPrice,
    unfilteredHighPrice,
    unfilteredRequirementsWithProducts,
    unfilteredRequiredRequirementsWithProducts,
    unfilteredRequiredSource,
    unfilteredSource,
    unfilteredStockCount,
    unfilteredStockLowPrice,
    unfilteredStockMedianPrice,
    unfilteredStockHighPrice,
    totalRequirements,
    getFilteredRequirements,
    filteredCategories,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange,
  } = useFilterState(requirements, countyAdjustedProducts, groupedRequirements, sortedCategories, {
    initialCost,
    productsLoaded,
    feeRangesByRequirementName,
    sizeBand,
  });

  if (error === 'Business not found') {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Business Not Found</h1>
        <p className="text-gray-600 mb-4">
          The business you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          <h1 className="text-xl font-semibold mb-2">Error Loading Business</h1>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <main className="md:col-span-2">
          <BusinessHeader
            totalRequirements={totalRequirements}
            businessName={business.name}
            requiredCount={requiredCount}
            optionalCount={optionalCount}
            unfilteredRequiredLowPrice={unfilteredRequiredLowPrice}
            unfilteredRequiredMediumPrice={unfilteredRequiredMediumPrice}
            unfilteredRequiredHighPrice={unfilteredRequiredHighPrice}
            unfilteredLowPrice={unfilteredLowPrice}
            unfilteredMediumPrice={unfilteredMediumPrice}
            unfilteredHighPrice={unfilteredHighPrice}
            requiredRequirementsWithProducts={unfilteredRequiredRequirementsWithProducts}
            requirementsWithProducts={unfilteredRequirementsWithProducts}
            costSourceRequired={unfilteredRequiredSource}
            costSourceAll={unfilteredSource}
            unfilteredStockCount={unfilteredStockCount}
            unfilteredStockLowPrice={unfilteredStockLowPrice}
            unfilteredStockMedianPrice={unfilteredStockMedianPrice}
            unfilteredStockHighPrice={unfilteredStockHighPrice}
            sizeBand={sizeBand}
            onSizeBandChange={setSizeBand}
            slug={slug}
            market={market}
          />

          <section aria-label="Business requirements">
            <RequirementsSection
              businessId={business.id.toString()}
              businessName={business.name}
              sortedCategories={filteredCategories}
              groupedRequirements={groupedRequirements}
              products={countyAdjustedProducts}
              legalUnavailableInCounty={legalUnavailableInCounty}
              feeScheduleResolutions={feeScheduleResolutions}
              countyFeeScheduleNames={countyFeeScheduleNames}
              countyFeeShellProductIds={countyFeeShellProductIds}
              countyFeeShellProductDetails={countyFeeShellProductDetails}
              categoryStates={categoryStates}
              globalSearchQuery={globalSearchQuery}
              globalFilter={globalFilter}
              setGlobalSearchQuery={setGlobalSearchQuery}
              setGlobalFilter={setGlobalFilter}
              onToggleCategorySearch={toggleCategorySearch}
              onToggleFilter={toggleFilter}
              onCategorySearchChange={handleCategorySearchChange}
              onSetFilter={setFilter}
              availableNecessities={availableNecessities}
              getFilteredRequirements={getFilteredRequirements}
              onProductAssigned={refreshProducts}
              market={market}
              categoryLinks={categoryLinks}
            />
          </section>

          {faqs && faqs.length > 0 && (
            <section aria-labelledby="requirements-faq-heading" className="mt-10">
              <h2
                id="requirements-faq-heading"
                className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 text-center"
              >
                Frequently Asked Questions
              </h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-slate-800 text-sm sm:text-base flex items-center justify-between gap-3">
                      {faq.question}
                      <span className="text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0">
                        ⌄
                      </span>
                    </summary>
                    <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="sticky top-8 self-start" aria-label="Cost calculator">
          <CostCalculator business={business} market={market} />
        </aside>
      </div>
    </div>
  );
}

export default function BusinessPageContent(props: BusinessPageContentProps) {
  const market = props.market ?? DEFAULT_MARKET;
  const isKenya = market === 'KE';

  // CountyProvider only mounts for Kenya — county selection has no meaning
  // outside it. For every other market, BusinessPageContentInner never
  // sees a CountyProvider above it.
  if (!isKenya) {
    return <BusinessPageContentInner {...props} market={market} />;
  }

  return (
    <CountyProvider businessSlug={props.slug}>
      <BusinessPageContentInner {...props} market={market} />
    </CountyProvider>
  );
}