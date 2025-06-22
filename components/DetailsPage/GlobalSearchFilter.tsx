import React from 'react';

interface GlobalSearchFilterProps {
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  globalFilter: 'all' | 'required' | 'optional';
  setGlobalFilter: (filter: 'all' | 'required' | 'optional') => void;
}

const GlobalSearchFilter: React.FC<GlobalSearchFilterProps> = ({
  globalSearchQuery,
  setGlobalSearchQuery,
  globalFilter,
  setGlobalFilter
}) => {
  const clearGlobalSearch = () => {
    setGlobalSearchQuery('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex flex-col sm:flex-row gap-4 w-full">
        {/* Search input - now taking available space */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search all requirements..."
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={globalSearchQuery}
            onChange={(e) => setGlobalSearchQuery(e.target.value)}
          />
          {globalSearchQuery && (
            <button
              onClick={clearGlobalSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter dropdown - adjusted to align properly */}
        <div className="flex items-center gap-2 sm:w-auto w-full">
          <span className="text-sm text-gray-500 whitespace-nowrap">Filter:</span>
          <select
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value as 'all' | 'required' | 'optional')}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
          >
            <option value="all">All</option>
            <option value="required">Required</option>
            <option value="optional">Optional</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchFilter;