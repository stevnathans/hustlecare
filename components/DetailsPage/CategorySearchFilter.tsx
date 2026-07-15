// components/DetailsPage/CategorySearchFilter.tsx
import React from 'react';
import { necessityOptions } from '@/lib/necessity';

interface CategorySearchFilterProps {
  category: string;
  showSearch: boolean;
  showFilter: boolean;
  searchQuery: string;
  filter: string; // 'all' or a lowercase necessity value
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: string) => void;
}

const CategorySearchFilter: React.FC<CategorySearchFilterProps> = ({
  category,
  showSearch,
  showFilter,
  searchQuery,
  filter,
  onSearchChange,
  onFilterChange
}) => {
  // Necessity/demand options for this specific category — e.g. Required/Optional
  // for most categories, or High/Medium/Low Demand for Stock. See lib/necessity.ts.
  const options = necessityOptions(category);

  return (
    <>
      {showSearch && (
        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder={`Search ${category} requirements...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {showFilter && (
        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200 flex gap-2 flex-wrap">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value.toLowerCase())}
              className={`px-3 py-1 text-xs rounded-md ${
                filter === opt.value.toLowerCase()
                  ? `${opt.bg.replace('bg-', 'bg-').replace('-50', '-500')} text-white`
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              style={
                filter === opt.value.toLowerCase()
                  ? { backgroundColor: opt.hexColor, color: '#fff' }
                  : undefined
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default CategorySearchFilter;