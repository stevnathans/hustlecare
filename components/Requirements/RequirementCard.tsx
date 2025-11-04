"use client";
import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface RequirementCardProps {
  requirement: {
    category: string;
    id: number;
    name: string;
    description?: string;
    necessity: string;
    image?: string;
  };
  products?: Product[];
}

export default function RequirementCard({
  requirement,
  products = [],
}: RequirementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate derived values
  const productCount = products?.length || 0;
  const lowestPrice =
    productCount > 0 ? Math.min(...products.map((p) => p.price)) : 0;

  // Map necessity to status
  const getStatus = () => {
    const lowerCaseNecessity = requirement.necessity.toLowerCase();
    return lowerCaseNecessity.includes("required") ? "required" : "optional";
  };

  const status = getStatus();

  // Status configuration
  const statusConfig = {
    required: {
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: CheckCircleIcon,
      dotColor: "bg-green-500",
    },
    optional: {
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: ExclamationTriangleIcon,
      dotColor: "bg-amber-500",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <div className="group relative bg-white sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm hover:shadow-xl sm:hover:border-gray-200 transition-all duration-300 sm:mb-6 mb-4 overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Main content */}
      <div className="relative p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4">
          {/* Top Row: Image, Title, and Status - Mobile */}
          <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-0">
            {/* Enhanced Image */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner">
                {requirement.image ? (
                  <Image
                    src={requirement.image}
                    alt={requirement.name}
                    width={100} 
                    height={100}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Status indicator overlay */}
              <div
                className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center`}
              >
                <StatusIcon className={`h-3 w-3 ${config.color}`} />
              </div>
            </div>

            {/* Title and Status Badge */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 leading-tight mb-2">
                {requirement.name}
              </h3>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color} ${config.borderColor} border`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${config.dotColor}`}
                ></div>
                <span className="capitalize">{status}</span>
              </div>
            </div>
          </div>

          {/* Content Section - Full Width on Mobile */}
          <div className="w-full sm:flex-1 sm:min-w-0">
            {/* Description - Full Width */}
            {requirement.description && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4 sm:line-clamp-2">
                {requirement.description}
              </p>
            )}

            {/* Stats Section - Full Width on Mobile */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 sm:space-x-6">
                {/* Price Info */}
                {productCount > 0 ? (
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <CurrencyDollarIcon className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">
                        Starting from
                      </div>
                      <div className="text-lg font-bold text-emerald-600">
                        KSh {lowestPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="p-2 rounded-lg bg-gray-50">
                      <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="text-xs font-medium">No products</div>
                      <div className="text-sm">available</div>
                    </div>
                  </div>
                )}

                {/* Product Count */}
                {productCount > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">
                        Available
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {productCount}{" "}
                        {productCount === 1 ? "option" : "options"}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expand Toggle - Desktop */}
                {productCount > 0 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200 font-medium text-sm group/button ml-auto"
                  >
                    <span>
                      {isExpanded ? "Hide Products" : "View Products"}
                    </span>
                    {isExpanded ? (
                      <ChevronUpIcon className="h-4 w-4 transition-transform group-hover/button:translate-y-[-1px]" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4 transition-transform group-hover/button:translate-y-[1px]" />
                    )}
                  </button>
                )}
              </div>

              {/* Expand Toggle - Mobile (Full Width) */}
              {productCount > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="sm:hidden w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200 font-medium text-sm group/button"
                >
                  <span>{isExpanded ? "Hide Products" : "View Products"}</span>
                  {isExpanded ? (
                    <ChevronUpIcon className="h-4 w-4 transition-transform group-hover/button:translate-y-[-1px]" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 transition-transform group-hover/button:translate-y-[1px]" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Products Section */}
      {isExpanded && productCount > 0 && (
        <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
          <div className="p-2 sm:p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900">
                Recommended Products
              </h4>
              <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
            </div>

            <div className="grid gap-4">
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="transform transition-all duration-300"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: isExpanded
                      ? "slideInUp 0.5s ease-out forwards"
                      : "none",
                  }}
                >
                  <ProductCard
                    product={product}
                    requirementName={requirement.name}
                    category={requirement.category}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}