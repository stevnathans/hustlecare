import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';

interface Requirement {
  id: number;
  name: string;
  description?: string;
  category?: string;
  necessity: string;
  image?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  image?: string;
}

interface Business {
  address: any;
  phone: any;
  email: any;
  hours: any;
  socialLinks: never[];
  reviewCount: number;
  rating: any;
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  location?: string;
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
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [groupedRequirements, setGroupedRequirements] = useState<Record<string, Requirement[]>>({});
  const [sortedCategories, setSortedCategories] = useState<string[]>([]);

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        setError(null);

        const businessResponse = await fetch(`/api/business/${slug}`);
        if (!businessResponse.ok) throw new Error('Failed to load business data');
        const businessData = await businessResponse.json();
        setBusiness(businessData);
       
        if (businessData.id) {
          switchBusiness(businessData.id);
        }

        const requirementsResponse = await fetch(`/api/business/${slug}/requirements`);
        if (!requirementsResponse.ok) throw new Error('Failed to load requirements');
        const requirementsData = await requirementsResponse.json();
        setRequirements(requirementsData);

        const grouped = requirementsData.reduce((groups: Record<string, Requirement[]>, req: Requirement) => {
          const category = req.category || "Uncategorized";
          if (!groups[category]) groups[category] = [];
          groups[category].push(req);
          return groups;
        }, {});

        setGroupedRequirements(grouped);
        setSortedCategories(CATEGORY_ORDER.filter(cat => grouped[cat]));

        const productsByRequirement: Record<string, Product[]> = {};
        for (const requirement of requirementsData) {
          const productsResponse = await fetch(
            `/api/products?requirementName=${encodeURIComponent(requirement.name)}`
          );
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            productsByRequirement[requirement.name] = productsData;
          }
        }
        setProducts(productsByRequirement);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
    groupedRequirements,
    sortedCategories
  };
};