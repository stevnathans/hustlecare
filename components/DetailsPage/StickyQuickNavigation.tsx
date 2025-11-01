import React, { useState, useEffect } from 'react';

interface CategoryInfo {
  name: string;
  count: number;
}

interface StickyQuickNavigationProps {
  categories: CategoryInfo[];
  businessName: string;
}

const StickyQuickNavigation: React.FC<StickyQuickNavigationProps> = ({ 
  categories, 
  businessName 
}) => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Check if navigation should be sticky
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 100);

      // Find which section is currently in view
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

      // Find the first section in view
      const currentSection = sections.find(section => section && section.inView);
      if (currentSection) {
        setActiveSection(currentSection.id);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, categoryId: string) => {
    e.preventDefault();
    const element = document.getElementById(categoryId);
    if (element) {
      const offset = 120; // Account for sticky nav height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      className={`transition-all duration-300 ${
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
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                <svg 
                  className="w-4 h-4 mr-2 text-blue-600" 
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
              {isSticky && (
                <span className="text-xs text-gray-500 hidden sm:block">
                  {businessName} Requirements
                </span>
              )}
            </div>

            {/* Navigation Pills */}
            <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => {
                const categoryId = cat.name.toLowerCase().replace(/\s+/g, '-');
                const isActive = activeSection === categoryId;
                
                return (
                  <a
                    key={cat.name}
                    href={`#${categoryId}`}
                    onClick={(e) => handleNavClick(e, categoryId)}
                    className={`
                      inline-flex items-center px-4 py-2 rounded-full text-sm font-medium
                      transition-all duration-200 whitespace-nowrap
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                      }
                    `}
                    aria-label={`Jump to ${cat.name} requirements (${cat.count} items)`}
                    aria-current={isActive ? 'location' : undefined}
                  >
                    <span className={`
                      ${isActive ? 'font-semibold' : ''}
                    `}>
                      {cat.name}
                    </span>
                    <span className={`
                      ml-2 rounded-full px-2 py-0.5 text-xs font-semibold
                      ${isActive 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-300 text-gray-700'
                      }
                    `}>
                      {cat.count}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        {isSticky && (
          <div className="h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-emerald-600 transition-all duration-300"
              style={{
                width: `${(categories.findIndex(c => 
                  c.name.toLowerCase().replace(/\s+/g, '-') === activeSection
                ) + 1) / categories.length * 100}%`
              }}
            />
          </div>
        )}
      </nav>
    </div>
  );
};

export default StickyQuickNavigation;