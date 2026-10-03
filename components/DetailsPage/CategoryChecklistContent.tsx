/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react';
import CategorySection from '@/components/DetailsPage/CategorySection';
import { CountyProvider, useCounty } from '@/contexts/CountyContext';
import {
  useBusinessData,
  type Business as BusinessData,
  type Requirement as RequirementData,
} from 'hooks/useBusinessData';
import { useFilterState } from 'hooks/useFilterState';
import { Product as ProductType } from '@/types';
import { resolveFeeSchedule, FeeScheduleResolution } from '@/lib/legalFeeSchedule';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';

// Stage 4.5 — the category-scoped checklist sub-page's content component.
// Deliberately a near-copy of BusinessPageContent.tsx's county/fee-schedule
// wiring (vendorServesCounty, countyPriority, the countyAdjustedProducts
// and feeScheduleResolutions useMemo blocks) rather than a shared import,
// matching this codebase's existing convention of duplicating per-page
// logic over aggressively sharing it across KE/US or hub/requirements
// page variants. This is intentional composition, not new UI: the same
// CategorySection component the main requirements checklist page uses is
// reused here unmodified, just rendered once instead of looped over every
// category — see the workflow doc's framing of Stage 4.5 as "composition
// over the Stage 2b component chain, not new UI."
//
// Notably absent versus the full requirements page: BusinessHeader (the
// business-wide cost/requirement-count strip) and CostCalculator. This
// page is a focused, single-category view — the full requirements page
// remains canonical for whole-business totals and cost planning; this
// page's own footer links back to it.

interface Props {
  slug: string;
  categoryName: string;
  initialBusiness?: BusinessData;
  initialRequirements?: RequirementData[];
  market?: MarketCode;
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

function CategoryChecklistContentInner({
  slug,
  categoryName,
  initialBusiness,
  initialRequirements,
  market = DEFAULT_MARKET,
}: Required<Pick<Props, 'market'>> & Omit<Props, 'market'>) {
  const isKenya = market === 'KE';
  const base = isKenya ? '' : '/us';

  const { selectedCounty } = useCounty();

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
  } = useBusinessData(
    slug,
    initialBusiness && initialRequirements
      ? { business: initialBusiness, requirements: initialRequirements }
      : undefined,
    market
  );

  // Same flag-threading pattern as BusinessPageContent.tsx (Stage 3 Part B)
  // — see that file for the fuller comment.
  const requirementUsesLegalCountyFilterByName = useMemo(() => {
    const map: Record<string, boolean> = {};
    requirements.forEach((r) => {
      map[r.name] = r.usesLegalCountyFilter ?? r.category === 'Legal';
    });
    return map;
  }, [requirements]);

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

  const feeScheduleResolutions = useMemo(() => {
    if (!isKenya || !selectedCounty) return {} as Record<string, FeeScheduleResolution>;
    const out: Record<string, FeeScheduleResolution> = {};
    const tradeClassId = business?.effectiveTradeClassId ?? null;
    for (const [reqName, schedules] of Object.entries(feeSchedules)) {
      if (!countyFeeScheduleNames.has(reqName)) continue;
      out[reqName] = resolveFeeSchedule(schedules, selectedCounty.id, { tradeClassId });
    }
    return out;
  }, [isKenya, feeSchedules, selectedCounty, countyFeeScheduleNames, business]);

  const {
    categoryStates,
    getFilteredRequirements,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange,
    availableNecessities,
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
          <h1 className="text-xl font-semibold mb-2">Error Loading Category</h1>
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
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const allReqsInCategory = groupedRequirements[categoryName] || [];
  const filteredReqs = getFilteredRequirements(categoryName);
  const categoryState = categoryStates[categoryName] || {
    showFilter: false,
    filter: 'all' as const,
    showSearch: false,
    searchQuery: '',
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-gray-400 mb-6">
        <Link href={`${base}/businesses/${slug}`} className="inline-flex items-center gap-1 hover:text-emerald-600 transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          {business.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <Link href={`${base}/businesses/${slug}/requirements`} className="hover:text-emerald-600 transition-colors">
          Requirements
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
        <span className="text-gray-600 font-medium">{categoryName}</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-2">
        {allReqsInCategory.length} {categoryName} Requirements for a {business.name} Business
      </h1>
      <p className="text-gray-500 mb-8">
        Part of the full {business.name} requirements checklist — every {categoryName.toLowerCase()} item, with costs and options.
      </p>

      <CategorySection
        category={categoryName}
        businessName={business.name}
        businessId={business.id}
        requirements={allReqsInCategory}
        filteredRequirements={filteredReqs}
        products={countyAdjustedProducts}
        legalUnavailableInCounty={legalUnavailableInCounty}
        feeScheduleResolutions={feeScheduleResolutions}
        countyFeeScheduleNames={countyFeeScheduleNames}
        countyFeeShellProductIds={countyFeeShellProductIds}
        countyFeeShellProductDetails={countyFeeShellProductDetails}
        categoryState={categoryState}
        globalSearchQuery=""
        globalFilter="all"
        onToggleSearch={() => toggleCategorySearch(categoryName)}
        onToggleFilter={() => toggleFilter(categoryName)}
        onSearchChange={(query) => handleCategorySearchChange(categoryName, query)}
        onFilterChange={(filter) => setFilter(categoryName, filter)}
        availableNecessities={availableNecessities}
        onProductAssigned={refreshProducts}
        market={market}
        // No viewAllHref here — this IS the "view all" destination for
        // this category, so the link CategorySection would otherwise
        // render would just point back at itself.
      />

      <div className="mt-8 text-center">
        <Link
          href={`${base}/businesses/${slug}/requirements`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          View all {business.name} requirements
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function CategoryChecklistContent(props: Props) {
  const market = props.market ?? DEFAULT_MARKET;
  const isKenya = market === 'KE';

  if (!isKenya) {
    return <CategoryChecklistContentInner {...props} market={market} />;
  }

  return (
    <CountyProvider businessSlug={props.slug}>
      <CategoryChecklistContentInner {...props} market={market} />
    </CountyProvider>
  );
}