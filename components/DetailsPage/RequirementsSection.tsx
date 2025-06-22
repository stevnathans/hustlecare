import React from 'react';
import CategorySection from './CategorySection';
import GlobalSearchFilter from './GlobalSearchFilter';
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
  getFilteredRequirements: (category: string) => Requirement[]; // NEW: Add this prop
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
  getFilteredRequirements // NEW: Use the helper function from props
}) => {
  // REMOVED: The local getFilteredRequirements function since we're using the one from props

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

  if (sortedCategories.length === 0) {
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
          
          {/* Quick Navigation */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Navigation:</h3>
            <nav className="flex flex-wrap gap-2" aria-label="Category navigation">
              {sortedCategories.map((category) => {
                const categoryId = category.toLowerCase().replace(/\s+/g, '-');
                const categoryCount = groupedRequirements[category]?.length || 0;
                
                return (
                  <a
                    key={category}
                    href={`#${categoryId}`}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    aria-label={`Jump to ${category} requirements (${categoryCount} items)`}
                  >
                    {category}
                    <span className="ml-2 bg-gray-300 text-gray-700 rounded-full px-2 py-0.5 text-xs">
                      {categoryCount}
                    </span>
                  </a>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Search and Filters Section */}
        <section aria-label="Business search and filters">
          <GlobalSearchFilter
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
        </section>

        {/* Category Sections */}
        {sortedCategories.map((category) => {
          const filteredReqs = getFilteredRequirements(category); // Using the helper function
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

        {/* Bottom Summary and CTA */}
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
      </div>
    </>
  );
};

export default RequirementsSection;