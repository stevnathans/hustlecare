/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Product as ProductType } from '@/types';

interface Requirement {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  category?: string | null;
  necessity: string;
  image?: string | null;
}

interface Business {
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

const CATEGORY_ORDER = [
  'Legal',
  'Equipment',
  'Software',
  'Documents',
  'Branding',
  'Operating Expenses',
  'Uncategorized',
];

export const useBusinessData = (slug: string) => {
  const { switchBusiness } = useCart();
  const [business, setBusiness]                       = useState<Business | null>(null);
  const [requirements, setRequirements]               = useState<Requirement[]>([]);
  const [products, setProducts]                       = useState<Record<string, ProductType[]>>({});
  const [error, setError]                             = useState<string | null>(null);
  const [isLoading, setIsLoading]                     = useState<boolean>(true);
  const [groupedRequirements, setGroupedRequirements] = useState<Record<string, Requirement[]>>({});
  const [sortedCategories, setSortedCategories]       = useState<string[]>([]);

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
        setIsLoading(true);
        setError(null);

        // ── Business and requirements fetched in parallel ─────────────────
        // Previously these were sequential. Parallelising saves one full
        // round-trip on every page load.
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

        const [businessData, requirementsData]: [any, Requirement[]] = await Promise.all([
          businessResponse.json(),
          requirementsResponse.json(),
        ]);

        const transformedBusiness: Business = {
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

        setBusiness(transformedBusiness);
        setRequirements(requirementsData);

        if (transformedBusiness.id) {
          switchBusiness(transformedBusiness.id);
        }

        const grouped = requirementsData.reduce(
          (groups: Record<string, Requirement[]>, req: Requirement) => {
            const category = req.category || 'Uncategorized';
            if (!groups[category]) groups[category] = [];
            groups[category].push(req);
            return groups;
          },
          {}
        );

        setGroupedRequirements(grouped);
        setSortedCategories(CATEGORY_ORDER.filter((cat) => grouped[cat]));

        // ── One batch fetch for all products ──────────────────────────────
        await fetchProducts(requirementsData, transformedBusiness.name, transformedBusiness.slug);

        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
        console.error('Error loading business data:', err);
      }
    };

    loadBusinessData();
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