/* eslint-disable @typescript-eslint/no-unused-vars */
// components/Dashboard/CommunityTab.tsx
"use client";

import { useEffect, useState } from "react";
import SharedBusinessCard from "@/components/Community/SharedBusinessCard";
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Sparkles,
  Filter,
  X,
  Users,
  Package,
  DollarSign
} from "lucide-react";

interface SharedBusiness {
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
}

type SortOption = 'trending' | 'recent' | 'popular' | 'mostCopied';

export default function CommunityTab() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<SharedBusiness[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<SharedBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalShared: 0,
    totalViews: 0,
    totalCopies: 0,
  });

  useEffect(() => {
    fetchSharedBusinesses();
  }, [sortBy]);

  const fetchSharedBusinesses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community?sort=${sortBy}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shared businesses');
      }

      const data = await response.json();
      setBusinesses(data.businesses);
      setFilteredBusinesses(data.businesses);
      
      // Extract unique categories
      const categories = new Set<string>();
      data.businesses.forEach((b: SharedBusiness) => {
        b.categories?.forEach(cat => categories.add(cat));
      });
      setAllCategories(Array.from(categories).sort());

      // Calculate stats
      setStats({
        totalShared: data.businesses.length,
        totalViews: data.businesses.reduce((sum: number, b: SharedBusiness) => sum + b.viewCount, 0),
        totalCopies: data.businesses.reduce((sum: number, b: SharedBusiness) => sum + b.copyCount, 0),
      });
    } catch (error) {
      console.error('Error fetching shared businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter businesses based on search and categories
  useEffect(() => {
    let filtered = [...businesses];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        b =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(b =>
        b.categories?.some(cat => selectedCategories.includes(cat))
      );
    }

    setFilteredBusinesses(filtered);
  }, [searchQuery, selectedCategories, businesses]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
  };

  const getSortIcon = () => {
    switch (sortBy) {
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'recent':
        return <Clock className="w-4 h-4" />;
      case 'popular':
        return <Sparkles className="w-4 h-4" />;
      case 'mostCopied':
        return <Users className="w-4 h-4" />;
      default:
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  const handleCopy = (businessId: string) => {
    // Update the local copy count optimistically
    setBusinesses(prev =>
      prev.map(b =>
        b.id === businessId ? { ...b, copyCount: b.copyCount + 1 } : b
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading shared businesses...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Sparkles className="w-8 h-8 mr-3 text-emerald-500" />
          Community Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Discover and copy business setups shared by the community
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Shared Templates</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">{stats.totalShared}</p>
            </div>
            <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
              <Package className="w-6 h-6 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Total Views</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">
                {stats.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
              <Users className="w-6 h-6 text-purple-700 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Times Copied</p>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">
                {stats.totalCopies.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-emerald-200 dark:bg-emerald-800 rounded-full">
              <TrendingUp className="w-6 h-6 text-emerald-700 dark:text-emerald-300" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="trending">🔥 Trending</option>
            <option value="recent">🕐 Most Recent</option>
            <option value="popular">⭐ Most Popular</option>
            <option value="mostCopied">📋 Most Copied</option>
          </select>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {selectedCategories.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                {selectedCategories.length}
              </span>
            )}
          </button>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Filter by Category
              </h3>
              {selectedCategories.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredBusinesses.length} of {businesses.length} templates
        </p>
      </div>

      {/* Business Grid */}
      {filteredBusinesses.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <SharedBusinessCard
              key={business.id}
              business={business}
              onCopy={handleCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}