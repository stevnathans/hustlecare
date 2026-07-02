// app/community/CommunityPageClient.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  TrendingUp,
 
  Filter,
  X,
  Package,
  Copy,
  Eye,
  User,
  CheckCircle,
  DollarSign,
  ArrowRight,

  ShoppingBag,
  Calendar,
} from "lucide-react";

interface SharedBusiness {
  id: string;
  name: string;
  description?: string;
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
}

type SortOption = "trending" | "recent" | "popular" | "mostCopied";

const SORT_OPTIONS: { value: SortOption; label: string; icon: string }[] = [
  { value: "trending", label: "Trending", icon: "🔥" },
  { value: "recent", label: "Most Recent", icon: "🕐" },
  { value: "popular", label: "Most Viewed", icon: "⭐" },
  { value: "mostCopied", label: "Most Copied", icon: "📋" },
];

function BusinessCard({
  business,
  onCopy,
}: {
  business: SharedBusiness;
  onCopy: (id: string) => void;
}) {
  const [copying, setCopying] = useState(false);
  const [copyState, setCopyState] = useState<
    "idle" | "copied" | "already_copied" | "own_list" | "error"
  >("idle");

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (copying || copyState === "copied") return;

    setCopying(true);
    try {
      const response = await fetch(`/api/community/${business.id}/copy`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "ALREADY_COPIED") {
          setCopyState("already_copied");
          setCopying(false);
          return;
        }
        if (data.code === "OWN_LIST") {
          setCopyState("own_list");
          setCopying(false);
          return;
        }
        throw new Error(data.error || "Failed to copy");
      }

      setCopyState("copied");
      onCopy(business.id);

      setTimeout(() => {
        window.location.href = `/businesses/${data.newBusinessSlug}/requirements`;
      }, 1000);
    } catch (error) {
      console.error("Error copying business:", error);
      setCopyState("error");
      setCopying(false);
    }
  };

  const copyLabel = () => {
    switch (copyState) {
      case "copied":
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Copied!
          </>
        );
      case "already_copied":
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Already copied
          </>
        );
      case "own_list":
        return (
          <>
            <User className="w-4 h-4 mr-2" />
            Your list
          </>
        );
      case "error":
        return (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Try again
          </>
        );
      default:
        if (copying) {
          return (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              Copying...
            </>
          );
        }
        return (
          <>
            <Copy className="w-4 h-4 mr-2" />
            Copy to My List
          </>
        );
    }
  };

  const copyBtnClass = () => {
    const base =
      "flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium";
    if (copyState === "copied") return `${base} bg-green-500 text-white`;
    if (copyState === "already_copied" || copyState === "own_list")
      return `${base} bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-default`;
    if (copyState === "error")
      return `${base} bg-red-500 text-white hover:bg-red-600`;
    if (copying) return `${base} bg-emerald-400 text-white cursor-wait`;
    return `${base} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md hover:shadow-lg`;
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group relative">
      {/* Gradient header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white mb-1 line-clamp-1">
              {business.name}
            </h2>
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
        {/* Author info */}
        <div className="flex items-center mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            {business.author.avatar ? (
              <Image
                src={business.author.avatar}
                alt={`${business.author.name}'s avatar`}
                width={40}
                height={40}
                className="rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
            )}
            {business.author.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                <CheckCircle
                  className="w-4 h-4 text-blue-500 fill-current"
                  aria-label="Verified author"
                />
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {business.author.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
              <time dateTime={business.sharedAt}>
                Shared{" "}
                {formatDistanceToNow(new Date(business.sharedAt), {
                  addSuffix: true,
                })}
              </time>
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
                  +{business.categories.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* 2-col stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <Package className="w-3 h-3 mr-1" aria-hidden="true" />
              Items
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {business.itemsCount}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs mb-1">
              <DollarSign className="w-3 h-3 mr-1" aria-hidden="true" />
              Total Cost
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              KSh {(business.totalCost / 1000).toFixed(1)}K
            </p>
          </div>
        </div>

        {/* Community stats bar */}
        <div className="flex items-center justify-between mb-4 py-3 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
            <Eye className="w-4 h-4 mr-1.5" aria-hidden="true" />
            <span className="font-medium">
              {business.viewCount.toLocaleString()}
            </span>
            <span className="text-blue-500 dark:text-blue-500 ml-1">
              views
            </span>
          </div>
          <div className="w-px h-4 bg-blue-200 dark:bg-blue-700" />
          <div className="flex items-center text-sm text-emerald-600 dark:text-emerald-400">
            <Copy className="w-4 h-4 mr-1.5" aria-hidden="true" />
            <span className="font-medium">
              {business.copyCount.toLocaleString()}
            </span>
            <span className="text-emerald-500 dark:text-emerald-500 ml-1">
              copies
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            href={`/community/${business.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            aria-label={`Preview ${business.name}`}
          >
            <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
            Preview
          </Link>

          <button
            onClick={handleCopy}
            disabled={
              copying ||
              copyState === "copied" ||
              copyState === "already_copied" ||
              copyState === "own_list"
            }
            className={copyBtnClass()}
            aria-label={`Copy ${business.name} to my list`}
          >
            {copyLabel()}
          </button>
        </div>

        {/* Post-copy feedback */}
        {copyState === "copied" && (
          <div
            role="status"
            className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <p className="text-xs text-green-800 dark:text-green-400 text-center">
              ✨ Copied! Redirecting to your requirements...
            </p>
          </div>
        )}
        {copyState === "already_copied" && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              You already have this list.{" "}
              <Link
                href={`/businesses/${business.slug}/requirements`}
                className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
              >
                View requirements →
              </Link>
            </p>
          </div>
        )}
        {copyState === "own_list" && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              You cannot copy your own list.{" "}
              <Link
                href={`/businesses/${business.slug}/requirements`}
                className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
              >
                View requirements →
              </Link>
            </p>
          </div>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </article>
  );
}

export default function CommunityPageClient() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<SharedBusiness[]>([]);
  const [filtered, setFiltered] = useState<SharedBusiness[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("trending");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalShared: 0,
    totalViews: 0,
    totalCopies: 0,
  });

  useEffect(() => {
    fetchBusinesses();
  }, [sortBy]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/community?sort=${sortBy}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      setBusinesses(data.businesses);
      setFiltered(data.businesses);

      const cats = new Set<string>();
      data.businesses.forEach((b: SharedBusiness) =>
        b.categories?.forEach((c) => cats.add(c))
      );
      setAllCategories(Array.from(cats).sort());

      setStats({
        totalShared: data.businesses.length,
        totalViews: data.businesses.reduce(
          (s: number, b: SharedBusiness) => s + b.viewCount,
          0
        ),
        totalCopies: data.businesses.reduce(
          (s: number, b: SharedBusiness) => s + b.copyCount,
          0
        ),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...businesses];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.author.name.toLowerCase().includes(q) ||
          b.categories?.some((c) => c.toLowerCase().includes(q))
      );
    }
    if (selectedCategories.length > 0) {
      result = result.filter((b) =>
        b.categories?.some((c) => selectedCategories.includes(c))
      );
    }
    setFiltered(result);
  }, [searchQuery, selectedCategories, businesses]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const hasActiveFilters = !!searchQuery || selectedCategories.length > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
  };

  const handleCopy = (businessId: string) => {
    setBusinesses((prev) =>
      prev.map((b) =>
        b.id === businessId ? { ...b, copyCount: b.copyCount + 1 } : b
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero */}
      <header className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-blue-500 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
            Start Your Business Faster
          </h1>
          <p className="text-white/85 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            Browse requirement lists shared by hustlers starting the same business as yours. Copy any list to
            your account and customise it to fit your business.
          </p>

          <div className="max-w-xl mx-auto relative" role="search">
            <label htmlFor="community-search" className="sr-only">
              Search business templates
            </label>
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="community-search"
              type="search"
              placeholder="Search by business type, category, or creator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-white/30 dark:border-gray-600 pl-12 pr-4 py-4 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 shadow-xl focus:outline-none focus:ring-2 focus:ring-white/60 text-base"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Stats row */}
        <section aria-label="Community statistics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Shared Templates
                  </p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
                    {stats.totalShared}
                  </p>
                </div>
                <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                  <Package
                    className="w-6 h-6 text-blue-700 dark:text-blue-300"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    Total Views
                  </p>
                  <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">
                    {stats.totalViews.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-purple-200 dark:bg-purple-800 rounded-full">
                  <Eye
                    className="w-6 h-6 text-purple-700 dark:text-purple-300"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Times Copied
                  </p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-300">
                    {stats.totalCopies.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-emerald-200 dark:bg-emerald-800 rounded-full">
                  <TrendingUp
                    className="w-6 h-6 text-emerald-700 dark:text-emerald-300"
                    aria-hidden="true"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div
          className="flex flex-col md:flex-row gap-3 mb-6"
          role="toolbar"
          aria-label="Sort and filter templates"
        >
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Sort options">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                aria-pressed={sortBy === opt.value}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === opt.value
                    ? "bg-emerald-500 text-white shadow"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600"
                }`}
              >
                <span aria-hidden="true">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              aria-controls="category-filter-panel"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                showFilters || selectedCategories.length > 0
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-emerald-300"
              }`}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              Filters
              {selectedCategories.length > 0 && (
                <span
                  className="bg-emerald-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none"
                  aria-label={`${selectedCategories.length} active filters`}
                >
                  {selectedCategories.length}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Category filter panel */}
        {showFilters && allCategories.length > 0 && (
          <div
            id="category-filter-panel"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Filter by Category
              </h2>
              {selectedCategories.length > 0 && (
                <button
                  onClick={() => setSelectedCategories([])}
                  className="text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-1"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  aria-pressed={selectedCategories.includes(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategories.includes(cat)
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p
            className="text-sm text-gray-500 dark:text-gray-400 mb-6"
            aria-live="polite"
            aria-atomic="true"
          >
            {hasActiveFilters
              ? `${filtered.length} of ${businesses.length} templates match your search`
              : `${businesses.length} templates available`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-busy="true"
            aria-label="Loading templates"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
                aria-hidden="true"
              >
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
                <div className="p-6 space-y-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
              <Search className="w-8 h-8 text-gray-400" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No templates found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Try different keywords or remove some filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            aria-label="Business templates"
          >
            {filtered.map((b) => (
              <BusinessCard key={b.id} business={b} onCopy={handleCopy} />
            ))}
          </div>
        )}

        {/* Share CTA */}
        {!loading && (
          <section
            aria-label="Share your business setup"
            className="mt-14 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-10 text-center"
          >
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Share your business setup
            </h2>
            <p className="text-white/85 mb-7 max-w-md mx-auto">
              Help other entrepreneurs by sharing your requirement list. Head to
              your profile, open{" "}
              <strong className="text-white">My Lists</strong>, and toggle any
              list to public.
            </p>
            <Link href="/profile">
              <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-lg">
                Go to My Lists
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}