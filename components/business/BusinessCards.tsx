'use client';
import Link from 'next/link';
import { FiArrowRight } from 'react-icons/fi';
import { useMemo } from 'react';

type Requirement = {
  id: string;
  name: string;
};

type BusinessCardProps = {
  id: string;
  name: string;
  image?: string;
  slug: string;
  groupedRequirements?: Record<string, Requirement[]>;
};

export default function BusinessCard({ 
  name, 
  image, 
  slug, 
  groupedRequirements = {},
}: BusinessCardProps) {
  // Calculate total requirements with proper calculation matching the details page
  const totalRequirements = useMemo(() => {
    // If groupedRequirements is empty or undefined, return 0
    if (!groupedRequirements || Object.keys(groupedRequirements).length === 0) {
      return 0;
    }
    
    // Sum up the length of each category's requirements array
    return Object.keys(groupedRequirements).reduce((total, category) => {
      // Safely access the requirements array with optional chaining
      return total + (groupedRequirements[category]?.length || 0);
    }, 0);
  }, [groupedRequirements]);

  return (
    <div className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition h-full flex flex-col">
      <Link href={`/business/${slug}`} className="flex flex-col h-full">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-40 bg-gray-200 flex items-center justify-center text-gray-500">
            <span>No Image Available</span>
          </div>
        )}

        <div className="p-4 flex-grow flex flex-col">
          <h3 className="text-lg font-semibold mb-2">{name}</h3>
          
          <div className="mb-4 flex-grow">
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">{totalRequirements}</span> {totalRequirements === 1 ? 'requirement' : 'requirements'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Est. cost:</span> View details for pricing
            </p>
          </div>

          <div className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition-colors mt-auto">
            View Requirements
            <FiArrowRight />
          </div>
        </div>
      </Link>
    </div>
  );
}