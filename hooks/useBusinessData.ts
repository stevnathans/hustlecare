/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Product as ProductType } from '@/types';

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
}

export interface UseBusinessDataInitial {
  business: Business;
  requirements: Requirement[];
}

const CATEGORY_ORDER = [
  'Legal',
  'Equipment',
  'Software',
  'Documents',
  'Branding',
  'Operating Expenses',
  'Uncategorized',
];

// ── Grouping helpers ──────────────────────────────────────────────────────
// Extracted so the same logic can run synchronously (for SSR-provided
// initial data) and inside the client-fetch effect (for the no-SSR-data path).
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
) => {
  const { switchBusiness } = useCart();

  // Captured once at mount — used only to decide whether the initial
  // business/requirements fetch can be skipped. Deliberately NOT reactive:
  // the parent may pass a new object literal on every render, and treating
  // that as a dependency would re-trigger the effect on every render.
  const hasInitialData = useRef(!!initialData).current;
  const initialDataRef = useRef(initialData);

  const [business, setBusiness]           = useState<Business | null>(initialData?.business ?? null);
  const [requirements, setRequirements]   = useState<Requirement[]>(initialData?.requirements ?? []);
  const [products, setProducts]           = useState<Record<string, ProductType[]>>({});
  const [error, setError]                 = useState<string | null>(null);
  const [isLoading, setIsLoading]         = useState<boolean>(!hasInitialData);
  const [groupedRequirements, setGroupedRequirements] = useState<Record<string, Requirement[]>>(
    () => groupByCategory(initialData?.requirements ?? [])
  );
  const [sortedCategories, setSortedCategories] = useState<string[]>(
    () => sortCategoryKeys(groupByCategory(initialData?.requirements ?? []))
  );

  // ── Single batch fetch — one request for all products ────────────────────
  // Previously this was a sequential per-requirement loop (N requests).
  // Now we hit /api/business/[slug]/products which returns a templateId→products
  // map in one DB query, then we remap it to requirementName→products for the UI.
  const fetchProducts = useCallback(async (
    requirementsData: Requirement[],
    businessName: string,
    businessSlug: string,
  ) => {
    try {
      const response = await fetch(`/api/business/${businessSlug}/products`);
      if (!response.ok) {
        setProducts({});
        return;
      }

      // productsByTemplateId: { [templateId]: Product[] }
      const productsByTemplateId: Record<string, any[]> = await response.json();

      // Remap to requirementName → ProductType[] for compatibility with
      // useFilterState and all components that key products by name.
      const productsByName: Record<string, ProductType[]> = {};

      for (const requirement of requirementsData) {
        const templateId = requirement.templateId;
        const rawProducts = templateId ? (productsByTemplateId[templateId] ?? []) : [];

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

            // Condition
            condition:            product.condition,
            usedDurationValue:    product.usedDurationValue,
            usedDurationUnit:     product.usedDurationUnit,
            hasReceipt:           product.hasReceipt,

            // Specifications
            brand:                product.brand,
            modelNumber:          product.modelNumber,
            voltage:              product.voltage,
            wattage:              product.wattage,
            dimensions:           product.dimensions,
            weight:               product.weight,
            weightUnit:           product.weightUnit,

            // Warranty
            warrantyType:            product.warrantyType,
            warrantyDurationValue:   product.warrantyDurationValue,
            warrantyDurationUnit:    product.warrantyDurationUnit,

            // Delivery / logistics
            deliveryAvailable:  product.deliveryAvailable || false,
            pickupLocation:     product.pickupLocation,
            leadTime:           product.leadTime,

            // Commercial terms
            negotiable:   product.negotiable || false,
            bulkPricing:  Array.isArray(product.bulkPricing) ? product.bulkPricing : [],
          })
        );
      }

      setProducts(productsByName);
    } catch {
      setProducts({});
    }
  }, []);

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
          // ── SSR fast path ────────────────────────────────────────────────
          // Business + requirements were already rendered server-side (see
          // page.tsx), so no fetch is needed here — this avoids the page
          // shipping an empty shell that only fills in after hydration.
          transformedBusiness = initialDataRef.current.business;
          requirementsData = initialDataRef.current.requirements;
        } else {
          // ── Client-fetch path (unchanged) ────────────────────────────────
          setIsLoading(true);

          // Business and requirements fetched in parallel.
          const [businessResponse, requirementsResponse] = await Promise.all([
            fetch(`/api/business/${slug}`),
            fetch(`/api/business/${slug}/requirements`),
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

        // One batch fetch for all products — runs on both paths.
        await fetchProducts(requirementsData, transformedBusiness.name, transformedBusiness.slug);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
        console.error('Error loading business data:', err);
      }
    };

    loadBusinessData();
    // hasInitialData / initialDataRef intentionally excluded — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, switchBusiness, fetchProducts]);

  return {
    business,
    requirements,
    products,
    error,
    isLoading,
    groupedRequirements,
    sortedCategories,
    refreshProducts,
  };
};