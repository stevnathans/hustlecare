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
}

const StickyQuickNavigation: React.FC<StickyQuickNavigationProps> = ({ 
  categories, 
  businessName,
  onRemove 
}) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isSticky, setIsSticky] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
              
              <div className="flex items-center gap-4">
                {isSticky && (
                  <span className="text-xs text-gray-500 hidden sm:block">
                    {businessName} Requirements
                  </span>
                )}
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
      `}} />
    </div>
  );
};

export default StickyQuickNavigation;