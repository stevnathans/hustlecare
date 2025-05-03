interface Requirement {
    imageUrl: unknown;
    id: string;
    name: string;
    category: string;
    description: string;
    isEssential: boolean;
    products: {
      id: string;
      name: string;
      price: number;
      vendor?: string;
      rating?: number;
    }[];
  }
  
  /**
   * Fetches requirements for a specific business type
   * @param businessType - The type of business (e.g., 'gym', 'restaurant')
   * @returns Promise<BusinessRequirement[]>
   */
  export async function getBusinessRequirements(businessType: string): Promise<Requirement[]> {
    try {
      // In a real app, this would call your actual API endpoint
      // const response = await fetch(`/api/business/${businessType}/requirements`);
      // if (!response.ok) throw new Error('Failed to fetch requirements');
      // return await response.json();
  
      // Mock data - replace with actual API call
      return mockBusinessRequirements[businessType] || [];
    } catch (error) {
      console.error(`Error fetching requirements for ${businessType}:`, error);
      return [];
    }
  }
  
  // Mock data - remove when real API is implemented
  const mockBusinessRequirements: Record<string, Requirement[]> = {
    gym: [
      {
          id: 'req-1',
          name: 'Commercial Gym Equipment',
          category: 'equipment',
          description: 'Essential machines and weights for gym operations',
          isEssential: true,
          products: [
              { id: 'prod-1', name: 'Treadmill Pro', price: 2500, vendor: 'FitnessCo', rating: 4.5 },
              { id: 'prod-2', name: 'Weight Set', price: 1800, vendor: 'IronWorks', rating: 4.2 }
          ],
          imageUrl: undefined
      },
      {
          id: 'req-2',
          name: 'Business License',
          category: 'legal',
          description: 'Required for operating a fitness facility',
          isEssential: true,
          products: [
              { id: 'prod-3', name: 'City Business License', price: 350, vendor: 'Local Government' }
          ],
          imageUrl: undefined
      }
    ],
    restaurant: [
      {
          id: 'req-3',
          name: 'Commercial Kitchen Equipment',
          category: 'equipment',
          description: 'Essential appliances for food preparation',
          isEssential: true,
          products: [
              { id: 'prod-4', name: 'Industrial Oven', price: 4200, vendor: 'ChefTools', rating: 4.7 },
              { id: 'prod-5', name: 'Refrigeration Unit', price: 3800, vendor: 'CoolKitchens', rating: 4.3 }
          ],
          imageUrl: undefined
      }
    ]
  };

 
  export async function getBusinessBySlug(slug: string) {
    try {
      const res = await fetch(`/api/businesses/${slug}`, { cache: "no-store" });
      if (!res.ok) return null;
      return res.json();
    } catch (error) {
      console.error("Failed to fetch business by slug:", error);
      return null;
    }
  }
  
  
  