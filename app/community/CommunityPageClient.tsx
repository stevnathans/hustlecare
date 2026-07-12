"use client";

import { useEffect, useMemo, useState } from "react";
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
  Flame,
  SlidersHorizontal,
} from "lucide-react";
import LoginModal from "@/components/LoginModal";

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
  isOwnList?: boolean;
  alreadyCopied?: boolean;
}

type SortOption = "trending" | "recent" | "popular" | "mostCopied";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending", label: "Trending" },
  { value: "recent", label: "Most Recent" },
  { value: "popular", label: "Most Viewed" },
  { value: "mostCopied", label: "Most Copied" },
];

function BusinessCard({
  business,
  isPopular,
  onCopy,
  onRequireLogin,
}: {
  business: SharedBusiness;
  isPopular?: boolean;
  onCopy: (id: string) => void;
  onRequireLogin: () => void;
}) {
  const [copying, setCopying] = useState(false);
  const [copyState, setCopyState] = useState<
    "idle" | "copied" | "already_copied" | "own_list" | "error"
  >(() => {
    if (business.isOwnList) return "own_list";
    if (business.alreadyCopied) return "already_copied";
    return "idle";
  });

  const isOwnList = business.isOwnList || copyState === "own_list";

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (
      copying ||
      copyState === "copied" ||
      copyState === "already_copied" ||
      copyState === "own_list"
    )
      return;

    setCopying(true);
    try {
      const response = await fetch(`/api/community/${business.id}/copy`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "UNAUTHENTICATED") {
          setCopying(false);
          onRequireLogin();
          return;
        }
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
            Already Copied
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
      "flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors text-sm font-medium";
    if (copyState === "copied") return `${base} bg-emerald-600 text-white`;
    if (copyState === "already_copied")
      return `${base} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default`;
    if (copyState === "error") return `${base} bg-red-600 text-white hover:bg-red-700`;
    if (copying) return `${base} bg-emerald-400 text-white cursor-wait`;
    return `${base} bg-emerald-600 text-white hover:bg-emerald-700`;
  };

  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 relative flex flex-col">
      {isPopular && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-400 text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
          <Flame className="w-3 h-3" />
          Popular
        </div>
      )}

      {/* Header — soft emerald tint instead of stark white or a loud gradient */}
      <div className="p-5 border-b border-emerald-100 dark:border-gray-700 bg-emerald-50/60 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {business.name}
            </h2>
            {business.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {business.description}
              </p>
            )}
          </div>
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex-shrink-0">
            <ShoppingBag className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Author info */}
        <div className="flex items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="relative">
            {business.author.avatar ? (
              <Image
                src={business.author.avatar}
                alt={`${business.author.name}'s avatar`}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-gray-700 flex items-center justify-center">
                <User className="w-4 h-4 text-emerald-700 dark:text-gray-400" aria-hidden="true" />
              </div>
            )}
            {business.author.verified && (
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                <CheckCircle
                  className="w-3.5 h-3.5 text-blue-500 fill-current"
                  aria-label="Verified author"
                />
              </div>
            )}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {business.author.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
              <time dateTime={business.sharedAt}>
                {formatDistanceToNow(new Date(business.sharedAt), { addSuffix: true })}
              </time>
            </p>
          </div>
        </div>

        {/* Categories */}
        {business.categories && business.categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {business.categories.slice(0, 3).map((category, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full"
              >
                {category}
              </span>
            ))}
            {business.categories.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 text-xs rounded-full">
                +{business.categories.length - 3}
              </span>
            )}
          </div>
        )}

        {/* 2-col stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs mb-1">
              <Package className="w-3 h-3 mr-1" aria-hidden="true" />
              Items
            </div>
            <p className="text-base font-bold text-gray-900 dark:text-white">
              {business.itemsCount}
            </p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-lg p-3">
            <div className="flex items-center text-emerald-700/70 dark:text-emerald-400/70 text-xs mb-1">
              <DollarSign className="w-3 h-3 mr-1" aria-hidden="true" />
              Total Cost
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              KSh {(business.totalCost / 1000).toFixed(1)}K
            </p>
          </div>
        </div>

        {/* Community stats */}
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            {business.viewCount.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            {business.copyCount.toLocaleString()} copies
          </span>
        </div>

        <div className="mt-auto flex gap-2">
          <Link
            href={`/community/${business.id}`}
            className="flex-1 flex items-center justify-center px-4 py-2.5 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium border border-gray-200 dark:border-gray-600"
            aria-label={`Preview ${business.name}`}
          >
            <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
            Preview
          </Link>

          {!isOwnList && (
            <button
              onClick={handleCopy}
              disabled={copying || copyState === "copied" || copyState === "already_copied"}
              className={copyBtnClass()}
              aria-label={`Copy ${business.name} to my list`}
            >
              {copyLabel()}
            </button>
          )}
        </div>

        {copyState === "copied" && (
          <div
            role="status"
            className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg"
          >
            <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center">
              Copied! Redirecting to your requirements...
            </p>
          </div>
        )}
        {copyState === "already_copied" && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
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
        {isOwnList && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
              This is your list — you can&apos;t copy your own template.
            </p>
          </div>
        )}
      </div>
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
  const [maxCostFilter, setMaxCostFilter] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [stats, setStats] = useState({ totalShared: 0, totalViews: 0, totalCopies: 0 });

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
      data.businesses.forEach((b: SharedBusiness) => b.categories?.forEach((c) => cats.add(c)));
      setAllCategories(Array.from(cats).sort());

      setStats({
        totalShared: data.businesses.length,
        totalViews: data.businesses.reduce((s: number, b: SharedBusiness) => s + b.viewCount, 0),
        totalCopies: data.businesses.reduce((s: number, b: SharedBusiness) => s + b.copyCount, 0),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const popularIds = useMemo(() => {
    return new Set(
      [...businesses]
        .filter((b) => b.copyCount > 0)
        .sort((a, b) => b.copyCount - a.copyCount)
        .slice(0, 3)
        .map((b) => b.id)
    );
  }, [businesses]);

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
      result = result.filter((b) => b.categories?.some((c) => selectedCategories.includes(c)));
    }
    if (maxCostFilter !== null) {
      result = result.filter((b) => b.totalCost <= maxCostFilter);
    }
    setFiltered(result);
  }, [searchQuery, selectedCategories, maxCostFilter, businesses]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const hasActiveFilters = !!searchQuery || selectedCategories.length > 0 || maxCostFilter !== null;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setMaxCostFilter(null);
  };

  const handleCopy = (businessId: string) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === businessId ? { ...b, copyCount: b.copyCount + 1 } : b))
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to copy this list"
        message="Create a free account or sign in to copy this requirement list to your own business and start customising it."
      />

      {/* Hero — soft emerald wash, not stark white */}
      <header className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-gray-900 border-b border-emerald-100 dark:border-gray-800 py-14 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
            Start Your Business Faster
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto mb-8">
            Browse requirement lists shared by hustlers starting the same business as yours.
            Copy any list to your account and customise it to fit your business.
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
              className="w-full bg-white dark:bg-gray-900 border border-emerald-200 dark:border-gray-700 pl-12 pr-4 py-3.5 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
            />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Stats row */}
        <section aria-label="Community statistics" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Shared Templates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalShared}</p>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">Times Copied</p>
              <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {stats.totalCopies.toLocaleString()}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                1
              </span>
              <p className="text-gray-600 dark:text-gray-400">Browse templates shared by other entrepreneurs</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                2
              </span>
              <p className="text-gray-600 dark:text-gray-400">Copy any list straight to your account</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                3
              </span>
              <p className="text-gray-600 dark:text-gray-400">Customise it to fit your own business</p>
            </div>
          </div>
        </section>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6" role="toolbar" aria-label="Sort and filter templates">
          <div className="flex gap-2 flex-wrap" role="group" aria-label="Sort options">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSortBy(opt.value)}
                aria-pressed={sortBy === opt.value}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === opt.value
                    ? "bg-emerald-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600"
                }`}
              >
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
                showFilters || selectedCategories.length > 0 || maxCostFilter !== null
                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-400"
                  : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-300"
              }`}
            >
              <Filter className="w-4 h-4" aria-hidden="true" />
              Filters
              {(selectedCategories.length > 0 || maxCostFilter !== null) && (
                <span className="bg-emerald-600 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                  {selectedCategories.length + (maxCostFilter !== null ? 1 : 0)}
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            id="category-filter-panel"
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6 space-y-5"
          >
            {allCategories.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Filter by Category
                  </h2>
                  {selectedCategories.length > 0 && (
                    <button
                      onClick={() => setSelectedCategories([])}
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
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
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-50 dark:bg-gray-700 text-blue-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Max Budget (KSh)
              </h2>
              <div className="flex flex-wrap gap-2">
                {[20000, 50000, 100000, 250000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setMaxCostFilter(maxCostFilter === amount ? null : amount)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      maxCostFilter === amount
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Under {amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6" aria-live="polite" aria-atomic="true">
            {hasActiveFilters
              ? `${filtered.length} of ${businesses.length} templates match your search`
              : `${businesses.length} templates available`}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true" aria-label="Loading templates">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
                aria-hidden="true"
              >
                <div className="h-20 bg-emerald-50 dark:bg-gray-700 rounded-t-xl" />
                <div className="p-5 space-y-4">
                  <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded w-3/4" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    <div className="h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  </div>
                  <div className="h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                    <div className="flex-1 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 dark:bg-gray-700 rounded-full mb-4">
              <Search className="w-7 h-7 text-emerald-600 dark:text-gray-400" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {businesses.length === 0 ? "No templates shared yet" : "No templates found"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {businesses.length === 0
                ? "Be the first to share a requirement list with the community."
                : "Try different keywords or remove some filters."}
            </p>
            {businesses.length === 0 ? (
              <Link
                href="/profile"
                className="inline-block px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Share a Template
              </Link>
            ) : (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Business templates">
            {filtered.map((b) => (
              <BusinessCard
                key={b.id}
                business={b}
                isPopular={popularIds.has(b.id)}
                onCopy={handleCopy}
                onRequireLogin={() => setShowLoginModal(true)}
              />
            ))}
          </div>
        )}

        {/* Share CTA */}
        {!loading && (
          <section
            aria-label="Share your business setup"
            className="mt-14 bg-emerald-600 rounded-2xl p-10 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              Share your business setup
            </h2>
            <p className="text-emerald-50 mb-7 max-w-md mx-auto">
              Help other entrepreneurs by sharing your requirement list. Head to your profile,
              open <strong className="text-white">My Lists</strong>, and toggle any list to public.
            </p>
            <Link href="/profile">
              <button className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-emerald-700 rounded-xl font-semibold hover:bg-emerald-50 transition-colors">
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