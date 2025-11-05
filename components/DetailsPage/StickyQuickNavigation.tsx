/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';

interface CategoryInfo {
  name: string;
  count: number;
}

interface StickyQuickNavigationProps {
  categories: CategoryInfo[];
  businessName: string;
  onRemove?: () => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  globalFilter: 'all' | 'required' | 'optional';
  setGlobalFilter: (filter: 'all' | 'required' | 'optional') => void;
}

const StickyQuickNavigation: React.FC<StickyQuickNavigationProps> = ({ 
  categories, 
  businessName,
  onRemove,
  globalSearchQuery,
  setGlobalSearchQuery,
  globalFilter,
  setGlobalFilter
}) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isSticky, setIsSticky] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 100);

      const sections = categories.map(cat => {
        const id = cat.name.toLowerCase().replace(/\s+/g, '-');
        const element = document.getElementById(id);
        if (element) {
          const rect = element.getBoundingClientRect();
          return {
            id,
            top: rect.top,
            bottom: rect.bottom,
            inView: rect.top < window.innerHeight / 3 && rect.bottom > 0
          };
        }
        return null;
      }).filter(Boolean);

      const currentSection = sections.find(section => section && section.inView);
      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  // Scroll active tab into view
  useEffect(() => {
    if (activeSection && scrollContainerRef.current && !isCollapsed) {
      const activeElement = scrollContainerRef.current.querySelector(`[data-category="${activeSection}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeSection, isCollapsed]);

  // Hide scroll hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowScrollHint(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, categoryId: string) => {
    e.preventDefault();
    const element = document.getElementById(categoryId);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    setIsSearchExpanded(false);
    setIsFilterExpanded(false);
  };

  const handleToggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isFilterExpanded) setIsFilterExpanded(false);
  };

  const handleToggleFilter = () => {
    setIsFilterExpanded(!isFilterExpanded);
    if (isSearchExpanded) setIsSearchExpanded(false);
  };

  const clearGlobalSearch = () => {
    setGlobalSearchQuery('');
  };

  // Collapsed state - floating button
  if (isCollapsed) {
    return (
      <button
        onClick={handleToggleCollapse}
        className={`fixed left-4 z-50 bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-all duration-300 ${
          isSticky ? 'top-4' : 'top-20'
        }`}
        aria-label="Show navigation"
        title="Show navigation"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>
    );
  }

  return (
    <div 
      className={`transition-all duration-500 ease-in-out ${
        isSticky 
          ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' 
          : 'relative'
      }`}
    >
      <nav 
        className="bg-white border-b-2 border-gray-200"
        aria-label="Category quick navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <svg 
                  className="w-4 h-4 mr-2 text-emerald-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M13 10V3L4 14h7v7l9-11h-7z" 
                  />
                </svg>
                Quick Navigation
              </h3>
              
              <div className="flex items-center gap-2">
                {isSticky && (
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {businessName} Requirements
                  </span>
                )}
                
                {/* Search Button/Input */}
                <div className="flex items-center">
                  {isSearchExpanded ? (
                    <div className="relative flex items-center animate-expand-width">
                      <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                        <svg 
                          className="h-4 w-4 text-gray-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                          />
                        </svg>
                      </div>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search..."
                        className="block w-48 pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        value={globalSearchQuery}
                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                      />
                      {globalSearchQuery && (
                        <button
                          onClick={clearGlobalSearch}
                          className="absolute inset-y-0 right-8 flex items-center pr-2"
                        >
                          <svg 
                            className="h-4 w-4 text-gray-400 hover:text-gray-600" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={handleToggleSearch}
                        className="absolute inset-y-0 right-0 flex items-center pr-2"
                      >
                        <svg 
                          className="h-4 w-4 text-gray-400 hover:text-gray-600" 
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
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleToggleSearch}
                      className={`p-1.5 rounded-full transition-colors duration-200 ${
                        globalSearchQuery 
                          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label="Search requirements"
                      title="Search requirements"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Filter Button/Dropdown */}
                <div className="flex items-center">
                  {isFilterExpanded ? (
                    <div className="flex items-center gap-2 animate-expand-width">
                      <select
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value as 'all' | 'required' | 'optional')}
                        className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="all">All</option>
                        <option value="required">Required</option>
                        <option value="optional">Optional</option>
                      </select>
                      <button
                        onClick={handleToggleFilter}
                        className="p-1"
                      >
                        <svg 
                          className="h-4 w-4 text-gray-400 hover:text-gray-600" 
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
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleToggleFilter}
                      className={`p-1.5 rounded-full transition-colors duration-200 ${
                        globalFilter !== 'all' 
                          ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' 
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                      aria-label="Filter requirements"
                      title="Filter requirements"
                    >
                      <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
                        />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Collapse Button */}
                <button
                  onClick={handleToggleCollapse}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                  aria-label="Collapse navigation"
                  title="Collapse navigation"
                >
                  <svg 
                    className="w-5 h-5" 
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
                </button>
              </div>
            </div>

            <div className="relative">
              {/* Left scroll arrow */}
              {showScrollHint && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <div className="bg-gradient-to-r from-white to-transparent pr-8 pl-2 py-4">
                    <svg 
                      className="w-5 h-5 text-gray-400 animate-pulse" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M15 19l-7-7 7-7" 
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Scrollable navigation pills */}
              <div 
                ref={scrollContainerRef}
                className="flex flex-nowrap gap-2 overflow-x-auto pb-2 hide-scrollbar"
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
                {categories.map((cat) => {
                  const categoryId = cat.name.toLowerCase().replace(/\s+/g, '-');
                  const isActive = activeSection === categoryId;
                  
                  return (
                    <a
                      key={cat.name}
                      href={`#${categoryId}`}
                      data-category={categoryId}
                      onClick={(e) => handleNavClick(e, categoryId)}
                      className={`
                        inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                        transition-all duration-300 ease-in-out whitespace-nowrap flex-shrink-0
                        ${isActive 
                          ? 'bg-emerald-600 text-white shadow-md transform scale-105' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                        }
                      `}
                      aria-label={`Jump to ${cat.name} requirements (${cat.count} items)`}
                      aria-current={isActive ? 'location' : undefined}
                    >
                      <span className={`
                        transition-all duration-300 ${isActive ? 'font-semibold' : ''}
                      `}>
                        {cat.name}
                      </span>
                      <span className={`
                        ml-2 rounded-full px-2 py-0.5 text-xs font-semibold
                        transition-all duration-300
                        ${isActive 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-gray-300 text-gray-700'
                        }
                      `}>
                        {cat.count}
                      </span>
                    </a>
                  );
                })}
              </div>

              {/* Right scroll arrow */}
              {showScrollHint && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <div className="bg-gradient-to-l from-white to-transparent pl-8 pr-2 py-4">
                    <svg 
                      className="w-5 h-5 text-gray-400 animate-pulse" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 5l7 7-7 7" 
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {isSticky && (
          <div className="h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700 transition-all duration-500 ease-out"
              style={{
                width: `${(categories.findIndex(c => 
                  c.name.toLowerCase().replace(/\s+/g, '-') === activeSection
                ) + 1) / categories.length * 100}%`
              }}
            />
          </div>
        )}
      </nav>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes expand-width {
          from {
            width: 0;
            opacity: 0;
          }
          to {
            width: auto;
            opacity: 1;
          }
        }
        
        .animate-expand-width {
          animation: expand-width 0.3s ease-in-out;
        }
      `}} />
    </div>
  );
};

export default StickyQuickNavigation;