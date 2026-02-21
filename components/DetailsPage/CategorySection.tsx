import React from 'react';
import RequirementCard from '@/components/Requirements/RequirementCard';
import CategorySectionHeader from './CategorySectionHeader';
import CategorySearchFilter from './CategorySearchFilter';
import { Link } from 'lucide-react';
import { Product } from '@/types';

// Matches the resolved shape from /api/business/[slug]/requirements.
// image is string | null (not string | undefined) because the template
// field comes from the database which returns null for missing values.
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
  filter: 'all' | 'required' | 'optional';
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
  globalFilter: 'all' | 'required' | 'optional';
  onToggleSearch: () => void;
  onToggleFilter: () => void;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: 'all' | 'required' | 'optional') => void;
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
  onFilterChange
}) => {
  const categoryId = category.toLowerCase().replace(/\s+/g, '-');
  const requiredItems = filteredRequirements.filter(req => req.necessity.toLowerCase() === 'required');
  const optionalItems = filteredRequirements.filter(req => req.necessity.toLowerCase() === 'optional');

  const hasGlobalFilters = globalSearchQuery || globalFilter !== 'all';
  if (filteredRequirements.length === 0 && hasGlobalFilters) {
    return null;
  }

  const generateCategorySchema = () => {
    const categorySchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${category} Requirements for ${businessName} Business`,
      "description": `Essential ${category.toLowerCase()} requirements needed to start a ${businessName} business in Kenya.`,
      "numberOfItems": filteredRequirements.length,
      "itemListElement": filteredRequirements.map((requirement, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Product",
          "name": requirement.name,
          "description": requirement.description || `${requirement.name} for ${businessName} business`,
          "category": category,
          "additionalProperty": {
            "@type": "PropertyValue",
            "name": "necessity",
            "value": requirement.necessity
          }
        }
      }))
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(categorySchema) }}
      />
    );
  };

  return (
    <>
      {generateCategorySchema()}
      
      <section
        id={categoryId}
        className="scroll-mt-20 bg-gray-50 rounded-lg overflow-hidden mb-4 sm:mb-6"
        itemScope
        itemType="https://schema.org/ItemList"
      >
        <meta itemProp="name" content={`${category} Requirements for ${businessName} Business`} />
        <meta itemProp="description" content={`${category} requirements needed to start a ${businessName} business in Kenya`} />
        <meta itemProp="numberOfItems" content={filteredRequirements.length.toString()} />

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
                  {category} Requirements for Your {businessName} Business
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {category === 'Legal' && `Ensure your ${businessName} business complies with all legal requirements in Kenya. These documents and registrations are essential for operating legally.`}
                  {category === 'Equipment' && `Essential equipment and tools needed to operate your ${businessName} business efficiently. Choose quality items that fit your budget and requirements.`}
                  {category === 'Software' && `Digital tools and software solutions to streamline your ${businessName} business operations, from management to customer service.`}
                  {category === 'Marketing' && `Marketing materials and strategies to promote your ${businessName} business and attract customers in the Kenyan market.`}
                  {category === 'Documents' && `Important business documents and templates needed for your ${businessName} business operations and compliance.`}
                  {!['Legal', 'Equipment', 'Software', 'Marketing', 'Documents'].includes(category) && 
                    `Important ${category.toLowerCase()} requirements for starting and running your ${businessName} business successfully in Kenya.`}
                </p>
              </div>

              {requiredItems.length > 0 && (
                <div className="mb-6 sm:mb-8">
                  <h4 className="text-md font-semibold text-green-700 mb-3 sm:mb-4 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Essential {category} Items ({requiredItems.length})
                  </h4>
                  <div className="space-y-4 sm:space-y-6">
                    {requiredItems.map((requirement) => (
                      <div key={requirement.id} itemScope itemType="https://schema.org/Product">
                        <RequirementCard
                          requirement={{
                            ...requirement,
                            category: requirement.category || category,
                            image: requirement.image ?? undefined,
                            description: requirement.description ?? undefined,
                          }}
                          products={products[requirement.name] || []}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optionalItems.length > 0 && (
                <div>
                  <h4 className="text-md font-semibold text-yellow-700 mb-3 sm:mb-4 flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Optional {category} Items ({optionalItems.length})
                  </h4>
                  <p className="text-sm text-gray-600 mb-4 sm:mb-6">
                    These optional items can enhance your {businessName} business but aren&apos;t required to get started.
                  </p>
                  <div className="space-y-4 sm:space-y-6">
                    {optionalItems.map((requirement) => (
                      <div key={requirement.id} itemScope itemType="https://schema.org/Product">
                        <RequirementCard
                          requirement={{
                            ...requirement,
                            category: requirement.category || category,
                            image: requirement.image ?? undefined,
                            description: requirement.description ?? undefined,
                          }}
                          products={products[requirement.name] || []}
                        />
                      </div>
                    ))}
                  </div>
                </div>
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
                    href="/business" 
                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Browse Other Businesses
                  </Link>
                  <Link 
                    href="/contact" 
                    className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
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
    </>
  );
};

export default CategorySection;