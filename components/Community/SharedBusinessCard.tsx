/* eslint-disable @typescript-eslint/no-unused-vars */
// components/Community/SharedBusinessCard.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  Eye,
  Copy,
  User,
  CheckCircle,
  TrendingUp,
  Package
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface SharedBusinessCardProps {
  business: {
    id: string;
    name: string;
    totalCost: number;
    itemsCount: number;
    sharedAt: string;
    viewCount: number;
    copyCount: number;
    slug: string;
    author: {
      name: string;
      avatar?: string;
      verified?: boolean;
    };
    categories?: string[];
    description?: string;
  };
  onCopy?: (businessId: string) => void;
}

export default function SharedBusinessCard({ business, onCopy }: SharedBusinessCardProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copying || copied) return;

    setCopying(true);
    try {
      // Call the copy API
      const response = await fetch(`/api/community/${business.id}/copy`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to copy business');
      }

      const data = await response.json();
      setCopied(true);
      
      // Callback to parent
      if (onCopy) {
        onCopy(business.id);
      }

      // Redirect to the new business after a short delay
      setTimeout(() => {
        window.location.href = `/business/${data.newBusinessSlug}`;
      }, 1000);
    } catch (error) {
      console.error('Error copying business:', error);
      alert('Failed to copy business. Please try again.');
      setCopying(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">
              {business.name}
            </h3>
            {business.description && (
              <p className="text-sm text-white/90 line-clamp-2">
                {business.description}
              </p>
            )}
          </div>
          <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm ml-2 flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Author Info */}
        <div className="flex items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            {business.author.avatar ? (
              <Image
                src={business.author.avatar}
                alt={business.author.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            {business.author.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                <CheckCircle className="w-4 h-4 text-blue-500 fill-current" />
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {business.author.name}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Shared {formatDistanceToNow(new Date(business.sharedAt), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Categories */}
        {business.categories && business.categories.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {business.categories.slice(0, 3).map((category, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full"
                >
                  {category}
                </span>
              ))}
              {business.categories.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs rounded-full">
                  +{business.categories.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Package className="w-3 h-3 mr-1" />
              Items
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {business.itemsCount}
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <DollarSign className="w-3 h-3 mr-1" />
              Total Cost
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              ${(business.totalCost / 1000).toFixed(1)}K
            </p>
          </div>
        </div>

        {/* Community Stats */}
        <div className="flex items-center justify-between mb-4 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
            <Eye className="w-4 h-4 mr-1.5" />
            <span className="font-medium">{business.viewCount.toLocaleString()}</span>
            <span className="text-blue-500 dark:text-blue-500 ml-1">views</span>
          </div>
          <div className="w-px h-4 bg-blue-200 dark:bg-blue-700"></div>
          <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
            <Copy className="w-4 h-4 mr-1.5" />
            <span className="font-medium">{business.copyCount.toLocaleString()}</span>
            <span className="text-emerald-500 dark:text-emerald-500 ml-1">copies</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`/community/${business.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </a>

          <button
            onClick={handleCopy}
            disabled={copying || copied}
            className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium ${
              copied
                ? 'bg-green-500 text-white'
                : copying
                ? 'bg-emerald-400 text-white cursor-wait'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : copying ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Copying...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy to My List
              </>
            )}
          </button>
        </div>

        {/* Success message after copy */}
        {copied && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-xs text-green-800 dark:text-green-400 text-center">
              ✨ Business copied! Redirecting to your list...
            </p>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </div>
  );
}