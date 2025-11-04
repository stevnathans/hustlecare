import React from 'react';

interface CategorySectionHeaderProps {
  category: string;
  filteredCount: number;
  totalCount: number;
  showSearch: boolean;
  showFilter: boolean;
  onToggleSearch: () => void;
  onToggleFilter: () => void;
}

const CategorySectionHeader: React.FC<CategorySectionHeaderProps> = ({
  category,
  filteredCount,
  totalCount,
  showSearch,
  showFilter,
  onToggleSearch,
  onToggleFilter
}) => {
  return (
    <div className="bg-gray-200 px-4 py-3 sm:px-6 sm:py-4">
      {/* Mobile Layout: Two rows */}
      <div className="block sm:hidden">
        {/* Top Row: Title and Icons */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">
            {category}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={onToggleFilter}
              className={`p-2 rounded-full ${showFilter ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label="Filter requirements"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
            </button>
            <button
              onClick={onToggleSearch}
              className={`p-2 rounded-full ${showSearch ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              aria-label="Search requirements"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom Row: Requirement Count */}
        <div className="text-left">
          <span className="text-gray-600 text-sm font-medium">
            {filteredCount} of {totalCount} Requirements
          </span>
        </div>
      </div>

      {/* Desktop Layout: Single row */}
      <div className="hidden sm:flex justify-between items-center">
        <h2 className="text-2xl font-semibold">
          {category}
        </h2>
        <span className="text-gray-600 text-sm font-medium">
          {filteredCount} of {totalCount} Requirements
        </span>
        <div className="flex gap-2">
          <button
            onClick={onToggleFilter}
            className={`p-2 rounded-full ${showFilter ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Filter requirements"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
          </button>
          <button
            onClick={onToggleSearch}
            className={`p-2 rounded-full ${showSearch ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
            aria-label="Search requirements"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategorySectionHeader;