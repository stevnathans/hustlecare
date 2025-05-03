"use client";

import { useState, useEffect } from 'react';

interface CategoryNavigationProps {
  categories: string[];
}

export default function CategoryNavigation({ categories }: CategoryNavigationProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      { threshold: 0.5, rootMargin: '0px 0px -50% 0px' }
    );

    // Observe all category sections
    categories.forEach(category => {
      const id = category.replace(/\s+/g, "-").toLowerCase();
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [categories]);

  return (
    <nav className="flex gap-3 flex-wrap overflow-x-auto pt-4 pb-6 border-b border-gray-200">
      {categories.map((category) => {
        const id = category.replace(/\s+/g, "-").toLowerCase();
        const isActive = activeCategory === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
              isActive 
                ? 'bg-green-100 border-green-400 text-green-800' 
                : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-blue-100 hover:border-blue-400'
            }`}
            onClick={() => setActiveCategory(id)}
          >
            {category}
          </a>
        );
      })}
    </nav>
  );
}