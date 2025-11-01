// app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BusinessCard from "@/components/business/BusinessCards";
import {
  SearchIcon,
  MapPin,
  TrendingUp,
  Grid3X3,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define the Requirement type to match BusinessCard component
interface Requirement {
  id: number; 
  name: string;
  description: string | null;
  image: string | null;
  category: string | null;
  necessity: string;
  businessId: number;
  createdAt: Date;
  updatedAt: Date;
}

type Business = {
  id: string;
  name: string;
  image?: string;
  slug: string;
  groupedRequirements?: Record<string, Requirement[]>; // Changed from unknown[] to Requirement[]
};

type ApiResponse = {
  success: boolean;
  businesses?: Business[];
  total?: number;
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("keyword") || ""
  );
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("name");

  const keyword = searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";

  // Perform server search
  const performSearch = async (query: string, locationFilter?: string) => {
    if (!query.trim()) {
      setBusinesses([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("keyword", query);
      if (locationFilter) {
        params.set("location", locationFilter);
      }

      const response = await fetch(`/api/businesses/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }

      const data = await response.json() as ApiResponse;
      setBusinesses(data.businesses || []);
      setTotalResults(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setBusinesses([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Search when keyword or location changes
  useEffect(() => {
    performSearch(keyword, location);
  }, [keyword, location]);

  // Sort businesses based on selected sort option
  const sortedBusinesses = [...businesses].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleNewSearch = () => {
    if (searchTerm.trim()) {
      const params = new URLSearchParams();
      params.set("keyword", searchTerm);
      if (location) {
        params.set("location", location);
      }
      window.location.href = `/search?${params.toString()}`;
    }
  };

  // Simple no results component
  const NoResultsComponent = () => (
    <div className="flex justify-center items-center py-16">
      <div className="bg-white rounded-xl p-8 max-w-lg mx-auto shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-2">
            No businesses found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t find any businesses matching{" "}
            <span className="font-medium">&quot;{keyword}&quot;</span>
            {location && <span> in {location}</span>}.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Try these suggestions:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use different or more general keywords</li>
              <li>• Check your spelling</li>
              <li>• Remove location filters</li>
              <li>• Browse our business categories</li>
            </ul>
          </div>
          <Button
            onClick={() => setSearchTerm("")}
            variant="outline"
            className="mt-4"
          >
            Clear Search
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Search Header */}
      <div className="bg-white shadow-sm border-b border-gray-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Search Section */}
          <div className="py-6 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex-1 max-w-3xl">
                <div className="relative">
                  <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all duration-200">
                    <SearchIcon className="text-gray-400 ml-4" size={20} />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search for businesses, services, or categories..."
                      className="border-none bg-transparent focus:ring-0 focus-visible:ring-0 text-gray-900 placeholder-gray-500 px-4 py-3"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleNewSearch();
                        }
                      }}
                    />
                    <Button
                      onClick={handleNewSearch}
                      className="mr-2 bg-emerald-600 hover:bg-emerald-700 rounded-md px-6 py-2 font-medium transition-colors duration-200"
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50"
                  onClick={() => alert("Advanced filters coming soon!")}
                >
                  <SlidersHorizontal size={16} />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Search Stats & Controls */}
          {keyword && (
            <div className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp size={16} className="text-emerald-600" />
                    <span className="font-medium">
                      {loading
                        ? "Searching..."
                        : `${totalResults.toLocaleString()} ${
                            totalResults === 1 ? "business" : "businesses"
                          } found`}
                    </span>
                    {location && (
                      <>
                        <span className="text-gray-400">•</span>
                        <MapPin size={14} className="text-gray-400" />
                        <span>{location}</span>
                      </>
                    )}
                  </div>
                </div>

                {!loading && sortedBusinesses.length > 0 && (
                  <div className="flex items-center gap-4">
                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 font-medium">
                        Sort by:
                      </span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="text-sm border border-gray-200 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="name">Name A-Z</option>
                      </select>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center border border-gray-200 rounded-md p-1">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded ${
                          viewMode === "grid"
                            ? "bg-emerald-100 text-emerald-600"
                            : "text-gray-400 hover:text-gray-600"
                        } transition-colors duration-200`}
                      >
                        <Grid3X3 size={16} />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded ${
                          viewMode === "list"
                            ? "bg-emerald-100 text-emerald-600"
                            : "text-gray-400 hover:text-gray-600"
                        } transition-colors duration-200`}
                      >
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-emerald-600 border-t-transparent absolute top-0"></div>
            </div>
            <p className="mt-4 text-gray-600 font-medium">
              Searching businesses...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-16">
            <div className="bg-white border border-red-200 rounded-xl p-8 max-w-md mx-auto shadow-sm">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-red-900 font-semibold mb-2">
                  Search Error
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* No Results State */}
        {!loading && !error && sortedBusinesses.length === 0 && keyword && (
          <NoResultsComponent />
        )}

        {/* Welcome State - No keyword */}
        {!loading && !error && !keyword && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <SearchIcon className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Discover Local Businesses
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                Search through thousands of businesses to find exactly what
                you&apos;re looking for.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto">
                {["Restaurants", "Services", "Retail", "Healthcare"].map(
                  (category) => (
                    <button
                      key={category}
                      onClick={() => {
                        setSearchTerm(category);
                        const params = new URLSearchParams();
                        params.set("keyword", category);
                        window.location.href = `/search?${params.toString()}`;
                      }}
                      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-emerald-700"
                    >
                      {category}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Grid/List */}
        {!loading && !error && sortedBusinesses.length > 0 && (
          <>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              }
            >
              {sortedBusinesses.map((business) => (
                <BusinessCard
                  key={business.id}
                  id={business.id}
                  name={business.name}
                  image={business.image}
                  slug={business.slug}
                  groupedRequirements={business.groupedRequirements} requirements={[]} sortedCategories={[]}                />
              ))}
            </div>

            {/* Show all results info */}
            <div className="text-center mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing all {totalResults.toLocaleString()} results
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}