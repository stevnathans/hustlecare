"use client";

import { useState } from "react";
import BusinessDetailsClient from "./BusinessDetailsClient";
import CostCalculator from "@/components/business/CostCalculator";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  description: string;
  rating: number;
  reviews: number;
  vendorLogo?: string;
  specifications?: string[];
}

interface Requirement {
  id: string;
  name: string;
  category: string;
  description: string;
  products: Product[];
}

interface BusinessDetailsPageClientProps {
  groupedRequirements: Record<string, Requirement[]>;
  sortedCategories: string[];
}

export default function BusinessDetailsPageClient({
  groupedRequirements,
  sortedCategories,
}: BusinessDetailsPageClientProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const toggleProduct = (product: Product) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 mt-6">
      {/* Left: Requirements and Products */}
      <div className="flex-1">
        <BusinessDetailsClient
          groupedRequirements={groupedRequirements}
          sortedCategories={sortedCategories}
          selectedProducts={selectedProducts}
          onToggleProduct={toggleProduct}
        />
      </div>

      {/* Right: Cost Calculator */}
      <aside className="lg:w-[350px] lg:flex-shrink-0">
        <div className="sticky top-24">
          <CostCalculator selectedProducts={selectedProducts} />
        </div>
      </aside>
    </div>
  );
}
