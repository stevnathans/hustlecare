import React, { useEffect, useState } from "react";
import CategorySection from "./CategorySection";
import GlobalSearchFilter from "./GlobalSearchFilter";
import StickyQuickNavigation from "./StickyQuickNavigation";
import BusinessCard from "../business/BusinessCards";
import { Product } from "@/types";

// All nullable fields match what useBusinessData returns after resolving
// BusinessRequirement → RequirementTemplate. category and description
// come from the database and can be null.
interface RequirementLocal {
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
  filter: "all" | "required" | "optional";
  showSearch: boolean;
  searchQuery: string;
}

interface RequirementsSectionProps {
  businessName: string;
  sortedCategories: string[];
  groupedRequirements: Record<string, RequirementLocal[]>;
  products: Record<string, Product[]>;
  categoryStates: Record<string, CategoryState>;
  globalSearchQuery: string;
  globalFilter: "all" | "required" | "optional";
  setGlobalSearchQuery: (query: string) => void;
  setGlobalFilter: (filter: "all" | "required" | "optional") => void;
  onToggleCategorySearch: (category: string) => void;
  onToggleFilter: (category: string) => void;
  onCategorySearchChange: (category: string, query: string) => void;
  onSetFilter: (
    category: string,
    filter: "all" | "required" | "optional"
  ) => void;
  getFilteredRequirements: (category: string) => RequirementLocal[];
  isLoading?: boolean;
}

type Business = {
  sortedCategories: string[];
  groupedRequirements: Record<string, RequirementLocal[]>;
  requirements: RequirementLocal[];
  id: string;
  name: string;
  image: string;
  slug: string;
};

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
  isLoading = false,
}) => {
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  useEffect(() => {
    const fetchSimilarBusinesses = async () => {
      try {
        const res = await fetch("/api/businesses");
        if (!res.ok) throw new Error("Failed to fetch businesses");
        const data = await res.json();
        setSimilarBusinesses(data.slice(0, 3));
      } catch (error) {
        console.error("Error fetching similar businesses:", error);
      } finally {
        setLoadingBusinesses(false);
      }
    };

    fetchSimilarBusinesses();
  }, []);

  const hasGlobalFilters = globalSearchQuery || globalFilter !== "all";

  const hasAnyResults = sortedCategories.some((category) => {
    const filteredReqs = getFilteredRequirements(category);
    return filteredReqs.length > 0;
  });

  const showGlobalNoResults = hasGlobalFilters && !hasAnyResults;

  const categoryInfo = sortedCategories.map((category) => ({
    name: category,
    count: groupedRequirements[category]?.length || 0,
  }));

  const generateRequirementsSchema = () => {
    const totalRequirements = sortedCategories.reduce((total, category) => {
      return total + (groupedRequirements[category]?.length || 0);
    }, 0);

    const requirementsSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Complete Requirements for Starting a ${businessName} Business`,
      description: `Comprehensive list of all requirements needed to start a ${businessName} business, organized by category.`,
      numberOfItems: totalRequirements,
      itemListElement: sortedCategories.map((category, categoryIndex) => ({
        "@type": "ListItem",
        position: categoryIndex + 1,
        item: {
          "@type": "ItemList",
          name: `${category} Requirements`,
          description: `${category} requirements for ${businessName} business`,
          numberOfItems: groupedRequirements[category]?.length || 0,
          itemListElement: (groupedRequirements[category] || []).map(
            (req, reqIndex) => ({
              "@type": "ListItem",
              position: reqIndex + 1,
              item: {
                "@type": "Product",
                name: req.name,
                description:
                  req.description || `${req.name} for ${businessName} business`,
                category: category,
                additionalProperty: {
                  "@type": "PropertyValue",
                  name: "necessity",
                  value: req.necessity,
                },
              },
            })
          ),
        },
      })),
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(requirementsSchema) }}
      />
    );
  };

  const GlobalNoResults = () => {
    const getNoResultsMessage = () => {
      if (globalSearchQuery && globalFilter !== "all") {
        return `No ${globalFilter} requirements match your search for "${globalSearchQuery}"`;
      } else if (globalSearchQuery) {
        return `No requirements match your search for "${globalSearchQuery}"`;
      } else if (globalFilter !== "all") {
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
              setGlobalSearchQuery("");
              setGlobalFilter("all");
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

  const SimilarBusinessesSection = () => {
    if (loadingBusinesses) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Explore Similar Businesses
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-full sm:w-80 snap-center">
                <div className="bg-white rounded-xl p-4 shadow-sm animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (similarBusinesses.length === 0) return null;

    return (
      <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-6 border border-blue-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Explore Similar Businesses
          </h3>
          <a
            href="/businesses"
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1"
          >
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
        <p className="text-gray-700 mb-6">
          Discover other business opportunities with detailed requirements and cost calculators.
        </p>
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
          {similarBusinesses.map((business) => (
            <div key={business.id} className="flex-shrink-0 w-full sm:w-80 snap-center">
              <BusinessCard
                id={business.id}
                name={business.name}
                image={business.image}
                requirements={business.requirements}
                groupedRequirements={business.groupedRequirements}
                sortedCategories={business.sortedCategories}
                slug={business.slug}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-2 mt-4 sm:hidden">
          {similarBusinesses.map((_, index) => (
            <div key={index} className="w-2 h-2 rounded-full bg-emerald-300"></div>
          ))}
        </div>
      </div>
    );
  };

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

  if (!isLoading && sortedCategories.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
        <svg
          className="w-16 h-16 text-yellow-500 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.863-.833-2.633 0L4.182 14.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          No Requirements Available
        </h3>
        <p className="text-yellow-700 mb-4">
          We&apos;re still building the requirements list for this{" "}
          {businessName} business.
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

      <div
        className="space-y-6 px-0 sm:px-4"
        role="main"
        aria-label={`Requirements for ${businessName} business`}
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Complete List of Requirements For {businessName} Business
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Below is a categorized list of all the requirements you need to
            start a profitable {businessName} business. Each category contains
            both essential and optional requirements. Use the search and filter
            options to easily find items, and add them to your cost calculator
            to understand how much you need to start a {businessName} business.
          </p>
        </div>

        <StickyQuickNavigation
          categories={categoryInfo}
          businessName={businessName}
          globalSearchQuery={globalSearchQuery}
          setGlobalSearchQuery={setGlobalSearchQuery}
          globalFilter={globalFilter}
          setGlobalFilter={setGlobalFilter}
        />

        <section aria-label="Business search and filters">
          <GlobalSearchFilter
            globalSearchQuery={globalSearchQuery}
            setGlobalSearchQuery={setGlobalSearchQuery}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
        </section>

        {showGlobalNoResults ? (
          <GlobalNoResults />
        ) : (
          <>
            {sortedCategories.map((category) => {
              const filteredReqs = getFilteredRequirements(category);
              const categoryState = categoryStates[category] || {
                showFilter: false,
                filter: "all" as const,
                showSearch: false,
                searchQuery: "",
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

            {hasAnyResults && <SimilarBusinessesSection />}
          </>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

export default RequirementsSection;