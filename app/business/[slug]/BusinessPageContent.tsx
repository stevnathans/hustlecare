'use client';
import React from 'react';
import CostCalculator from '@/components/CostCalculator';
import BusinessHeader from '@/components/DetailsPage/BusinessHeader';
import RequirementsSection from '@/components/DetailsPage/RequirementsSection';
import { useBusinessData } from 'hooks/useBusinessData';
import { useFilterState } from 'hooks/useFilterState';
import Link from 'next/link';

interface BusinessPageContentProps {
  // Receives the plain resolved slug string from the server component.
  // Do NOT pass the raw params Promise — it causes double-unwrapping
  // and intermittent "business not found" errors.
  slug: string;
  // FIX: accept the server-fetched counts as props so the page renders
  // meaningful content immediately — before the client hook hydrates.
  // This prevents Googlebot from seeing "0 Requirements" in the <h1>
  // during its initial render pass, which could suppress the page in
  // SERPs or cause a title mismatch with the <title> tag.
  initialBusinessName: string;
  initialRequirementCount: number;
}

export default function BusinessPageContent({
  slug,
  initialBusinessName,
  initialRequirementCount,
}: BusinessPageContentProps) {
  const {
    business,
    requirements,
    products,
    error,
    groupedRequirements,
    sortedCategories,
  } = useBusinessData(slug);

  const {
    categoryStates,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalFilter,
    setGlobalFilter,
    requiredCount,
    optionalCount,
    unfilteredLowPrice,
    unfilteredHighPrice,
    totalRequirements,
    getFilteredRequirements,
    filteredCategories,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange,
  } = useFilterState(requirements, products, groupedRequirements, sortedCategories);

  const requirementsWithProducts = requirements
    ? requirements.filter((req) => {
        const reqProducts = products[req.name];
        return Array.isArray(reqProducts) && reqProducts.length > 0;
      }).length
    : 0;

  // ── Error states ──────────────────────────────────────────────────────────

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

  // ── Loading skeleton ──────────────────────────────────────────────────────
  //
  // FIX: the old skeleton rendered nothing meaningful — Googlebot doing a
  // first-pass render before JS fully executes would see blank grey boxes
  // and zero content. We now render the <h1> immediately using the
  // server-provided initial values so crawlers always find real heading text
  // regardless of hydration timing.

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/*
          Render a real, text-bearing h1 during the loading state.
          This is what Googlebot sees on a fast first render before
          useBusinessData resolves. It matches the <title> tag exactly.
        */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-3 sm:mb-4">
          {initialRequirementCount > 0
            ? `${initialRequirementCount} Requirements to Start a ${initialBusinessName} Business`
            : `${initialBusinessName} Business - Complete Requirements & Total Costs`}
        </h1>

        <div className="animate-pulse mt-6">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  //
  // FIX: removed the sr-only <h1> wrapper that previously sat here.
  //
  // The old pattern had TWO <h1> elements:
  //   1. An sr-only <h1> here in BusinessPageContent
  //   2. A visible <h1> inside BusinessHeader
  //
  // Having duplicate <h1> tags causes Google to treat whichever it finds
  // first as the page title — and since sr-only text differs from visible
  // text, this created a content mismatch. The sr-only heading also cannot
  // be seen by users, so it provides no UX value.
  //
  // The fix: BusinessHeader renders the single, visible <h1>. The <header>
  // landmark wrapper here provides the semantic container without a
  // competing heading.

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <main className="md:col-span-2">
          {/*
            BusinessHeader owns the page's sole <h1>.
            It receives live data from useBusinessData post-hydration,
            and initial server values are used in the loading state above.
          */}
          <BusinessHeader
            businessSlug={slug}
            totalRequirements={totalRequirements}
            businessName={business.name}
            unfilteredLowPrice={unfilteredLowPrice}
            unfilteredHighPrice={unfilteredHighPrice}
            requiredCount={requiredCount}
            optionalCount={optionalCount}
            requirementsWithProducts={requirementsWithProducts}
          />

          <section aria-label="Business requirements">
            <RequirementsSection
              businessName={business.name}
              sortedCategories={filteredCategories}
              groupedRequirements={groupedRequirements}
              products={products}
              categoryStates={categoryStates}
              globalSearchQuery={globalSearchQuery}
              globalFilter={globalFilter}
              setGlobalSearchQuery={setGlobalSearchQuery}
              setGlobalFilter={setGlobalFilter}
              onToggleCategorySearch={toggleCategorySearch}
              onToggleFilter={toggleFilter}
              onCategorySearchChange={handleCategorySearchChange}
              onSetFilter={setFilter}
              getFilteredRequirements={getFilteredRequirements}
            />
          </section>
        </main>

        <aside className="sticky top-8 self-start" aria-label="Cost calculator">
          <CostCalculator business={business} />
        </aside>
      </div>
    </div>
  );
}