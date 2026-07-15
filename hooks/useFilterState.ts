// hooks/useFilterState.ts
import { useState, useMemo } from 'react';
import { isExcludedFromTotals } from '@/lib/necessity';

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
  filter: string; // 'all' or a lowercase necessity value
  showSearch: boolean;
  searchQuery: string;
}

function getMedianPrice(sortedPrices: number[]): number {
  const mid = Math.floor(sortedPrices.length / 2);
  return sortedPrices[sortedPrices.length % 2 !== 0 ? mid : mid - 1];
}

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

function countWithProducts(requirements: Requirement[], products: Record<string, Product[]>): number {
  return requirements.filter((req) => (products[req.name] || []).length > 0).length;
}

// Splits a requirement list into "core" (counts toward the headline
// requirement total and cost estimate) and "stock" (products a business
// sells — tracked and priced separately since inventory is a scalable,
// ongoing decision rather than a fixed one-time startup requirement).
// See lib/necessity.ts: EXCLUDED_FROM_TOTALS_CATEGORIES.
function splitCoreAndStock(requirements: Requirement[]): { core: Requirement[]; stock: Requirement[] } {
  const core: Requirement[] = [];
  const stock: Requirement[] = [];
  requirements.forEach((req) => {
    if (isExcludedFromTotals(req.category || '')) {
      stock.push(req);
    } else {
      core.push(req);
    }
  });
  return { core, stock };
}

export const useFilterState = (
  requirements: Requirement[],
  products: Record<string, Product[]>,
  groupedRequirements: Record<string, Requirement[]>,
  sortedCategories: string[]
) => {
  const [categoryStates, setCategoryStates] = useState<Record<string, CategoryState>>({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalFilter, setGlobalFilter] = useState<string>('all');

  // ── Necessity values actually present, for building filter dropdowns ──────
  const availableNecessities = useMemo(() => {
    const set = new Set(requirements.map((req) => req.necessity));
    return Array.from(set);
  }, [requirements]);

  // ── Unfiltered counts and price ranges ─────────────────────────────────
  // "Core" figures exclude Stock (see splitCoreAndStock) so the headline
  // "N requirements to start" and cost estimate reflect actual fixed
  // startup requirements, not open-ended inventory.
  //
  // Within core, cost is further split by necessity:
  //   - unfilteredRequired*  → REQUIRED items only. This is the number
  //     BusinessHeader shows by default, since "cost to start" should mean
  //     the mandatory minimum, not mandatory + every optional extra.
  //   - unfiltered* (no "Required" in the name) → required + optional
  //     combined, same as before. Shown when the person opts in via the
  //     "Include optional items" toggle in BusinessHeader.
  const {
    necessityCounts,
    requiredCount,
    optionalCount,
    unfilteredLowPrice,
    unfilteredMediumPrice,
    unfilteredHighPrice,
    unfilteredRequiredLowPrice,
    unfilteredRequiredMediumPrice,
    unfilteredRequiredHighPrice,
    unfilteredRequirementsWithProducts,
    unfilteredRequiredRequirementsWithProducts,
    unfilteredStockCount,
    unfilteredStockLowPrice,
    unfilteredStockMedianPrice,
    unfilteredStockHighPrice,
  } = useMemo(() => {
    const { core, stock } = splitCoreAndStock(requirements);
    const requiredOnly = core.filter((req) => req.necessity.toLowerCase() === 'required');

    const counts: Record<string, number> = {};
    core.forEach((req) => {
      const key = req.necessity.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    const coreTotals = calculatePriceTotals(core, products);
    const requiredTotals = calculatePriceTotals(requiredOnly, products);
    const stockTotals = calculatePriceTotals(stock, products);

    return {
      necessityCounts: counts,
      requiredCount: counts['required'] || 0,
      optionalCount: counts['optional'] || 0,
      unfilteredLowPrice: coreTotals.low,
      unfilteredMediumPrice: coreTotals.median,
      unfilteredHighPrice: coreTotals.high,
      unfilteredRequiredLowPrice: requiredTotals.low,
      unfilteredRequiredMediumPrice: requiredTotals.median,
      unfilteredRequiredHighPrice: requiredTotals.high,
      unfilteredRequirementsWithProducts: countWithProducts(core, products),
      unfilteredRequiredRequirementsWithProducts: countWithProducts(requiredOnly, products),
      unfilteredStockCount: stock.length,
      unfilteredStockLowPrice: stockTotals.low,
      unfilteredStockMedianPrice: stockTotals.median,
      unfilteredStockHighPrice: stockTotals.high,
    };
  }, [requirements, products]);

  // ── Filtered counts and price range (respects global search/filter state) ─
  // Same core/stock split applied here so the interactive numbers stay
  // consistent with the unfiltered headline numbers above. This path is
  // unaffected by the required-only default — it reflects whatever
  // necessity/demand filter the person has actively selected.
  const { totalRequirements, lowPrice, mediumPrice, highPrice, stockCount, stockLowPrice, stockMedianPrice, stockHighPrice } = useMemo(() => {
    const matchesFilters = (req: Requirement) => {
      const matchesGlobalSearch = globalSearchQuery
        ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (req.description &&
            req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
        : true;
      const matchesGlobalFilter =
        globalFilter === 'all' || req.necessity.toLowerCase() === globalFilter;
      return matchesGlobalSearch && matchesGlobalFilter;
    };

    const filteredReqs = requirements.filter(matchesFilters);
    const { core, stock } = splitCoreAndStock(filteredReqs);

    const coreTotals = calculatePriceTotals(core, products);
    const stockTotals = calculatePriceTotals(stock, products);

    return {
      totalRequirements: core.length,
      lowPrice: coreTotals.low,
      mediumPrice: coreTotals.median,
      highPrice: coreTotals.high,
      stockCount: stock.length,
      stockLowPrice: stockTotals.low,
      stockMedianPrice: stockTotals.median,
      stockHighPrice: stockTotals.high,
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

  const setFilter = (category: string, filter: string) => {
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
    availableNecessities,
    necessityCounts,
    requiredCount,
    optionalCount,
    // Required-only (default cost display) and full required+optional
    // (shown when "Include optional items" is toggled on) — both exclude Stock.
    unfilteredRequiredLowPrice,
    unfilteredRequiredMediumPrice,
    unfilteredRequiredHighPrice,
    unfilteredLowPrice,
    unfilteredMediumPrice,
    unfilteredHighPrice,
    unfilteredRequirementsWithProducts,
    unfilteredRequiredRequirementsWithProducts,
    // Stock is tracked separately from the core requirement count/cost —
    // see splitCoreAndStock() above.
    unfilteredStockCount,
    unfilteredStockLowPrice,
    unfilteredStockMedianPrice,
    unfilteredStockHighPrice,
    totalRequirements,
    lowPrice,
    mediumPrice,
    highPrice,
    stockCount,
    stockLowPrice,
    stockMedianPrice,
    stockHighPrice,
    filteredCategories,
    getFilteredRequirements,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange,
  };
};