/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useMemo } from 'react';
import CostCalculator from '@/components/CostCalculator';
import BusinessHeader from '@/components/DetailsPage/BusinessHeader';
import RequirementsSection from '@/components/DetailsPage/RequirementsSection';
import CountySelector from '@/components/DetailsPage/CountySelector';
import { CountyProvider, useCounty } from '@/contexts/CountyContext';
import {
  useBusinessData,
  type Business as BusinessData,
  type Requirement as RequirementData,
} from 'hooks/useBusinessData';
import { useFilterState } from 'hooks/useFilterState';
import { Product as ProductType } from '@/types';
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
}

// ── County-aware helpers ──────────────────────────────────────────────────
// A vendor "serves" a county if it's flagged to serve all counties (the
// default — covers national bodies like KRA/KEBS and vendors whose
// products, e.g. software, aren't tied to a location at all) or if the
// selected county is explicitly among the counties it operates in.
//
// `vendor` is typed loosely (any) here because types/vendor.ts hasn't been
// updated yet to declare `servesAllCounties` / `counties` — once it is,
// these can be typed against the real Vendor interface directly.
function vendorServesCounty(vendor: any, countyId: number): boolean {
  if (!vendor) return false;
  if (vendor.servesAllCounties) return true;
  return (vendor.counties ?? []).some((vc: any) => vc.countyId === countyId);
}

// Sort priority for the "soft prioritize" categories (everything except
// Legal) — lower sorts first. 0 = vendor explicitly serves this county,
// 1 = vendor serves all counties (neutral, always relevant), 2 = vendor
// serves other counties only. Nothing is ever excluded by this — it's a
// sort key, not a filter.
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
}: BusinessPageContentProps) {
  const { selectedCounty } = useCounty();

  const {
    business,
    requirements,
    products,
    error,
    groupedRequirements,
    sortedCategories,
    refreshProducts,
  } = useBusinessData(
    slug,
    initialBusiness && initialRequirements
      ? { business: initialBusiness, requirements: initialRequirements }
      : undefined
  );

  const requirementCategoryByName = useMemo(() => {
    const map: Record<string, string> = {};
    requirements.forEach((r) => { map[r.name] = r.category || 'Uncategorized'; });
    return map;
  }, [requirements]);

  // Legal: hard filter (vendor must cover the selected county, or serve all).
  // Everything else: soft sort only — nothing is ever hidden.
  const { countyAdjustedProducts, legalUnavailableInCounty } = useMemo(() => {
    if (!selectedCounty) {
      return { countyAdjustedProducts: products, legalUnavailableInCounty: {} as Record<string, boolean> };
    }

    const out: Record<string, ProductType[]> = {};
    const unavailable: Record<string, boolean> = {};

    for (const [reqName, prods] of Object.entries(products)) {
      const category = requirementCategoryByName[reqName];

      if (category === 'Legal') {
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
  }, [products, selectedCounty, requirementCategoryByName]);

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
  } = useFilterState(requirements, countyAdjustedProducts, groupedRequirements, sortedCategories);

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
          <CountySelector />

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
            unfilteredStockCount={unfilteredStockCount}
            unfilteredStockLowPrice={unfilteredStockLowPrice}
            unfilteredStockMedianPrice={unfilteredStockMedianPrice}
            unfilteredStockHighPrice={unfilteredStockHighPrice}
          />

          <section aria-label="Business requirements">
            <RequirementsSection
              businessId={business.id.toString()}
              businessName={business.name}
              sortedCategories={filteredCategories}
              groupedRequirements={groupedRequirements}
              products={countyAdjustedProducts}
              legalUnavailableInCounty={legalUnavailableInCounty}
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
          <CostCalculator business={business} />
        </aside>
      </div>
    </div>
  );
}

export default function BusinessPageContent(props: BusinessPageContentProps) {
  return (
    <CountyProvider businessSlug={props.slug}>
      <BusinessPageContentInner {...props} />
    </CountyProvider>
  );
}