// hooks/useFilterState.ts
//
// SIZE BAND (new): `options.sizeBand` now flows into every buildCostLines
// call, and `initialCost` is keyed by band (Record<SizeBand,
// RequirementsPageCostSummary>) rather than a flat object — see
// lib/cost-data.ts's getRequirementsPageCostSummary. sizeBand itself is
// NOT owned here: it's passed in from the caller (BusinessPageContent),
// which also needs the current band to compute fee ranges before calling
// this hook — lifting the state up one level avoids a chicken-and-egg
// dependency between the two.

import { useMemo, useState } from 'react';
import { isExcludedFromTotals } from '@/lib/necessity';
import {
  buildCostLines,
  summariseCostLines,
  DEFAULT_SIZE_BAND,
  type CostEngineProduct,
  type CostEngineRequirement,
  type CostLine,
  type CostRecurrence,
  type CostSource,
  type RequirementsPageCostSummary,
  type SizeBand,
} from '@/lib/cost-engine';

interface Requirement {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  category?: string | null;
  necessity: string;
  image?: string | null;
  excludedFromTotals?: boolean;
  quantity?: number;
  quantityByBand?: Partial<Record<SizeBand, number>>;
  recurrence?: CostRecurrence;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
  billingPeriod?: CostEngineProduct['billingPeriod'];
  bulkPricing?: { minQty: number; price: number }[];
}

interface CategoryState {
  showFilter: boolean;
  filter: string;
  showSearch: boolean;
  searchQuery: string;
}

export type FeeRange = { low: number; high: number } | null;

export interface UseFilterStateOptions {
  initialCost?: Record<SizeBand, RequirementsPageCostSummary> | null;
  productsLoaded?: boolean;
  feeRangesByRequirementName?: Record<string, FeeRange>;
  /** Which size band to price at. Defaults to Medium if omitted. */
  sizeBand?: SizeBand;
}

function toEngineRequirements(
  requirements: Requirement[],
  feeRanges?: Record<string, FeeRange>,
): CostEngineRequirement[] {
  return requirements.map((req) => ({
    id: req.id,
    templateId: req.templateId ?? null,
    name: req.name,
    category: req.category,
    necessity: req.necessity,
    excludedFromTotals: req.excludedFromTotals ?? isExcludedFromTotals(req.category || ''),
    feeSchedule: feeRanges?.[req.name] ?? null,
    quantity: req.quantity,
    quantityByBand: req.quantityByBand,
    recurrence: req.recurrence,
  }));
}

function toEngineProducts(products: Record<string, Product[]>): Record<string, CostEngineProduct[]> {
  const out: Record<string, CostEngineProduct[]> = {};
  for (const [name, list] of Object.entries(products)) {
    out[name] = (list ?? []).map((p) => ({
      id: p.id,
      price: p.price,
      billingPeriod: p.billingPeriod ?? null,
      bulkPricing: p.bulkPricing ?? null,
    }));
  }
  return out;
}

function stockTotals(lines: CostLine[]) {
  return lines
    .filter((l) => l.isStock)
    .reduce(
      (acc, l) => ({
        low: acc.low + l.total.low,
        typical: acc.typical + l.total.typical,
        high: acc.high + l.total.high,
      }),
      { low: 0, typical: 0, high: 0 },
    );
}

