"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Business = {
  id: number;
  name: string;
  slug: string;
};

export default function MenuSearchBar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) return;
    
    const query = `/search?keyword=${encodeURIComponent(keyword.trim())}`;
    router.push(query);
    setSearch("");
    setShowSuggestions(false);
  };

  const fetchSearchSuggestions = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/businesses/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setSearchSuggestions(data.results?.slice(0, 5) || []);
      } else {
        setSearchSuggestions([]);
      }
    } catch (error) {
      console.error("Search suggestions error:", error);
      setSearchSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length > 1) {
        fetchSearchSuggestions(search);
      } else {
        setSearchSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, fetchSearchSuggestions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearSearch = () => {
    setSearch("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-md mx-auto">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <SearchIcon className="w-4 h-4" />
        </div>
        <Input
          className="pl-10 pr-10 py-2 w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-full text-sm placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          placeholder="Search business"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch(search);
            }
          }}
        />
        {search && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (search.length > 1 || searchSuggestions.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent mr-2"></div>
              Searching...
            </div>
          ) : searchSuggestions.length > 0 ? (
            <div className="py-2">
              {searchSuggestions.map((business) => (
                <button
                  key={business.id}
                  onClick={() => handleSearch(business.name)}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center"
                >
                  <SearchIcon className="w-4 h-4 mr-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{business.name}</span>
                </button>
              ))}
            </div>
          ) : search.length > 1 ? (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="block truncate">Press Enter to search for &quot;{search}&quot;</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}