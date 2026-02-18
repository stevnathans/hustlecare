/* eslint-disable @typescript-eslint/no-unused-vars */
// app/community/[sharedBusinessId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Copy, 
  Eye, 
  User, 
  Package, 
  DollarSign,
  ShoppingBag,
  CheckCircle,
  Calendar
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";

interface BusinessItem {
  id: string;
  name: string;
  image?: string;
  requirementName: string;
  quantity: number;
  price: number;
}

interface SharedBusinessDetails {
  id: string;
  name: string;
  description?: string;
  business: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
  };
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  stats: {
    viewCount: number;
    copyCount: number;
    totalItems: number;
    totalCost: number;
  };
  sharedAt: string;
  categories: string[];
  itemsByCategory: Record<string, BusinessItem[]>;
}

export default function SharedBusinessPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [business, setBusiness] = useState<SharedBusinessDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessDetails();
  }, [params.sharedBusinessId]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/${params.sharedBusinessId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load business details');
      }

      const data = await response.json();
      setBusiness(data);
    } catch (error) {
      console.error('Error fetching business:', error);
      setError('Failed to load business details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    setCopying(true);
    try {
      const response = await fetch(`/api/community/${params.sharedBusinessId}/copy`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to copy business');
      }

      const data = await response.json();
      
      // Redirect to the new business
      router.push(`/business/${data.newBusinessSlug}`);
    } catch (error) {
      console.error('Error copying business:', error);
      alert('Failed to copy business. Please make sure you are logged in.');
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-red-900 dark:text-red-400 mb-2">
              Business Not Found
            </h2>
            <p className="text-red-700 dark:text-red-500 mb-6">
              {error || 'This shared business could not be found or is no longer available.'}
            </p>
            <button
              onClick={() => router.push('/community')}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {business.name}
                </h1>
                {business.description && (
                  <p className="text-white/90 text-lg">
                    {business.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Author and Stats */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              {/* Author Info */}
              <div className="flex items-center">
                <div className="relative">
                  {business.author.avatar ? (
                    <Image
                      src={business.author.avatar}
                      alt={business.author.name}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}
                  {business.author.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                      <CheckCircle className="w-5 h-5 text-blue-500 fill-current" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Shared by
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {business.author.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(new Date(business.sharedAt), { addSuffix: true })}
                  </p>
                </div>
              </div>

              {/* Copy Button */}
              <button
                onClick={handleCopy}
                disabled={copying}
                className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl ${
                  copying
                    ? 'bg-emerald-400 text-white cursor-wait'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700'
                }`}
              >
                {copying ? (
                  <span className="flex items-center">
                    <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    Copying...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Copy className="w-5 h-5 mr-2" />
                    Copy to My List
                  </span>
                )}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                  <Eye className="w-4 h-4 mr-2" />
                  Views
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.stats.viewCount.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                  <Copy className="w-4 h-4 mr-2" />
                  Copies
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.stats.copyCount.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                  <Package className="w-4 h-4 mr-2" />
                  Items
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.stats.totalItems}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Total Cost
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${business.stats.totalCost.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Categories */}
            {business.categories.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Categories Included
                </h3>
                <div className="flex flex-wrap gap-2">
                  {business.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Items by Category */}
        <div className="space-y-6">
          {business.categories.map((category) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {category}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {business.itemsByCategory[category].length} items
                </p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {business.itemsByCategory[category].map((item: BusinessItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      {item.image && (
                        <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {item.requirementName}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Qty: {item.quantity}
                        </p>
                        <p className="font-bold text-gray-900 dark:text-white">
                          ${(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">
            Ready to use this template?
          </h3>
          <p className="text-white/90 mb-6">
            Copy this business setup to your account and customize it to your needs
          </p>
          <button
            onClick={handleCopy}
            disabled={copying}
            className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg"
          >
            {copying ? 'Copying...' : 'Copy to My List'}
          </button>
        </div>
      </div>
    </div>
  );
}
