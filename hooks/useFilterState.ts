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

// Returns the median value from a sorted array of numbers.
// For an even-length array we take the lower of the two middle values so the
// result is always an actual product price rather than an interpolated average.
function getMedianPrice(sortedPrices: number[]): number {
  const mid = Math.floor(sortedPrices.length / 2);
  // Odd length  → exact middle element
  // Even length → lower middle element (a real price, not an average)
  return sortedPrices[sortedPrices.length % 2 !== 0 ? mid : mid - 1];
}

// Calculates low / median / high totals across all requirements that have
// at least one product. Each scale picks a different real product per
// requirement rather than applying an arbitrary multiplier to an average:
//
//   Low    → cheapest product per requirement  (budget / small-scale)
//   Median → median-priced product             (typical / medium-scale)
//   High   → most expensive product            (premium / large-scale)
//
function calculatePriceTotals(
  requirements: Requirement[],
  products: Record<string, Product[]>
): { low: number; median: number; high: number } {
  let low = 0;
  let median = 0;
  let high = 0;

  requirements.forEach((requirement) => {
    const reqProducts = products[requirement.name] || [];
    if (reqProducts.length === 0) return;

    const sorted = [...reqProducts].sort((a, b) => a.price - b.price);
    const prices = sorted.map((p) => p.price);

    low    += prices[0];
    median += getMedianPrice(prices);
    high   += prices[prices.length - 1];
  });

  return { low, median, high };
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

  // ── Unfiltered counts and price range (all requirements, ignores search/filter)
  // Used by BusinessHeader to show the top-level cost estimates and breakdown.
  const { requiredCount, optionalCount, unfilteredLowPrice, unfilteredMediumPrice, unfilteredHighPrice } =
    useMemo(() => {
      const required = requirements.filter(
        (req) => req.necessity.toLowerCase() === 'required'
      ).length;
      const optional = requirements.filter(
        (req) => req.necessity.toLowerCase() === 'optional'
      ).length;

      const { low, median, high } = calculatePriceTotals(requirements, products);

      return {
        requiredCount: required,
        optionalCount: optional,
        unfilteredLowPrice: low,
        unfilteredMediumPrice: median,
        unfilteredHighPrice: high,
      };
    }, [requirements, products]);

  // ── Filtered counts and price range (respects global search/filter state)
  // Used by components that react to the user's active search or filter.
  const { totalRequirements, lowPrice, mediumPrice, highPrice } = useMemo(() => {
    const filteredReqs = requirements.filter((req) => {
      const matchesGlobalSearch = globalSearchQuery
        ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (req.description &&
            req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
        : true;
      const matchesGlobalFilter =
        globalFilter === 'all' || req.necessity.toLowerCase() === globalFilter;
      return matchesGlobalSearch && matchesGlobalFilter;
    });

    const { low, median, high } = calculatePriceTotals(filteredReqs, products);

    return {
      totalRequirements: filteredReqs.length,
      lowPrice: low,
      mediumPrice: median,
      highPrice: high,
    };
  }, [requirements, products, globalSearchQuery, globalFilter]);

  const filteredCategories = useMemo(() => {
    return sortedCategories;
  }, [sortedCategories]);

  const getFilteredRequirements = (category: string): Requirement[] => {
    return (
      groupedRequirements[category]?.filter((req) => {
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
    setCategoryStates((prev) => ({
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
    setCategoryStates((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        showFilter: !prev[category]?.showFilter,
        showSearch: false,
      },
    }));
  };

  const setFilter = (category: string, filter: 'all' | 'required' | 'optional') => {
    setCategoryStates((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        filter,
      },
    }));
  };

  const handleCategorySearchChange = (category: string, query: string) => {
    setCategoryStates((prev) => ({
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
    unfilteredMediumPrice,
    unfilteredHighPrice,
    totalRequirements,
    lowPrice,
    mediumPrice,
    highPrice,
    filteredCategories,
    getFilteredRequirements,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange,
  };
};