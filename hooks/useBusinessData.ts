/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Product as ProductType, LegalFeeSchedule } from '@/types';
import { DEFAULT_MARKET, type MarketCode } from '@/lib/markets';

export interface Requirement {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  category?: string | null;
  necessity: string;
  image?: string | null;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  published: boolean;
  categoryId: number | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
  costMin: number | null;
  costMax: number | null;
  timeToLaunchMin: number | null;
  timeToLaunchMax: number | null;
  profitPotential: string | null;
  skillLevel: string | null;
  bestLocations: string[];
  location?: string;
  address?: any;
  phone?: any;
  email?: any;
  hours?: any;
  socialLinks?: never[];
  reviewCount?: number;
  rating?: any;

  // County-fee trade-class resolution (see lib/legalFeeSchedule.ts).
  // tradeClassId is this business's own override, if set.
  // effectiveTradeClassId is the one to actually use for fee lookups —
  // tradeClassId ?? category.defaultTradeClassId — expected to be
  // computed server-side by /api/business/[slug] and passed through here
  // as-is. Both are always `number | null`, never `undefined` — the
  // mapping below guarantees a null fallback. This matters because
  // CostCalculator's prop type is the real Prisma-generated Business
  // type, where tradeClassId is a required `number | null` column (not
  // optional) — an `undefined` here would be a type mismatch there.
  tradeClassId: number | null;
  effectiveTradeClassId: number | null;
}

export interface UseBusinessDataInitial {
  business: Business;
  requirements: Requirement[];
}

export interface FeeScheduleShellProductDetails {
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
}

const CATEGORY_ORDER = [
  'Legal',
  'Equipment',
  'Software',
  'Documents',
  'Branding',
  'Operating Expenses',
  'Stock',
  'Uncategorized',
];

function groupByCategory(reqs: Requirement[]): Record<string, Requirement[]> {
  return reqs.reduce((groups: Record<string, Requirement[]>, req) => {
    const category = req.category || 'Uncategorized';
    if (!groups[category]) groups[category] = [];
    groups[category].push(req);
    return groups;
  }, {});
}

function sortCategoryKeys(grouped: Record<string, Requirement[]>): string[] {
  return CATEGORY_ORDER.filter((cat) => grouped[cat]);
}

