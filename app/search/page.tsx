// app/search/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BusinessCard from "@/components/business/BusinessCards";
import {
  SearchIcon,
  Filter,
  MapPin,
  Clock,
  TrendingUp,
  Grid3X3,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Business = {
  id: string;
  name: string;
  image?: string;
  slug: string;
  groupedRequirements?: Record<string, any[]>;
};

// Fuzzy search utility functions (same as MenuSearchBar)
const calculateLevenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
};

const normalizeString = (str: string): string => {
  return str.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
};

const fuzzyMatch = (query: string, target: string, threshold: number = 0.6): boolean => {
  const normalizedQuery = normalizeString(query);
  const normalizedTarget = normalizeString(target);

  // Exact match (highest priority)
  if (normalizedTarget.includes(normalizedQuery)) {
    return true;
  }

  // Word boundary matches
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
  const targetWords = normalizedTarget.split(' ').filter(word => word.length > 0);

  // Check if all query words have fuzzy matches in target words
  const allWordsMatch = queryWords.every(queryWord => {
    return targetWords.some(targetWord => {
      if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
        return true;
      }
      
      const distance = calculateLevenshteinDistance(queryWord, targetWord);
      const maxLength = Math.max(queryWord.length, targetWord.length);
      const similarity = 1 - (distance / maxLength);
      
      return similarity >= threshold;
    });
  });

  if (allWordsMatch) {
    return true;
  }

  // Overall string similarity for short queries
  if (normalizedQuery.length <= 6) {
    const distance = calculateLevenshteinDistance(normalizedQuery, normalizedTarget);
    const maxLength = Math.max(normalizedQuery.length, normalizedTarget.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= (threshold + 0.1); // Slightly higher threshold for overall similarity
  }

  return false;
};

const scoreMatch = (query: string, target: string): number => {
  const normalizedQuery = normalizeString(query);
  const normalizedTarget = normalizeString(target);

  // Exact match gets highest score
  if (normalizedTarget === normalizedQuery) {
    return 100;
  }

  // Starts with query gets high score
  if (normalizedTarget.startsWith(normalizedQuery)) {
    return 90;
  }

  // Contains query gets good score
  if (normalizedTarget.includes(normalizedQuery)) {
    return 80;
  }

  // Word boundary matches
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 0);
  const targetWords = normalizedTarget.split(' ').filter(word => word.length > 0);

  let totalScore = 0;
  let matchedWords = 0;

  queryWords.forEach(queryWord => {
    let bestWordScore = 0;
    
    targetWords.forEach(targetWord => {
      let wordScore = 0;
      
      if (targetWord === queryWord) {
        wordScore = 10;
      } else if (targetWord.startsWith(queryWord) || queryWord.startsWith(targetWord)) {
        wordScore = 8;
      } else if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) {
        wordScore = 6;
      } else {
        const distance = calculateLevenshteinDistance(queryWord, targetWord);
        const maxLength = Math.max(queryWord.length, targetWord.length);
        const similarity = 1 - (distance / maxLength);
        
        if (similarity >= 0.6) {
          wordScore = similarity * 5;
        }
      }
      
      bestWordScore = Math.max(bestWordScore, wordScore);
    });
    
    if (bestWordScore > 0) {
      totalScore += bestWordScore;
      matchedWords++;
    }
  });

  // Return average score, bonus for matching all words
  if (matchedWords === 0) return 0;
  const averageScore = totalScore / queryWords.length;
  const completenessBonus = matchedWords === queryWords.length ? 10 : 0;
  
  return Math.min(79, averageScore + completenessBonus); // Cap at 79 to keep below exact matches
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("keyword") || ""
  );
  const [totalResults, setTotalResults] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("relevance");

  const keyword = searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";

  // Fetch all businesses for fuzzy search
  const fetchAllBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses/search'); // You'll need this endpoint
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAllBusinesses(data.results || []);
      }
    } catch (error) {
      console.error("Error fetching all businesses:", error);
    }
  };

  // Initialize all businesses on component mount
  useEffect(() => {
    fetchAllBusinesses();
  }, []);

  // Perform client-side fuzzy search
  const performFuzzySearch = (query: string, locationFilter?: string) => {
    if (!query.trim()) {
      setBusinesses([]);
      setTotalResults(0);
      return;
    }

    let matches = allBusinesses
      .filter(business => fuzzyMatch(query, business.name))
      .map(business => ({
        ...business,
        score: scoreMatch(query, business.name)
      }));

    // Apply location filter if needed
    if (locationFilter) {
      // You can implement location filtering here based on your business data structure
      // matches = matches.filter(business => business.location?.includes(locationFilter));
    }

    // Sort by relevance score
    matches = matches.sort((a, b) => b.score - a.score);

    setBusinesses(matches);
    setTotalResults(matches.length);
  };

  // Fallback to server search
  const performServerSearch = async (query: string, locationFilter?: string) => {
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

      const data = await response.json();
      setBusinesses(data.businesses || []);
      setTotalResults(data.total || 0);
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!keyword.trim()) {
        setBusinesses([]);
        setTotalResults(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Use client-side fuzzy search if all businesses are loaded
        if (allBusinesses.length > 0) {
          performFuzzySearch(keyword, location);
        } else {
          // Fallback to server search
          await performServerSearch(keyword, location);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setBusinesses([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, [keyword, location, allBusinesses]);

  // Sort businesses based on selected sort option
  const sortedBusinesses = [...businesses].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "newest":
        // Assuming you have a createdAt field
        // return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0; // Fallback if no date field
      case "relevance":
      default:
        // Already sorted by relevance score if using fuzzy search
        return 'score' in a && 'score' in b ? (b as any).score - (a as any).score : 0;
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

  // Enhanced no results component with search suggestions
  const NoResultsComponent = () => {
    // Generate search suggestions based on fuzzy matching
    const suggestions = allBusinesses
      .filter(business => {
        const distance = calculateLevenshteinDistance(
          normalizeString(keyword),
          normalizeString(business.name)
        );
        const maxLength = Math.max(keyword.length, business.name.length);
        const similarity = 1 - (distance / maxLength);
        return similarity >= 0.3 && similarity < 0.6; // Potential matches
      })
      .slice(0, 3)
      .map(business => business.name);

    return (
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
              We couldn't find any businesses matching{" "}
              <span className="font-medium">"{keyword}"</span>
              {location && <span> in {location}</span>}.
            </p>

            {/* Search Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm font-medium text-blue-900 mb-3">
                  Did you mean:
                </p>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion);
                        const params = new URLSearchParams();
                        params.set("keyword", suggestion);
                        if (location) params.set("location", location);
                        window.location.href = `/search?${params.toString()}`;
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 rounded-md transition-colors duration-200"
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            )}

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
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Enhanced Search Header */}
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
                        <option value="relevance">Relevance</option>
                        <option value="name">Name A-Z</option>
                        <option value="newest">Newest First</option>
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

        {/* No Results State with Suggestions */}
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
                you're looking for.
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
                  groupedRequirements={business.groupedRequirements}
                />
              ))}
            </div>

            {/* Pagination */}
            {sortedBusinesses.length < totalResults && (
              <div className="text-center mt-12 pt-8 border-t border-gray-200">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Showing {sortedBusinesses.length} of{" "}
                    {totalResults.toLocaleString()} results
                  </p>
                  <Button
                    variant="outline"
                    className="px-8 py-3 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                    onClick={() => alert("Pagination coming soon!")}
                  >
                    Load More Results
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}