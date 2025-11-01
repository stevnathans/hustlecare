import React from 'react';
import CategorySection from './CategorySection';
import GlobalSearchFilter from './GlobalSearchFilter';
import StickyQuickNavigation from './StickyQuickNavigation';
import { Product } from '@/types';

interface Requirement {
  id: number;
  name: string;
  description?: string;
  category?: string;
  necessity: string;
  image?: string;
}

interface CategoryState {
  showFilter: boolean;
  filter: 'all' | 'required' | 'optional';
  showSearch: boolean;
  searchQuery: string;
}

interface RequirementsSectionProps {
  businessName: string;
  sortedCategories: string[];
  groupedRequirements: Record<string, Requirement[]>;
  products: Record<string, Product[]>;
  categoryStates: Record<string, CategoryState>;
  globalSearchQuery: string;
  globalFilter: 'all' | 'required' | 'optional';
  setGlobalSearchQuery: (query: string) => void;
  setGlobalFilter: (filter: 'all' | 'required' | 'optional') => void;
  onToggleCategorySearch: (category: string) => void;
  onToggleFilter: (category: string) => void;
  onCategorySearchChange: (category: string, query: string) => void;
  onSetFilter: (category: string, filter: 'all' | 'required' | 'optional') => void;
  getFilteredRequirements: (category: string) => Requirement[];
  isLoading?: boolean;
}

const RequirementsSection: React.FC<RequirementsSectionProps> = ({
  businessName,
  sortedCategories,
  groupedRequirements,
  products,
  categoryStates,
  globalSearchQuery,
  globalFilter,
  setGlobalSearchQuery,
  setGlobalFilter,
  onToggleCategorySearch,
  onToggleFilter,
  onCategorySearchChange,
  onSetFilter,
  getFilteredRequirements,
  isLoading = false
}) => {
  // Check if global filters are active
  const hasGlobalFilters = globalSearchQuery || globalFilter !== 'all';

  // Calculate if there are any visible categories with results
  const hasAnyResults = sortedCategories.some(category => {
    const filteredReqs = getFilteredRequirements(category);
    return filteredReqs.length > 0;
  });

  // Determine if we should show the global no results message
  const showGlobalNoResults = hasGlobalFilters && !hasAnyResults;

  // Prepare category data for navigation
  const categoryInfo = sortedCategories.map(category => ({
    name: category,
    count: groupedRequirements[category]?.length || 0
  }));

  // Generate overall requirements structured data
  const generateRequirementsSchema = () => {
    const totalRequirements = sortedCategories.reduce((total, category) => {
      return total + (groupedRequirements[category]?.length || 0);
    }, 0);

    const requirementsSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `Complete Requirements for Starting a ${businessName} Business in Kenya`,
      "description": `Comprehensive list of all requirements needed to start a ${businessName} business in Kenya, organized by category.`,
      "numberOfItems": totalRequirements,
      "itemListElement": sortedCategories.map((category, categoryIndex) => ({
        "@type": "ListItem",
        "position": categoryIndex + 1,
        "item": {
          "@type": "ItemList",
          "name": `${category} Requirements`,
          "description": `${category} requirements for ${businessName} business`,
          "numberOfItems": groupedRequirements[category]?.length || 0,
          "itemListElement": (groupedRequirements[category] || []).map((req, reqIndex) => ({
            "@type": "ListItem",
            "position": reqIndex + 1,
            "item": {
              "@type": "Product",
              "name": req.name,
              "description": req.description || `${req.name} for ${businessName} business`,
              "category": category,
              "additionalProperty": {
                "@type": "PropertyValue",
                "name": "necessity",
                "value": req.necessity
              }
            }
          }))
        }
      }))
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(requirementsSchema) }}
      />
    );
  };

  // Global No Results Component
  const GlobalNoResults = () => {
    const getNoResultsMessage = () => {
      if (globalSearchQuery && globalFilter !== 'all') {
        return `No ${globalFilter} requirements match your search for "${globalSearchQuery}"`;
      } else if (globalSearchQuery) {
        return `No requirements match your search for "${globalSearchQuery}"`;
      } else if (globalFilter !== 'all') {
        return `No ${globalFilter} requirements found for ${businessName} business`;
      }
      return `No requirements found`;
    };

    return (
      <div className="bg-white p-12 rounded-lg shadow-md border border-gray-200 text-center">
        <svg 
          className="w-16 h-16 text-gray-400 mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
        
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          No Requirements Found
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {getNoResultsMessage()}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => {
              setGlobalSearchQuery('');
              setGlobalFilter('all');
            }}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
            Clear All Filters
          </button>
          
          <a 
            href="/businesses" 
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
          >
            Browse Other Businesses
          </a>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p className="mb-2">Try adjusting your search terms or filters, or</p>
          <a 
            href="/contact" 
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            request specific requirements for {businessName} business
          </a>
        </div>
      </div>
    );
  };

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "No Requirements" when data has loaded AND there are truly no requirements
  if (!isLoading && sortedCategories.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.633 0L4.182 14.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          No Requirements Available
        </h3>
        <p className="text-yellow-700 mb-4">
          We&apos;re still building the requirements list for this {businessName} business.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a 
            href="/businesses" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Browse Other Businesses
          </a>
          <a 
            href="/contact" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Request Requirements
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {generateRequirementsSchema()}
      
      <div className="space-y-6" role="main" aria-label={`Requirements for ${businessName} business`}>
        {/* Section Introduction */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Complete Requirements For {businessName} Business
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Below you&apos;ll find all the requirements organized by category to help you start your {businessName} business in Kenya. 
            Each category contains both essential and optional items. Use the search and filter options to easily find requirements, 
            and add items to your cost calculator to build your personalized business budget.
          </p>
        </div>

        {/* Sticky Quick Navigation */}
        <StickyQuickNavigation 
          categories={categoryInfo}
          businessName={businessName}
        />

        {/* Search and Filters Section */}
        <section aria-label="Business search and filters">
          <GlobalSearchFilter
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
        </section>

        {/* Show Global No Results if applicable */}
        {showGlobalNoResults ? (
          <GlobalNoResults />
        ) : (
          <>
            {/* Category Sections - Only render categories with results when global filters are active */}
            {sortedCategories.map((category) => {
              const filteredReqs = getFilteredRequirements(category);
              const categoryState = categoryStates[category] || {
                showFilter: false,
                filter: 'all' as const,
                showSearch: false,
                searchQuery: ''
              };

              return (
                <CategorySection
                  key={category}
                  category={category}
                  businessName={businessName}
                  requirements={groupedRequirements[category]}
                  filteredRequirements={filteredReqs}
                  products={products}
                  categoryState={categoryState}
                  globalSearchQuery={globalSearchQuery}
                  globalFilter={globalFilter}
                  onToggleSearch={() => onToggleCategorySearch(category)}
                  onToggleFilter={() => onToggleFilter(category)}
                  onSearchChange={(query) => onCategorySearchChange(category, query)}
                  onFilterChange={(filter) => onSetFilter(category, filter)}
                />
              );
            })}

            {/* Bottom Summary and CTA - Only show when there are results */}
            {hasAnyResults && (
              <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 border border-blue-200">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Start Your {businessName} Business?
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Use our cost calculator to get your personalized startup estimate and create your business plan.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a 
                      href="#cost-calculator" 
                      className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Calculate Startup Costs
                    </a>
                    <a 
                      href="/business-guides" 
                      className="inline-flex items-center px-6 py-3 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                    >
                      More Business Guides
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default RequirementsSection;