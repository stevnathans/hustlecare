'use client';
import { useState } from 'react';
import ProductCard from 'components/product/ProductCard';
import { Product } from '@/types';

interface RequirementCardProps {
  requirement: {
    id: string;
    name: string;
    description: string;
    status: 'required' | 'optional';
    productCount: number;
    lowestPrice: number;
    imageUrl?: string;
  };
  matchingProducts?: Product[];
  isExpanded?: boolean;
  onToggle?: () => void;
  isProductInList?: (product: Product) => boolean;
  onToggleList?: (product: Product, business: string) => void; // Updated onToggleList signature
  getProductQuantity?: (productId: string) => number;
  business: string; // Add business prop
}

export default function RequirementCard({
  requirement,
  matchingProducts = [],
  isExpanded = false,
  onToggle = () => {},
  isProductInList = () => false,
  onToggleList = (product, business) => {}, // Updated default signature
  getProductQuantity = () => 1,
  business, // Receive business prop
}: RequirementCardProps) {
  // Use the provided isExpanded prop if available, otherwise manage state internally
  const [localIsExpanded, setLocalIsExpanded] = useState(false);
  const effectiveIsExpanded = isExpanded || localIsExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setLocalIsExpanded(!localIsExpanded);
    }
  };

  return (
    <div className="border rounded-lg bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Main content */}
      <div className="p-4">
        {/* First row: Image, Name/Status, Description */}
        <div className="flex items-start">
          {/* Image thumbnail (left) */}
          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden mr-4 flex-shrink-0">
            {requirement.imageUrl ? (
              <img 
                src={requirement.imageUrl} 
                alt={requirement.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
  
          {/* Name and Status (middle) */}
          <div className="flex-1 mr-4">
            <h3 className="font-medium text-lg">{requirement.name}</h3>
            <div className="flex items-center mt-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                requirement.status === 'required' ? 'bg-green-500' : 'bg-orange-500'
              }`}></span>
              <span className="text-sm capitalize">
                {requirement.status}
                {requirement.status === 'optional'}
              </span>
            </div>
          </div>
  
          {/* Description (right) */}
          <div className="flex-2 max-w-md">
            <p className="text-gray-600 text-sm">{requirement.description}</p>
          </div>
        </div>
  
        {/* Second row: Price and product count (centered) */}
        <div className="flex justify-center mt-4 text-sm">
          {requirement.productCount > 0 ? (
            <>
              <span className="mr-2 flex items-baseline gap-1">
                <span className="text-gray-600 text-sm">From</span>
                <span className="text-green-600 text-base font-semibold">${requirement.lowestPrice.toLocaleString()}</span>
              </span>
              
              <span className="text-gray-500 text-base">
                {requirement.productCount} {requirement.productCount === 1 ? 'option' : 'options'}
              </span>
            </>
          ) : (
            <span className="text-gray-400">No Recommended Products</span>
          )}
        </div>
      </div>
  
      {/* Recommended products toggle (only show if there are products) */}
      {matchingProducts.length > 0 && (
        <div className="px-4 pb-4 text-center">
          <button 
            onClick={handleToggle}
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center justify-center w-full"
          >
            {effectiveIsExpanded ? 'Hide Recommended Products ▲' : 'See Recommended Products ▼'}
          </button>
        </div>
      )}
  
  
      {/* Expanded content - Recommended products */}
      {isExpanded && matchingProducts.length > 0 && (
        <div className="border-t p-4 bg-gray-50">
          <h4 className="font-medium text-gray-700 mb-3">
            Recommended Products
          </h4>
          <div className="space-y-3">
            {matchingProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isInList={isProductInList(product)}
                onToggleList={onToggleList}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}