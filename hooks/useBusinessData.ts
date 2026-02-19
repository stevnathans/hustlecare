/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Product as ProductType } from '@/types'; // Import Product type from types
import { Business as PrismaBusinessType } from '@prisma/client'; // Import Business from Prisma

interface Requirement {
  id: number;
  name: string;
  description?: string;
  category?: string;
  necessity: string;
  image?: string;
}

// Extended Business type that includes the Prisma fields plus additional ones
interface Business extends PrismaBusinessType {
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
  "Legal",
  "Equipment",
  "Software",
  "Documents",
  "Branding",
  "Operating Expenses",
  "Uncategorized",
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

        // Fetch business data
        const businessResponse = await fetch(`/api/business/${slug}`);
        
        // Handle 404 specifically
        if (businessResponse.status === 404) {
          setError('Business not found');
          setIsLoading(false);
          return;
        }
        
        if (!businessResponse.ok) {
          throw new Error('Failed to load business data');
        }
        
        const businessData = await businessResponse.json();
        
        // Transform business data to ensure all required fields are present
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

        // Fetch requirements
        const requirementsResponse = await fetch(`/api/business/${slug}/requirements`);
        if (!requirementsResponse.ok) {
          throw new Error('Failed to load requirements');
        }
        
        const requirementsData = await requirementsResponse.json();
        setRequirements(requirementsData);

        // Group requirements by category
        const grouped = requirementsData.reduce((groups: Record<string, Requirement[]>, req: Requirement) => {
          const category = req.category || "Uncategorized";
          if (!groups[category]) groups[category] = [];
          groups[category].push(req);
          return groups;
        }, {});

        setGroupedRequirements(grouped);
        setSortedCategories(CATEGORY_ORDER.filter(cat => grouped[cat]));

        // Fetch products for each requirement and transform them
        const productsByRequirement: Record<string, ProductType[]> = {};
        for (const requirement of requirementsData) {
          const productsResponse = await fetch(
            `/api/products?requirementName=${encodeURIComponent(requirement.name)}`
          );
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            
            // Transform products to match ProductType from @/types
            productsByRequirement[requirement.name] = productsData.map((product: any): ProductType => ({
              id:(product.id), // Convert to string to match ProductType
              name: product.name,
              description: product.description || '',
              price: product.price || 0,
              image: product.image,
              unit: product.unit ?? 1, // Ensure unit is always a number, default to 1
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
            }));
          }
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
    sortedCategories
  };
};