import React from 'react';
import RequirementCard from '@/components/Requirements/RequirementCard';
import CategorySectionHeader from './CategorySectionHeader';
import CategorySearchFilter from './CategorySearchFilter';

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

interface CategorySectionProps {
  category: string;
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
  const getNoResultsMessage = () => {
    if (categoryState.searchQuery || categoryState.filter !== 'all' || globalSearchQuery || globalFilter !== 'all') {
      return `No requirements match your current ${globalSearchQuery ? 'global search' : categoryState.searchQuery ? 'category search' : 'filters'}`;
    }
    return 'No requirements found';
  };

  return (
    <section
      id={category.toLowerCase().replace(/\s+/g, '-')}
      className="scroll-mt-24 bg-gray-50 rounded-lg overflow-hidden mb-6"
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

      <div className="p-6 space-y-6">
        {filteredRequirements.length > 0 ? (
          filteredRequirements.map((requirement) => (
            <RequirementCard
              key={requirement.id}
              requirement={requirement}
              products={products[requirement.name] || []}
            />
          ))
        ) : (
          <div className="text-center py-4 text-gray-500">
            {getNoResultsMessage()}
          </div>
        )}
      </div>
    </section>
  );
};

export default CategorySection;