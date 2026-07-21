// businesses/[slug]/requirements/BusinessPageContent.tsx
'use client';
import React from 'react';
import CostCalculator from '@/components/CostCalculator';
import BusinessHeader from '@/components/DetailsPage/BusinessHeader';
import RequirementsSection from '@/components/DetailsPage/RequirementsSection';
import {
  useBusinessData,
  type Business as BusinessData,
  type Requirement as RequirementData,
} from 'hooks/useBusinessData';
import { useFilterState } from 'hooks/useFilterState';
import Link from 'next/link';

interface Faq {
  question: string;
  answer: string;
}

interface BusinessPageContentProps {
  // Receives the plain resolved slug string from the server component.
  // Do NOT pass the raw params Promise — it causes double-unwrapping
  // and intermittent "business not found" errors.
  slug: string;
  // Server-fetched data (see page.tsx). When present, useBusinessData uses
  // it for the initial render instead of waiting on a client-side fetch,
  // so the requirements list is in the raw HTML response.
  initialBusiness?: BusinessData;
  initialRequirements?: RequirementData[];
  // Auto-generated FAQ content from page.tsx, rendered here to back the
  // FAQPage schema with actual visible content.
  faqs?: Faq[];
}

export default function BusinessPageContent({
  slug,
  initialBusiness,
  initialRequirements,
  faqs,
}: BusinessPageContentProps) {
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

  const {
    categoryStates,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalFilter,
    setGlobalFilter,
    availableNecessities,
    requiredCount,
    optionalCount,
    // Required-only cost (default) and full required+optional cost
    // (shown when the "Include optional items" toggle is on) — both
    // exclude Stock. See useFilterState.ts.
    unfilteredRequiredLowPrice,
    unfilteredRequiredMediumPrice,
    unfilteredRequiredHighPrice,
    unfilteredLowPrice,
    unfilteredMediumPrice,
    unfilteredHighPrice,
    unfilteredRequirementsWithProducts,
    unfilteredRequiredRequirementsWithProducts,
    // Stock is tracked separately — see useFilterState.ts.
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
  } = useFilterState(requirements, products, groupedRequirements, sortedCategories);

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
  // With SSR initial data this branch is skipped entirely on first render,
  // since `business` is already populated. It's still needed for the
  // no-initial-data fallback path.

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

  // ── Main render ───────────────────────────────────────────────────────────
  // Note: the page's single, real H1 lives inside BusinessHeader below.
  // A separate sr-only H1 used to be rendered here too — that was a
  // duplicate-H1 issue (one hidden, one visible, both on the same page)
  // and has been removed in favor of making BusinessHeader's H1 carry the
  // full keyword-relevant text itself.

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
              availableNecessities={availableNecessities}
              getFilteredRequirements={getFilteredRequirements}
              onProductAssigned={refreshProducts}
            />
          </section>

          {/* ── FAQ section ──────────────────────────────────────────────
              Backs the FAQPage schema emitted in page.tsx with real,
              visible content. Plain <details>/<summary> — no extra client
              state needed, styled to match the cards used elsewhere on
              this page. */}
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