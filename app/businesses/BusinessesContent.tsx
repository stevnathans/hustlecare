'use client';

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BusinessCard from "@/components/business/BusinessCards";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────────────────

const BUSINESSES_PER_PAGE = 12;

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface Business {
  groupedRequirements: Record<string, Requirement[]>;
  sortedCategories?: string[];
  id: number;
  name: string;
  image?: string;
  slug: string;
  category?: string;
  estimatedCost?: string;
  timeToLaunch?: string;
  description?: string;
}

// ── FAQ Data ──────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    question: "What are the most profitable small businesses to start in Kenya?",
    answer:
      "Some of the most profitable businesses in Kenya include M-Pesa agencies, cereals shops, fresh produce delivery, salon & barbershops, poultry farming, boda boda logistics, and online retail. Profitability depends on your location, capital, and target market.",
  },
  {
    question: "How much capital do I need to start a small business in Kenya?",
    answer:
      "Starting capital varies widely. Micro-businesses (e.g., phone repair, food kiosk) can start with as little as KES 10,000–50,000. Medium ventures (e.g., mini supermarket, salon) typically need KES 100,000–500,000. Each business page on our platform lists estimated startup costs so you can plan accordingly.",
  },
  {
    question: "Do I need to register my business with the government in Kenya?",
    answer:
      "Yes. In Kenya you must register with the Business Registration Service (BRS) under the Companies Act or Business Names Act. You'll also need a Single Business Permit (SBP) from your county government, and depending on your industry, sector-specific licences (e.g., KEBS, NEMA, PPB).",
  },
  {
    question: "What government support is available for small businesses in Kenya?",
    answer:
      "Key support programmes include: the Hustler Fund (low-interest mobile loans), Youth Enterprise Development Fund (YEDF), Women Enterprise Fund (WEF), and NG-CDF grants. Kenya Revenue Authority (KRA) also offers simplified tax regimes such as the Turnover Tax for businesses earning below KES 25 million per year.",
  },
  {
    question: "How do I find suppliers for my new business in Kenya?",
    answer:
      "Each business idea on our platform lists recommended suppliers and what you need to source. You can also find suppliers at Gikomba, Eastleigh, and Wakulima markets in Nairobi, or through directories like Kenya Association of Manufacturers (KAM) and the Kenya National Chamber of Commerce (KNCCI).",
  },
  {
    question: "What are the best online businesses to start in Kenya?",
    answer:
      "Popular online businesses in Kenya include social media marketing agencies, e-commerce stores (Jumia, Kilimall, or your own site), freelancing (Upwork, Fiverr), virtual assistance, YouTube content creation, and online tutoring. These require low capital and can be started from home.",
  },
  {
    question: "How long does it take to launch a business in Kenya?",
    answer:
      "A simple micro-business can launch in a few days once you have capital and stock. Formal registration takes 1–3 business days online via eCitizen. More complex ventures requiring premises, staff, and multiple licences may take 4–12 weeks. Each listing on our platform shows an estimated time-to-launch.",
  },
];

// ── Pagination Component ──────────────────────────────────────────────────────

