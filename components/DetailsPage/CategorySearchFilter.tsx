import React from 'react';

interface CategorySearchFilterProps {
  category: string;
  showSearch: boolean;
  showFilter: boolean;
  searchQuery: string;
  filter: 'all' | 'required' | 'optional';
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: 'all' | 'required' | 'optional') => void;
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
        <div className="px-6 py-3 bg-gray-100 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('required')}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === 'required' ? 'bg-emerald-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Required
          </button>
          <button
            onClick={() => onFilterChange('optional')}
            className={`px-3 py-1 text-xs rounded-md ${
              filter === 'optional' ? 'bg-yellow-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Optional
          </button>
        </div>
      )}
    </>
  );
};

export default CategorySearchFilter;