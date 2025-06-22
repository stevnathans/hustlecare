// components/Dashboard/MyListsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ShoppingBag, DollarSign, Package, Plus, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";

interface SavedBusiness {
  id: string;
  name: string;
  totalCost: number;
  itemsCount: number;
  lastUpdated: string;
  slug: string;
}

export default function MyListsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalBusinesses: 0,
    totalItems: 0,
    totalCost: 0,
  });

  useEffect(() => {
    const fetchSavedBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile/lists");
        if (!response.ok) {
          throw new Error("Failed to load saved businesses");
        }

        const data = await response.json();
        const mappedBusinesses: SavedBusiness[] = data.lists.map((list: any) => ({
          id: list.businessId,
          name: list.businessName,
          totalCost: list.totalCost,
          itemsCount: list.totalItems,
          lastUpdated: list.updatedAt,
          slug: list.businessSlug,
        }));

        setBusinesses(mappedBusinesses);

        // Calculate total stats
        const totalCost = mappedBusinesses.reduce((sum, business) => sum + business.totalCost, 0);
        const totalItems = mappedBusinesses.reduce((sum, business) => sum + business.itemsCount, 0);
        
        setTotalStats({
          totalBusinesses: mappedBusinesses.length,
          totalItems,
          totalCost,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        console.error("Error loading saved businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedBusinesses();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading your saved businesses...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your saved business lists</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Lists</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your saved business lists and track your shopping preferences
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Businesses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalStats.totalBusinesses}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalStats.totalItems}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                ${totalStats.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <Link key={business.id} href={`/business/${business.slug}`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-blue-400" />
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDistanceToNow(new Date(business.lastUpdated), { addSuffix: true })}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {business.name}
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Items</span>
                  <span className="font-medium text-gray-900 dark:text-white">{business.itemsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${business.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Details
                </div>
              </div>
            </div>
          </Link>
        ))}

        {/* Add New Business Card */}
        <Link href="/business">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer">
            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Plus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Add New Business
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Start saving items from a new business
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}