interface PaginatorProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Paginator({ currentPage, totalPages, onPageChange }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-12"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {getPageNumbers().map((page, idx) =>
        page === "..." ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 select-none">
            …
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            aria-current={currentPage === page ? "page" : undefined}
            className={`min-w-[2.25rem] h-9 px-3 rounded-lg text-sm font-medium border transition-colors ${
              currentPage === page
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-emerald-300 hover:text-emerald-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// ── FAQ Component ─────────────────────────────────────────────────────────────

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      aria-labelledby="faq-heading"
      className="mt-20 max-w-3xl mx-auto"
      itemScope
      itemType="https://schema.org/FAQPage"
    >
      <h2
        id="faq-heading"
        className="text-2xl font-bold text-gray-900 mb-2 text-center"
      >
        Frequently Asked Questions
      </h2>
      <p className="text-gray-500 text-center mb-8">
        Everything you need to know about starting a business in Kenya
      </p>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-6 py-4 text-left gap-4 hover:bg-gray-50 transition-colors"
              >
                <span
                  className="font-medium text-gray-900 text-sm leading-snug"
                  itemProp="name"
                >
                  {item.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {isOpen && (
                <div
                  className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4"
                  itemScope
                  itemProp="acceptedAnswer"
                  itemType="https://schema.org/Answer"
                >
                  <span itemProp="text">{item.answer}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BusinessesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams?.get("category") || "all"
  );
  const [sortOption, setSortOption] = useState<string>("default");
  const [currentPage, setCurrentPage] = useState(1);

  // Sync category from URL param on mount
  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortOption]);

  // Extract unique categories from businesses
  const categories = useMemo(() => {
    const allCategories = businesses
      .map((b) => b.category)
      .filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(allCategories))];
  }, [businesses]);

  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await fetch("/api/businesses");
        const data = await res.json();
        setBusinesses(data);
      } catch (error) {
        console.error("Error loading businesses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinesses();
  }, []);

  const filteredBusinesses = useMemo(() => {
    let result = businesses.filter((business) =>
      business.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedCategory !== "all") {
      result = result.filter(
        (business) => business.category === selectedCategory
      );
    }

    switch (sortOption) {
      case "name-asc":
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return [...result].sort((a, b) => b.name.localeCompare(a.name));
      case "cost-low":
        return [...result].sort((a, b) => {
          const costA = parseInt(a.estimatedCost?.replace(/\D/g, "") || "0");
          const costB = parseInt(b.estimatedCost?.replace(/\D/g, "") || "0");
          return costA - costB;
        });
      case "cost-high":
        return [...result].sort((a, b) => {
          const costA = parseInt(a.estimatedCost?.replace(/\D/g, "") || "0");
          const costB = parseInt(b.estimatedCost?.replace(/\D/g, "") || "0");
          return costB - costA;
        });
      default:
        return result;
    }
  }, [businesses, searchTerm, selectedCategory, sortOption]);

  // Pagination
  const totalPages = Math.ceil(filteredBusinesses.length / BUSINESSES_PER_PAGE);
  const paginatedBusinesses = useMemo(() => {
    const start = (currentPage - 1) * BUSINESSES_PER_PAGE;
    return filteredBusinesses.slice(start, start + BUSINESSES_PER_PAGE);
  }, [filteredBusinesses, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of listings smoothly
    document
      .getElementById("businesses-grid")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const categorySlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "all") {
      router.replace("/businesses", { scroll: false });
    } else {
      router.replace(
        `/businesses?category=${encodeURIComponent(cat)}`,
        { scroll: false }
      );
    }
  };

  // Dynamic hero headline
  const totalCount = businesses.length;
  const heroHeadline =
    totalCount > 0
      ? `${totalCount} Small Business Ideas To Start In Kenya Today`
      : "Small Business Ideas To Start In Kenya Today";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ── */}
      <header className="relative bg-gradient-to-r from-emerald-600 to-teal-500 px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div
          className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover"
          aria-hidden="true"
        />
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Breadcrumb — helps Google understand site structure */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol
              className="flex justify-center items-center gap-1 text-xs text-emerald-200"
              itemScope
              itemType="https://schema.org/BreadcrumbList"
            >
              <li
                itemScope
                itemProp="itemListElement"
                itemType="https://schema.org/ListItem"
              >
                <Link href="/" className="hover:text-white transition-colors" itemProp="item">
                  <span itemProp="name">Home</span>
                </Link>
                <meta itemProp="position" content="1" />
              </li>
              <li aria-hidden="true" className="text-emerald-300">/</li>
              <li
                itemScope
                itemProp="itemListElement"
                itemType="https://schema.org/ListItem"
              >
                <span itemProp="name" className="text-white font-medium">
                  Business Ideas in Kenya
                </span>
                <meta itemProp="position" content="2" />
              </li>
            </ol>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            {loading ? (
              "Small Business Ideas To Start In Kenya Today"
            ) : (
              heroHeadline
            )}
          </h1>
          <p className="text-xl text-emerald-100 mb-10 max-w-3xl mx-auto">
            Browse the most profitable small businesses ideas in Kenya. Discover complete requirements for each business, startup costs,
            time-to-launch estimates, and local suppliers to get you started.
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center bg-white rounded-xl shadow-xl overflow-hidden">
              <div className="pl-5 pr-3 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                id="business-search"
                type="search"
                placeholder="Search businesses (e.g. 'salon', 'poultry', 'online')…"
                className="w-full px-4 py-4 border-0 focus:outline-none focus:ring-0 text-lg placeholder-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search business ideas in Kenya"
              />
              {searchTerm && (
                <button
                  className="px-4 text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-7xl mx-auto">

          {/* ── Category pill strip ── */}
          {!loading && categories.length > 1 && (
            <nav aria-label="Filter by category" className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Browse by category
                </span>
                {selectedCategory !== "all" && (
                  <Link
                    href="/categories"
                    className="text-xs text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                  >
                    View all categories →
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      aria-pressed={isActive}
                      aria-label={
                        cat === "all"
                          ? "Show all categories"
                          : `Filter by ${cat}`
                      }
                      className={`
                        inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                        border transition-all duration-150 whitespace-nowrap
                        ${
                          isActive
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
                        }
                      `}
                    >
                      {cat === "all" ? "All" : cat}
                      {isActive && cat !== "all" && (
                        <X className="w-3 h-3 opacity-70" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedCategory !== "all" && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing{" "}
                    <span className="font-semibold text-gray-800">
                      {filteredBusinesses.length}
                    </span>{" "}
                    {filteredBusinesses.length === 1 ? "business" : "businesses"}{" "}
                    in{" "}
                    <span className="font-semibold text-emerald-700">
                      {selectedCategory}
                    </span>
                  </p>
                  <Link
                    href={`/categories/${categorySlug(selectedCategory)}`}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                  >
                    Full {selectedCategory} page →
                  </Link>
                </div>
              )}
            </nav>
          )}

          {/* ── Heading + sort controls ── */}
          <div
            id="businesses-grid"
            className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 scroll-mt-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedCategory === "all"
                  ? "Top Profitable Business Ideas in Kenya"
                  : selectedCategory}
              </h2>
              <p className="text-gray-600 mt-2">
                {filteredBusinesses.length}{" "}
                {filteredBusinesses.length === 1 ? "business" : "businesses"} available
                {totalPages > 1 && (
                  <span className="text-gray-400">
                    {" "}— page {currentPage} of {totalPages}
                  </span>
                )}
              </p>
            </div>

            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
              {/* Category select — mobile fallback */}
              <div className="relative sm:hidden">
                <label htmlFor="category-select-mobile" className="sr-only">
                  Select category
                </label>
                <select
                  id="category-select-mobile"
                  className="appearance-none bg-white pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-700 w-full"
                  value={selectedCategory}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                  aria-hidden="true"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>

              {/* Sort */}
              <div className="relative">
                <label htmlFor="sort-options" className="sr-only">
                  Sort businesses
                </label>
                <select
                  id="sort-options"
                  className="appearance-none bg-white pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-gray-700"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="default">Sort by</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="cost-low">Cost (Low to High)</option>
                  <option value="cost-high">Cost (High to Low)</option>
                </select>
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700"
                  aria-hidden="true"
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── Business cards grid ── */}
          {loading ? (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              aria-busy="true"
              aria-label="Loading businesses"
            >
              {[...Array(BUSINESSES_PER_PAGE)].map((_, i) => (
                <div
                  key={i}
                  className="h-96 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <section
              aria-label={`${
                selectedCategory === "all" ? "All business" : selectedCategory
              } opportunities`}
            >
              {paginatedBusinesses.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {paginatedBusinesses.map((biz) => (
                      <BusinessCard
                        key={biz.id}
                        id={biz.id}
                        name={biz.name}
                        image={biz.image}
                        slug={biz.slug}
                        category={biz.category}
                        estimatedCost={biz.estimatedCost}
                        timeToLaunch={biz.timeToLaunch}
                        groupedRequirements={biz.groupedRequirements}
                        sortedCategories={
                          biz.sortedCategories ??
                          Object.keys(biz.groupedRequirements ?? {})
                        }
                        requirements={[]}
                      />
                    ))}
                  </div>

                  {/* Paginator */}
                  <Paginator
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-20 w-20 mx-auto text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h2 className="mt-6 text-2xl font-medium text-gray-900">
                    No Matching Businesses Found
                  </h2>
                  <p className="mt-3 text-gray-600 max-w-md mx-auto">
                    {searchTerm
                      ? `We couldn't find any businesses matching "${searchTerm}". Try adjusting your search or filters.`
                      : selectedCategory !== "all"
                      ? `No businesses in the "${selectedCategory}" category yet.`
                      : "No businesses available at the moment. Please check back later."}
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      handleCategorySelect("all");
                    }}
                    className="mt-6 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── Newsletter CTA ── */}
          {!loading && filteredBusinesses.length > 0 && (
            <div className="mt-16 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Can&apos;t find what you&apos;re looking for?
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                We&apos;re constantly adding new business ideas for Kenya. Sign
                up to be notified when we add new ventures.
              </p>
              {/* Wire up onSubmit to your notification backend when ready */}
              <form
                className="max-w-md mx-auto flex gap-2"
                aria-label="Notify me about new business ideas"
                onSubmit={(e) => e.preventDefault()}
              >
                <label htmlFor="notify-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="notify-email"
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  autoComplete="email"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Notify Me
                </button>
              </form>
            </div>
          )}

          {/* ── FAQ ── */}
          {!loading && <FAQSection />}
        </div>
      </main>
    </div>
  );
}