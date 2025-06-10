
interface Requirement {
    id: string;
    name: string;
    description: string;
    status: 'required' | 'optional';
    productCount: number;
    lowestPrice: number;
    imageUrl?: string;
  }
  
  interface Product {
    unit: number;
    inCart: boolean; 
    id: string;
    name: string;
    image?: string;
    price: number;
    description: string;
    rating: number;
    reviews: number;
    vendorLogo?: string;
    specifications?: string[];
    category: string;
    requirement: string;
    quantity: number; 
    business: string;
  }
  
  interface CostRange {
    lowPrice: number;
    highPrice: number;
  }
  
  export function calculateEstimatedCostRange(
    groupedRequirements: Record<string, Requirement[]> | undefined,
    allProducts: Product[] | undefined
  ): CostRange {
    let lowPrice = 0;
    let highPrice = 0;
  
    if (!groupedRequirements || !allProducts || allProducts.length === 0) {
      return { lowPrice: 0, highPrice: 0 };
    }
  
    for (const category in groupedRequirements) {
      groupedRequirements[category]?.forEach(requirement => {
        const requirementName = requirement.name.toLowerCase();
        const matchingProducts = allProducts
          ?.filter(product => product.name.toLowerCase().includes(requirementName))
          .slice(0, 1); // Consider only the first matching product for simplicity
  
        if (matchingProducts && matchingProducts.length > 0 && matchingProducts[0].price !== null && matchingProducts[0].price !== undefined) {
          const price = matchingProducts[0].price;
          lowPrice += price;
          highPrice += price; // For the simplified case, assuming one of each
        }
      });
    }
  
    return { lowPrice, highPrice };
  }
  
  export function formatPriceRange(lowPrice: number, highPrice: number): string {
    if (lowPrice === 0 && highPrice === 0) return 'No cost estimate';
    if (lowPrice === highPrice) return `~$${lowPrice.toLocaleString()}`;
    return `$${lowPrice.toLocaleString()} - $${highPrice.toLocaleString()}`;
  }