export const useFilterState = (
  requirements: Requirement[],
  products: Record<string, Product[]>,
  groupedRequirements: Record<string, Requirement[]>,
  sortedCategories: string[],
  options?: UseFilterStateOptions,
) => {
  const [categoryStates, setCategoryStates] = useState<Record<string, CategoryState>>({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalFilter, setGlobalFilter] = useState<string>('all');

  const productsLoaded = options?.productsLoaded ?? true;
  const initialCost = options?.initialCost ?? null;
  const feeRanges = options?.feeRangesByRequirementName;
  const sizeBand = options?.sizeBand ?? DEFAULT_SIZE_BAND;
  const useServerFallback = !productsLoaded && !!initialCost;
  const initialCostForBand = initialCost?.[sizeBand] ?? null;

  const availableNecessities = useMemo(() => {
    const set = new Set(requirements.map((req) => req.necessity));
    return Array.from(set);
  }, [requirements]);

  const engineProducts = useMemo(() => toEngineProducts(products), [products]);

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
    unfilteredRequiredSource,
    unfilteredSource,
  } = useMemo(() => {
    const lines = buildCostLines(toEngineRequirements(requirements, feeRanges), engineProducts, { sizeBand });

    const requiredSummary = summariseCostLines(lines, { includeOptional: false, sizeBand });
    const allSummary = summariseCostLines(lines, { includeOptional: true, sizeBand });
    const stock = stockTotals(lines);

    const coreLines = lines.filter((l) => !l.isStock);
    const counts: Record<string, number> = {};
    coreLines.forEach((line) => {
      const key = line.necessity.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
    });

    const base = {
      necessityCounts: counts,
      requiredCount: counts['required'] || 0,
      optionalCount: counts['optional'] || 0,
      unfilteredStockCount: lines.filter((l) => l.isStock).length,
    };

    if (useServerFallback && initialCostForBand) {
      return {
        ...base,
        unfilteredLowPrice: initialCostForBand.unfilteredLowPrice,
        unfilteredMediumPrice: initialCostForBand.unfilteredMediumPrice,
        unfilteredHighPrice: initialCostForBand.unfilteredHighPrice,
        unfilteredRequiredLowPrice: initialCostForBand.unfilteredRequiredLowPrice,
        unfilteredRequiredMediumPrice: initialCostForBand.unfilteredRequiredMediumPrice,
        unfilteredRequiredHighPrice: initialCostForBand.unfilteredRequiredHighPrice,
        unfilteredRequirementsWithProducts: initialCostForBand.unfilteredRequirementsWithProducts,
        unfilteredRequiredRequirementsWithProducts:
          initialCostForBand.unfilteredRequiredRequirementsWithProducts,
        unfilteredStockLowPrice: initialCostForBand.unfilteredStockLowPrice,
        unfilteredStockMedianPrice: initialCostForBand.unfilteredStockMedianPrice,
        unfilteredStockHighPrice: initialCostForBand.unfilteredStockHighPrice,
        unfilteredRequiredSource: initialCostForBand.requiredSource,
        unfilteredSource: initialCostForBand.allSource,
      };
    }

    return {
      ...base,
      unfilteredLowPrice: allSummary.oneTime.low,
      unfilteredMediumPrice: allSummary.oneTime.typical,
      unfilteredHighPrice: allSummary.oneTime.high,
      unfilteredRequiredLowPrice: requiredSummary.oneTime.low,
      unfilteredRequiredMediumPrice: requiredSummary.oneTime.typical,
      unfilteredRequiredHighPrice: requiredSummary.oneTime.high,
      unfilteredRequirementsWithProducts: allSummary.coverage.requirementsWithPricing,
      unfilteredRequiredRequirementsWithProducts: requiredSummary.coverage.requirementsWithPricing,
      unfilteredStockLowPrice: stock.low,
      unfilteredStockMedianPrice: stock.typical,
      unfilteredStockHighPrice: stock.high,
      unfilteredRequiredSource: requiredSummary.source as CostSource,
      unfilteredSource: allSummary.source as CostSource,
    };
  }, [requirements, engineProducts, feeRanges, sizeBand, useServerFallback, initialCostForBand]);

  const {
    totalRequirements,
    lowPrice,
    mediumPrice,
    highPrice,
    stockCount,
    stockLowPrice,
    stockMedianPrice,
    stockHighPrice,
  } = useMemo(() => {
    const matchesFilters = (req: Requirement) => {
      const matchesGlobalSearch = globalSearchQuery
        ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
          (req.description && req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
        : true;
      const matchesGlobalFilter = globalFilter === 'all' || req.necessity.toLowerCase() === globalFilter;
      return matchesGlobalSearch && matchesGlobalFilter;
    };

    const filteredReqs = requirements.filter(matchesFilters);
    const lines = buildCostLines(toEngineRequirements(filteredReqs, feeRanges), engineProducts, { sizeBand });
    const summary = summariseCostLines(lines, { includeOptional: true, sizeBand });
    const stock = stockTotals(lines);

    return {
      totalRequirements: lines.filter((l) => !l.isStock).length,
      lowPrice: summary.oneTime.low,
      mediumPrice: summary.oneTime.typical,
      highPrice: summary.oneTime.high,
      stockCount: lines.filter((l) => l.isStock).length,
      stockLowPrice: stock.low,
      stockMedianPrice: stock.typical,
      stockHighPrice: stock.high,
    };
  }, [requirements, engineProducts, feeRanges, sizeBand, globalSearchQuery, globalFilter]);

  const filteredCategories = useMemo(() => sortedCategories, [sortedCategories]);

  const getFilteredRequirements = (category: string): Requirement[] => {
    return (
      groupedRequirements[category]?.filter((req) => {
        const matchesGlobalSearch = globalSearchQuery
          ? req.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
            (req.description && req.description.toLowerCase().includes(globalSearchQuery.toLowerCase()))
          : true;
        const matchesGlobalFilter = globalFilter === 'all' || req.necessity.toLowerCase() === globalFilter;
        const matchesCategorySearch = categoryStates[category]?.searchQuery
          ? req.name.toLowerCase().includes(categoryStates[category].searchQuery.toLowerCase()) ||
            (req.description && req.description.toLowerCase().includes(categoryStates[category].searchQuery.toLowerCase()))
          : true;
        const matchesCategoryFilter =
          !categoryStates[category]?.filter ||
          categoryStates[category]?.filter === 'all' ||
          req.necessity.toLowerCase() === categoryStates[category]?.filter;

        return matchesGlobalSearch && matchesGlobalFilter && matchesCategorySearch && matchesCategoryFilter;
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
      [category]: { ...prev[category], showFilter: !prev[category]?.showFilter, showSearch: false },
    }));
  };

  const setFilter = (category: string, filter: string) => {
    setCategoryStates((prev) => ({ ...prev, [category]: { ...prev[category], filter } }));
  };

  const handleCategorySearchChange = (category: string, query: string) => {
    setCategoryStates((prev) => ({ ...prev, [category]: { ...prev[category], searchQuery: query } }));
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
    unfilteredRequiredLowPrice,
    unfilteredRequiredMediumPrice,
    unfilteredRequiredHighPrice,
    unfilteredLowPrice,
    unfilteredMediumPrice,
    unfilteredHighPrice,
    unfilteredRequirementsWithProducts,
    unfilteredRequiredRequirementsWithProducts,
    unfilteredRequiredSource,
    unfilteredSource,
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