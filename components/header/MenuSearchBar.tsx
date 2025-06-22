"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Business = {
  id: number;
  name: string;
  slug: string;
};

// Fuzzy search utility functions
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

export default function MenuSearchBar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Business[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleSearch = (keyword: string) => {
    if (!keyword.trim()) return;
    
    const query = `/search?keyword=${encodeURIComponent(keyword.trim())}`;
    router.push(query);
    setSearch("");
    setShowSuggestions(false);
  };

  // Fetch all businesses once for client-side fuzzy search
  const fetchAllBusinesses = async () => {
    try {
      const response = await fetch('/api/businesses'); // You'll need this endpoint
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAllBusinesses(data.results || []);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  // Initialize businesses on component mount
  useEffect(() => {
    fetchAllBusinesses();
  }, []);

  const performFuzzySearch = (query: string) => {
    if (!query.trim() || allBusinesses.length === 0) {
      setSearchSuggestions([]);
      return;
    }

    const matches = allBusinesses
      .filter(business => fuzzyMatch(query, business.name))
      .map(business => ({
        ...business,
        score: scoreMatch(query, business.name)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    setSearchSuggestions(matches);
  };

  const fetchSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      
      // If we have all businesses loaded, use client-side fuzzy search
      if (allBusinesses.length > 0) {
        performFuzzySearch(query);
      } else {
        // Fallback to server search if businesses not loaded
        const response = await fetch(`/api/businesses/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setSearchSuggestions(data.results?.slice(0, 5) || []);
        } else {
          setSearchSuggestions([]);
        }
      }
    } catch (error) {
      console.error("Search suggestions error:", error);
      setSearchSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

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
  }, [search, allBusinesses]);

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