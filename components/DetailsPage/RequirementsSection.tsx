import React from 'react';
import CategorySection from './CategorySection';

interface Requirement {
  id: number;
  name: string;
  description?: string;
  category?: string;
  necessity: string;
  image?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
}

interface CategoryState {
  showFilter: boolean;
  filter: 'all' | 'required' | 'optional';
  showSearch: boolean;
  searchQuery: string;
}

interface RequirementsSectionProps {
  sortedCategories: string[];
  groupedRequirements: Record<string, Requirement[]>;
  products: Record<string, Product[]>;
  categoryStates: Record<string, CategoryState>;
  globalSearchQuery: string;
  globalFilter: 'all' | 'required' | 'optional';
  onToggleCategorySearch: (category: string) => void;
  onToggleFilter: (category: string) => void;
  onCategorySearchChange: (category: string, query: string) => void;
  onSetFilter: (category: string, filter: 'all' | 'required' | 'optional') => void;
}

const RequirementsSection: React.FC<RequirementsSectionProps> = ({
  sortedCategories,
  groupedRequirements,
  products,
  categoryStates,
  globalSearchQuery,
  globalFilter,
  onToggleCategorySearch,
  onToggleFilter,
  onCategorySearchChange,
  onSetFilter
}) => {
  const getFilteredRequirements = (category: string) => {
    return groupedRequirements[category].filter(req => {
      // Global filters
      const matchesGlobalSearch = globalSearchQuery
        ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
        : true;
      const matchesGlobalFilter = globalFilter === 'all' ||
        req.necessity.toLowerCase() === globalFilter;
     
      // Category-specific filters
      const matchesCategorySearch = categoryStates[category]?.searchQuery
        ? req.name.toLowerCase().includes(categoryStates[category].searchQuery.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(categoryStates[category].searchQuery.toLowerCase()))
        : true;
      const matchesCategoryFilter = !categoryStates[category]?.filter ||
        categoryStates[category]?.filter === 'all' ||
        req.necessity.toLowerCase() === categoryStates[category]?.filter;

      return matchesGlobalSearch && matchesGlobalFilter && matchesCategorySearch && matchesCategoryFilter;
    });
  };

  if (sortedCategories.length === 0) {
    return (
      <div className="bg-yellow-100 p-4 rounded-md">
        <p>No requirements found for this business</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default RequirementsSection;