export const useBusinessData = (
  slug: string,
  initialData?: UseBusinessDataInitial,
  // Which market this page is rendering for — KE or US. Defaults to KE.
  // Threaded into every client-side fetch (initial load and any
  // refresh/re-fetch) so requirements and products stay scoped to the
  // correct market even after hydration. See
  // app/api/business/[slug]/requirements/route.ts and .../products/route.ts,
  // which both read this from ?market=.
  market: MarketCode = DEFAULT_MARKET,
) => {
  const { switchBusiness } = useCart();

  const hasInitialData = useRef(!!initialData).current;
  const initialDataRef = useRef(initialData);

  const [business, setBusiness]           = useState<Business | null>(initialData?.business ?? null);
  const [requirements, setRequirements]   = useState<Requirement[]>(initialData?.requirements ?? []);
  const [products, setProducts]           = useState<Record<string, ProductType[]>>({});
  const [feeSchedules, setFeeSchedules]   = useState<Record<string, LegalFeeSchedule[]>>({});
  const [countyFeeScheduleNames, setCountyFeeScheduleNames] = useState<Set<string>>(new Set());
  const [countyFeeShellProductIds, setCountyFeeShellProductIds] = useState<Record<string, number>>({});
  // Requirement name -> the shell product's editable fields (name,
  // description, image, url). Lets the front end show admin-edited
  // content instead of always falling back to the requirement template's
  // generic description.
  const [countyFeeShellProductDetails, setCountyFeeShellProductDetails] = useState<Record<string, FeeScheduleShellProductDetails>>({});
  const [error, setError]                 = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState<boolean>(!hasInitialData);
  const [groupedRequirements, setGroupedRequirements] = useState<Record<string, Requirement[]>>(
    () => groupByCategory(initialData?.requirements ?? [])
  );
  const [sortedCategories, setSortedCategories] = useState<string[]>(
    () => sortCategoryKeys(groupByCategory(initialData?.requirements ?? []))
  );

  const fetchProducts = useCallback(async (
    requirementsData: Requirement[],
    businessName: string,
    businessSlug: string,
  ) => {
    try {
      const response = await fetch(`/api/business/${businessSlug}/products?market=${market}`, { cache: 'no-store' });
      if (!response.ok) {
        setProducts({});
        setFeeSchedules({});
        setCountyFeeScheduleNames(new Set());
        setCountyFeeShellProductIds({});
        setCountyFeeShellProductDetails({});
        return;
      }

      const data: {
        products: Record<string, any[]>;
        feeSchedules: Record<string, any[]>;
        feeScheduleShellProductIds: Record<string, number>;
        feeScheduleShellProductDetails: Record<string, FeeScheduleShellProductDetails>;
      } = await response.json();

      const productsByName: Record<string, ProductType[]> = {};
      const feeSchedulesByName: Record<string, LegalFeeSchedule[]> = {};
      const feeNames = new Set<string>();
      const shellIdsByName: Record<string, number> = {};
      const shellDetailsByName: Record<string, FeeScheduleShellProductDetails> = {};
      const rawFeeSchedules = data.feeSchedules ?? {};
      const rawShellIds = data.feeScheduleShellProductIds ?? {};
      const rawShellDetails = data.feeScheduleShellProductDetails ?? {};

      for (const requirement of requirementsData) {
        const templateId = requirement.templateId;
        const rawProducts = templateId ? (data.products?.[templateId] ?? []) : [];

        productsByName[requirement.name] = rawProducts.map(
          (product: any): ProductType => ({
            id:              product.id,
            name:            product.name,
            description:     product.description || '',
            price:           product.price || 0,
            image:           product.image,
            unit:            product.unit ?? 1,
            inCart:          product.inCart || false,
            rating:          product.rating || 0,
            reviews:         product.reviews || 0,
            vendorId:        product.vendorId,
            vendor:          product.vendor,
            url:             product.url || '',
            specifications:  product.specifications || [],
            category:        product.category || requirement.category || 'Uncategorized',
            requirementName: product.requirementName || requirement.name,
            quantity:        product.quantity || 1,
            business:        product.business || businessName,
            createdAt:       product.createdAt || new Date().toISOString(),
            updatedAt:       product.updatedAt || new Date().toISOString(),

            condition:            product.condition,
            usedDurationValue:    product.usedDurationValue,
            usedDurationUnit:     product.usedDurationUnit,
            hasReceipt:           product.hasReceipt,

            brand:                product.brand,
            modelNumber:          product.modelNumber,
            voltage:              product.voltage,
            wattage:              product.wattage,
            dimensions:           product.dimensions,
            weight:               product.weight,
            weightUnit:           product.weightUnit,

            warrantyType:            product.warrantyType,
            warrantyDurationValue:   product.warrantyDurationValue,
            warrantyDurationUnit:    product.warrantyDurationUnit,

            deliveryAvailable:  product.deliveryAvailable || false,
            pickupLocation:     product.pickupLocation,
            leadTime:           product.leadTime,

            negotiable:   product.negotiable || false,
            bulkPricing:  Array.isArray(product.bulkPricing) ? product.bulkPricing : [],

            validityValue: product.validityValue,
            validityUnit: product.validityUnit,
            processingTimeMinDays: product.processingTimeMinDays,
            processingTimeMaxDays: product.processingTimeMaxDays,

            // Software — simple flat-price cadence, and/or package tiers.
            // See types/index.ts (Product.billingPeriod / Product.packages)
            // for how the two interact with `price` above.
            billingPeriod: product.billingPeriod ?? null,
            packages:      Array.isArray(product.packages) ? product.packages : [],
          })
        );

        const isFeeScheduleTemplate =
          templateId != null && Object.prototype.hasOwnProperty.call(rawFeeSchedules, templateId);

        feeSchedulesByName[requirement.name] = isFeeScheduleTemplate
          ? (rawFeeSchedules[templateId as number] as LegalFeeSchedule[])
          : [];

        if (isFeeScheduleTemplate) {
          feeNames.add(requirement.name);
          const shellId = templateId != null ? rawShellIds[templateId as number] : undefined;
          if (shellId != null) shellIdsByName[requirement.name] = shellId;
          const shellDetails = templateId != null ? rawShellDetails[templateId as number] : undefined;
          if (shellDetails) shellDetailsByName[requirement.name] = shellDetails;
        }
      }

      setProducts(productsByName);
      setFeeSchedules(feeSchedulesByName);
      setCountyFeeScheduleNames(feeNames);
      setCountyFeeShellProductIds(shellIdsByName);
      setCountyFeeShellProductDetails(shellDetailsByName);
    } catch {
      setProducts({});
      setFeeSchedules({});
      setCountyFeeScheduleNames(new Set());
      setCountyFeeShellProductIds({});
      setCountyFeeShellProductDetails({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market]);

  const refreshProducts = useCallback(() => {
    if (requirements.length > 0 && business) {
      fetchProducts(requirements, business.name, business.slug);
    }
  }, [requirements, business, fetchProducts]);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setError(null);

        let transformedBusiness: Business;
        let requirementsData: Requirement[];

        if (hasInitialData && initialDataRef.current) {
          transformedBusiness = initialDataRef.current.business;
          requirementsData = initialDataRef.current.requirements;
        } else {
          setIsLoading(true);

          const [businessResponse, requirementsResponse] = await Promise.all([
            fetch(`/api/business/${slug}`),
            fetch(`/api/business/${slug}/requirements?market=${market}`),
          ]);

          if (businessResponse.status === 404) {
            setError('Business not found');
            setIsLoading(false);
            return;
          }
          if (!businessResponse.ok) throw new Error('Failed to load business data');
          if (!requirementsResponse.ok) throw new Error('Failed to load requirements');

          const [businessData, requirementsResult]: [any, Requirement[]] = await Promise.all([
            businessResponse.json(),
            requirementsResponse.json(),
          ]);

          transformedBusiness = {
            id:              businessData.id,
            name:            businessData.name,
            slug:            businessData.slug,
            description:     businessData.description     ?? null,
            image:           businessData.image           ?? null,
            published:       businessData.published       ?? true,
            createdAt:       businessData.createdAt ? new Date(businessData.createdAt) : new Date(),
            updatedAt:       businessData.updatedAt ? new Date(businessData.updatedAt) : new Date(),
            userId:          businessData.userId          ?? null,
            categoryId:      businessData.categoryId      ?? null,
            costMin:         businessData.costMin         ?? null,
            costMax:         businessData.costMax         ?? null,
            timeToLaunchMin: businessData.timeToLaunchMin ?? null,
            timeToLaunchMax: businessData.timeToLaunchMax ?? null,
            profitPotential: businessData.profitPotential ?? null,
            skillLevel:      businessData.skillLevel      ?? null,
            bestLocations:   businessData.bestLocations   ?? [],
            location:        businessData.location,
            address:         businessData.address,
            phone:           businessData.phone,
            email:           businessData.email,
            hours:           businessData.hours,
            socialLinks:     businessData.socialLinks     || [],
            reviewCount:     businessData.reviewCount     || 0,
            rating:          businessData.rating,
            tradeClassId:          businessData.tradeClassId          ?? null,
            effectiveTradeClassId: businessData.effectiveTradeClassId ?? null,
          };
          requirementsData = requirementsResult;

          setBusiness(transformedBusiness);
          setRequirements(requirementsData);

          const grouped = groupByCategory(requirementsData);
          setGroupedRequirements(grouped);
          setSortedCategories(sortCategoryKeys(grouped));
        }

        if (transformedBusiness.id) {
          switchBusiness(transformedBusiness.id);
        }

        await fetchProducts(requirementsData, transformedBusiness.name, transformedBusiness.slug);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
        console.error('Error loading business data:', err);
      }
    };

    loadBusinessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, switchBusiness, fetchProducts, market]);

  return {
    business,
    requirements,
    products,
    feeSchedules,
    countyFeeScheduleNames,
    countyFeeShellProductIds,
    countyFeeShellProductDetails,
    error,
    isLoading,
    groupedRequirements,
    sortedCategories,
    refreshProducts,
  };
};