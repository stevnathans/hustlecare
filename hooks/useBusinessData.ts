/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
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
  const [business, setBusiness] = useState<Business | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [products, setProducts] = useState<Record<string, ProductType[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [groupedRequirements, setGroupedRequirements] = useState<Record<string, Requirement[]>>({});
  const [sortedCategories, setSortedCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // ── Business ──────────────────────────────────────────────────────────
        const businessResponse = await fetch(`/api/business/${slug}`);

        if (businessResponse.status === 404) {
          setError('Business not found');
          setIsLoading(false);
          return;
        }

        if (!businessResponse.ok) {
          throw new Error('Failed to load business data');
        }

        const businessData = await businessResponse.json();

        const transformedBusiness: Business = {
          id: businessData.id,
          name: businessData.name,
          slug: businessData.slug,
          description: businessData.description ?? null,
          image: businessData.image ?? null,
          location: businessData.location,
          address: businessData.address,
          phone: businessData.phone,
          email: businessData.email,
          hours: businessData.hours,
          socialLinks: businessData.socialLinks || [],
          reviewCount: businessData.reviewCount || 0,
          rating: businessData.rating,
          published: businessData.published ?? true,
          createdAt: businessData.createdAt ? new Date(businessData.createdAt) : new Date(),
          updatedAt: businessData.updatedAt ? new Date(businessData.updatedAt) : new Date(),
          userId: businessData.userId ?? null,
          categoryId: businessData.categoryId ?? null,
        };

        setBusiness(transformedBusiness);

        if (transformedBusiness.id) {
          switchBusiness(transformedBusiness.id);
        }

        // ── Requirements ──────────────────────────────────────────────────────
        const requirementsResponse = await fetch(`/api/business/${slug}/requirements`);
        if (!requirementsResponse.ok) {
          throw new Error('Failed to load requirements');
        }

        const requirementsData: Requirement[] = await requirementsResponse.json();
        setRequirements(requirementsData);

        const grouped = requirementsData.reduce(
          (groups: Record<string, Requirement[]>, req: Requirement) => {
            const category = req.category || 'Uncategorized';
            if (!groups[category]) groups[category] = [];
            groups[category].push(req);
            return groups;
          },
          {},
        );

        setGroupedRequirements(grouped);
        setSortedCategories(CATEGORY_ORDER.filter((cat) => grouped[cat]));

        // ── Products ──────────────────────────────────────────────────────────
        //
        // FIX: previously this fetched products one requirement at a time in a
        // sequential for-loop. With 20 requirements that's 20 serial round-trips,
        // each waiting for the previous to finish. This badly hurts Time to
        // Interactive (TTI) — a Core Web Vitals signal that affects ranking.
        //
        // We now fire all fetches concurrently with Promise.allSettled so:
        //   - Total wait time ≈ slowest single fetch (not sum of all fetches)
        //   - A single failed product fetch no longer breaks the entire page
        //   - Partial results are preserved even if some requirements 404

        const productResults = await Promise.allSettled(
          requirementsData.map((requirement) =>
            fetch(`/api/products?requirementName=${encodeURIComponent(requirement.name)}`).then(
              async (res) => {
                if (!res.ok) return { requirement, productsData: [] };
                const productsData = await res.json();
                return { requirement, productsData };
              },
            ),
          ),
        );

        const productsByRequirement: Record<string, ProductType[]> = {};

        for (const result of productResults) {
          if (result.status === 'rejected') {
            // Log but don't surface — partial failure shouldn't break the page
            console.warn('Failed to load products for a requirement:', result.reason);
            continue;
          }

          const { requirement, productsData } = result.value;

          productsByRequirement[requirement.name] = productsData.map(
            (product: any): ProductType => ({
              id: product.id,
              name: product.name,
              description: product.description || '',
              price: product.price || 0,
              image: product.image,
              unit: product.unit ?? 1,
              inCart: product.inCart || false,
              rating: product.rating || 0,
              reviews: product.reviews || 0,
              vendorId: product.vendorId,
              vendor: product.vendor,
              url: product.url || '',
              specifications: product.specifications || [],
              category: product.category || requirement.category || 'Uncategorized',
              requirementName: product.requirementName || requirement.name,
              quantity: product.quantity || 1,
              business: product.business || transformedBusiness.name,
              createdAt: product.createdAt || new Date().toISOString(),
              updatedAt: product.updatedAt || new Date().toISOString(),
            }),
          );
        }

        setProducts(productsByRequirement);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setIsLoading(false);
        console.error('Error loading business data:', err);
      }
    };

    loadBusinessData();
  }, [slug, switchBusiness]);

  return {
    business,
    requirements,
    products,
    error,
    isLoading,
    groupedRequirements,
    sortedCategories,
  };
};