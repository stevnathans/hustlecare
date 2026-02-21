'use client';
import Link from 'next/link';
import { FiArrowRight, FiFileText, FiDollarSign } from 'react-icons/fi';
import { useMemo } from 'react';
import Image from 'next/image';

// This type matches the shape returned by /api/businesses after
// BusinessRequirement → template resolution. It no longer includes
// businessId, createdAt, or updatedAt — those belonged to the old
// Requirement model which has been replaced by the library system.
type Requirement = {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  necessity: string;
};

type BusinessCardProps = {
  id: string | number;
  name: string;
  image?: string;
  slug: string;
  category?: string;
  estimatedCost?: string;
  requirements: Requirement[];
  sortedCategories: string[];
  timeToLaunch?: string;
  groupedRequirements?: Record<string, Requirement[]>;
};

export default function BusinessCard({ 
  name, 
  image, 
  slug, 
  groupedRequirements = {},
}: BusinessCardProps) {
  const totalRequirements = useMemo(() => {
    if (!groupedRequirements || Object.keys(groupedRequirements).length === 0) {
      return 0;
    }
    return Object.keys(groupedRequirements).reduce((total, category) => {
      return total + (groupedRequirements[category]?.length || 0);
    }, 0);
  }, [groupedRequirements]);

  const costEstimateAvailable = totalRequirements > 0;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 h-full flex flex-col border border-gray-100">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
      
      <Link href={`/business/${slug}`} className="flex flex-col h-full relative z-20">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          {image ? (
            <>
              <Image 
                src={image} 
                alt={name} 
                width={800} 
                height={400} 
                className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mb-3 mx-auto">
                  <FiFileText className="w-8 h-8 text-gray-500" />
                </div>
                <span className="text-gray-500 text-sm font-medium">No Image Available</span>
              </div>
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
              }}></div>
            </div>
          )}
          
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
            <FiFileText className="w-3 h-3 text-emerald-600" />
            <span className="text-xs font-semibold text-gray-800">{totalRequirements}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 flex-grow flex flex-col">
          <h3 className="text-xl font-bold mb-4 text-gray-900 group-hover:text-emerald-700 transition-colors duration-200 leading-tight">
            {name}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6 flex-grow">
            <div className="bg-gray-50 rounded-xl p-3 group-hover:bg-emerald-50 transition-colors duration-200">
              <div className="flex items-center gap-2 mb-1">
                <FiFileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Requirements</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {totalRequirements}
              </div>
              <div className="text-xs text-gray-600">
                {totalRequirements === 1 ? 'item' : 'items'}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 group-hover:bg-blue-50 transition-colors duration-200">
              <div className="flex items-center gap-2 mb-1">
                <FiDollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cost Estimate</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {costEstimateAvailable ? 'Available' : 'Not available'}
              </div>
              <div className="text-xs text-gray-600">
                {costEstimateAvailable ? 'View details' : 'No requirements'}
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 group-hover:from-emerald-700 group-hover:to-emerald-800 transition-all duration-300 mt-auto">
            <div className="absolute inset-0 bg-white/20 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
            <div className="relative flex items-center justify-center gap-3 text-white py-3 px-6 font-semibold">
              <span>View Requirements</span>
              <FiArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </div>
        </div>
      </Link>

      <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}