'use client';
import React from 'react';
import { use } from 'react';
import CostCalculator from '@/components/CostCalculator';
import CategoryNavigation from '@/components/business/CategoryNavMenu';
import BusinessHeader from '@/components/DetailsPage/BusinessHeader';
import SummaryControls from '@/components/DetailsPage/SummaryControls';
import RequirementsSection from '@/components/DetailsPage/RequirementsSection';
import { useBusinessData } from 'hooks/useBusinessData';
import { useFilterState } from 'hooks/useFilterState';

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = use(params);
  
  const {
    business,
    requirements,
    products,
    error,
    groupedRequirements,
    sortedCategories
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
    lowPrice,
    highPrice,
    filteredCategories,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange
  } = useFilterState(requirements, products, groupedRequirements, sortedCategories);

  if (error || !business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          <p>Error: {error || 'Business not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {/* Header Section */}
          <BusinessHeader
            businessName={business.name}
            unfilteredLowPrice={unfilteredLowPrice}
            unfilteredHighPrice={unfilteredHighPrice}
            requiredCount={requiredCount}
            optionalCount={optionalCount}
          />

          {/* Category Navigation */}
          <div className="mb-8 sticky top-0 bg-white z-10 pt-4 pb-4">
            {sortedCategories.length > 0 && (
              <CategoryNavigation categories={sortedCategories} />
            )}
          </div>

          {/* Summary Section with Global Controls */}
          <SummaryControls
            totalRequirements={totalRequirements}
            lowPrice={lowPrice}
            highPrice={highPrice}
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />

          {/* Requirements Sections */}
          <RequirementsSection
            sortedCategories={filteredCategories}
            groupedRequirements={groupedRequirements}
            products={products}
            categoryStates={categoryStates}
            globalSearchQuery={globalSearchQuery}
            globalFilter={globalFilter}
            onToggleCategorySearch={toggleCategorySearch}
            onToggleFilter={toggleFilter}
            onCategorySearchChange={handleCategorySearchChange}
            onSetFilter={setFilter}
          />
        </div>

        {/* Cost Calculator Sidebar */}
        <div className="sticky top-8 self-start">
          <CostCalculator business={business} />
        </div>
      </div>
    </div>
  );
}