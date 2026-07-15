// DetailsPage/CategorySection.tsx

import React from 'react';
import Link from 'next/link';
import RequirementCard from '@/components/Requirements/RequirementCard';
import CategorySectionHeader from './CategorySectionHeader';
import CategorySearchFilter from './CategorySearchFilter';
import { Product } from '@/types';
import { necessityOptions } from '@/lib/necessity';

interface Requirement {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  category?: string | null;
  necessity: string;
  image?: string | null;
}

interface CategoryState {
  showFilter: boolean;
  filter: string; // 'all' or a lowercase necessity value
  showSearch: boolean;
  searchQuery: string;
}

interface CategorySectionProps {
  category: string;
  businessName: string;
  requirements: Requirement[];
  filteredRequirements: Requirement[];
  products: Record<string, Product[]>;
  categoryState: CategoryState;
  globalSearchQuery: string;
  globalFilter: string;
  onToggleSearch: () => void;
  onToggleFilter: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
  availableNecessities: string[];
  onProductAssigned?: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  businessName,
  requirements,
  filteredRequirements,
  products,
  categoryState,
  globalSearchQuery,
  globalFilter,
  onToggleSearch,
  onToggleFilter,
  onSearchChange,
  onFilterChange,
  onProductAssigned,
}) => {
  const categoryId = category.toLowerCase().replace(/\s+/g, '-');

  const hasGlobalFilters = globalSearchQuery || globalFilter !== 'all';
  if (filteredRequirements.length === 0 && hasGlobalFilters) {
    return null;
  }

  // Group filtered requirements by their necessity/demand value, driven by
  // the option list for this category (Required/Optional, or the 3-way
  // demand scale for Stock). Replaces the old hardcoded requiredItems/optionalItems split.
  const necessityGroups = necessityOptions(category).map((opt) => ({
    ...opt,
    items: filteredRequirements.filter(
      (req) => req.necessity.toLowerCase() === opt.value.toLowerCase()
    ),
  }));

  const renderRequirementCard = (requirement: Requirement) => (
    <div key={requirement.id}>
      <RequirementCard
        requirement={{
          ...requirement,
          category: requirement.category || category,
          image: requirement.image ?? undefined,
          description: requirement.description ?? undefined,
          templateId: requirement.templateId,
        }}
        products={products[requirement.name] || []}
        onProductAssigned={onProductAssigned}
        businessName={businessName}
      />
    </div>
  );

  return (
    <section
      id={categoryId}
      className="scroll-mt-20 bg-gray-50 rounded-lg overflow-hidden mb-4 sm:mb-6"
    >
      <CategorySectionHeader
        category={category}
        filteredCount={filteredRequirements.length}
        totalCount={requirements.length}
        showSearch={categoryState.showSearch}
        showFilter={categoryState.showFilter}
        onToggleSearch={onToggleSearch}
        onToggleFilter={onToggleFilter}
      />

      <CategorySearchFilter
        category={category}
        showSearch={categoryState.showSearch}
        showFilter={categoryState.showFilter}
        searchQuery={categoryState.searchQuery}
        filter={categoryState.filter}
        onSearchChange={onSearchChange}
        onFilterChange={onFilterChange}
      />

      <div className="p-2 sm:p-6">
        {filteredRequirements.length > 0 ? (
          <>
            <div className="mb-4 sm:mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {category === 'Stock'
                  ? `Products You Can Sell in Your ${businessName} Business`
                  : `${category} Requirements for Your ${businessName} Business`}
              </h3>
            
            </div>

            {necessityGroups.map((group) =>
              group.items.length === 0 ? null : (
                <div key={group.value} className="mb-6 sm:mb-8 last:mb-0">
                  <h4 className={`text-md font-semibold mb-3 sm:mb-4 flex items-center ${group.text}`}>
                    <span className={`w-2.5 h-2.5 rounded-full mr-2 ${group.dot}`} />
                    {group.label} {category === 'Stock' ? 'Products' : 'Items'} ({group.items.length})
                  </h4>
                  
                  <div className="space-y-4 sm:space-y-6">
                    {group.items.map((requirement) => renderRequirementCard(requirement))}
                  </div>
                </div>
              )
            )}
          </>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-2.958A7.963 7.963 0 016 12c0-1.657.5-3.2 1.357-4.48A7.955 7.955 0 0112 9c2.34 0 4.29 1.175 5.5 2.958A7.963 7.963 0 0118 12c0 1.657-.5 3.2-1.357 4.48z" />
            </svg>
            <h5 className="text-base sm:text-lg font-medium text-gray-700 mb-2">
              No {category} Requirements Found
            </h5>
            <p className="text-gray-500 text-sm mb-4">
              This category doesn&apos;t have any requirements yet, or they may be categorized differently.
            </p>

            {(categoryState.searchQuery || categoryState.filter !== 'all') && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center mb-4">
                <button
                  onClick={() => {
                    onSearchChange('');
                    onFilterChange('all');
                  }}
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Clear {category} Filters
                </button>
              </div>
            )}

            <div className="mt-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <Link
                  href="/businesses"
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  Browse Other Businesses
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-3 py-2 sm:px-4 sm:py2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  Request Requirements
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-100 px-4 py-3 sm:px-6 sm:py-4 border-t">
        <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between text-sm text-gray-600 gap-2 xs:gap-0">
          <a
            href={`#${categoryId}`}
            className="text-blue-600 hover:text-blue-800 hover:underline text-center"
            aria-label={`Jump to ${category} requirements section`}
          >
            ↑ Back to top
          </a>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;