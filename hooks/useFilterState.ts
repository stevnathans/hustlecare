import { useState, useMemo } from 'react';

// Matches the resolved shape from useBusinessData / /api/business/[slug]/requirements.
// description, category, and image come from the database and can be null.
interface Requirement {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  category?: string | null;
  necessity: string;
  image?: string | null;
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

export const useFilterState = (
  requirements: Requirement[],
  products: Record<string, Product[]>,
  groupedRequirements: Record<string, Requirement[]>,
  sortedCategories: string[]
) => {
  const [categoryStates, setCategoryStates] = useState<Record<string, CategoryState>>({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalFilter, setGlobalFilter] = useState<'all' | 'required' | 'optional'>('all');

  const { requiredCount, optionalCount, unfilteredLowPrice, unfilteredHighPrice } = useMemo(() => {
    const required = requirements.filter(req => req.necessity.toLowerCase() === 'required').length;
    const optional = requirements.filter(req => req.necessity.toLowerCase() === 'optional').length;

    let minTotal = 0;
    let maxTotal = 0;

    requirements.forEach(requirement => {
      const requirementProducts = products[requirement.name] || [];
      if (requirementProducts.length > 0) {
        const prices = requirementProducts.map(p => p.price);
        minTotal += Math.min(...prices);
        maxTotal += Math.max(...prices);
      }
    });

    return {
      requiredCount: required,
      optionalCount: optional,
      unfilteredLowPrice: minTotal,
      unfilteredHighPrice: maxTotal,
    };
  }, [requirements, products]);

  const { totalRequirements, lowPrice, highPrice } = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;
    let total = 0;

    const filteredReqs = requirements.filter(req => {
      const matchesGlobalSearch = globalSearchQuery
        ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
        : true;
      const matchesGlobalFilter =
        globalFilter === 'all' || req.necessity.toLowerCase() === globalFilter;
      return matchesGlobalSearch && matchesGlobalFilter;
    });

    filteredReqs.forEach(requirement => {
      const requirementProducts = products[requirement.name] || [];
      if (requirementProducts.length > 0) {
        const prices = requirementProducts.map(p => p.price);
        minTotal += Math.min(...prices);
        maxTotal += Math.max(...prices);
      }
      total++;
    });

    return {
      totalRequirements: total,
      lowPrice: minTotal,
      highPrice: maxTotal,
    };
  }, [requirements, products, globalSearchQuery, globalFilter]);

  const filteredCategories = useMemo(() => {
    return sortedCategories;
  }, [sortedCategories]);

  const getFilteredRequirements = (category: string): Requirement[] => {
    return (
      groupedRequirements[category]?.filter(req => {
        const matchesGlobalSearch = globalSearchQuery
          ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            (req.description &&
              req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
          : true;
        const matchesGlobalFilter =
          globalFilter === 'all' || req.necessity.toLowerCase() === globalFilter;
        const matchesCategorySearch = categoryStates[category]?.searchQuery
          ? req.name
              .toLowerCase()
              .includes(categoryStates[category].searchQuery.toLowerCase()) ||
            (req.description &&
              req.description
                .toLowerCase()
                .includes(categoryStates[category].searchQuery.toLowerCase()))
          : true;
        const matchesCategoryFilter =
          !categoryStates[category]?.filter ||
          categoryStates[category]?.filter === 'all' ||
          req.necessity.toLowerCase() === categoryStates[category]?.filter;

        return (
          matchesGlobalSearch &&
          matchesGlobalFilter &&
          matchesCategorySearch &&
          matchesCategoryFilter
        );
      }) || []
    );
  };

  const toggleCategorySearch = (category: string) => {
    setCategoryStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        showSearch: !prev[category]?.showSearch,
        showFilter: false,
        searchQuery: prev[category]?.searchQuery || '',
      },
    }));
  };

  const toggleFilter = (category: string) => {
    setCategoryStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        showFilter: !prev[category]?.showFilter,
        showSearch: false,
      },
    }));
  };

  const setFilter = (category: string, filter: 'all' | 'required' | 'optional') => {
    setCategoryStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        filter,
      },
    }));
  };

  const handleCategorySearchChange = (category: string, query: string) => {
    setCategoryStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        searchQuery: query,
      },
    }));
  };

  return {
    categoryStates,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalFilter,
    setGlobalFilter,
    requiredCount,
    optionalCount,
    unfilteredLowPrice,
    unfilteredHighPrice,
    totalRequirements,
    lowPrice,
    highPrice,
    filteredCategories,
    getFilteredRequirements,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange,
  };
};