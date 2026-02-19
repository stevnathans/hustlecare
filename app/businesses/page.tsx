'use client';
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BusinessCard from "@/components/business/BusinessCards";
import Head from "next/head";
import Link from "next/link";
import { X } from "lucide-react";

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
  id: number;
  name: string;
  image?: string;
  slug: string;
  category?: string;
  estimatedCost?: string;
  timeToLaunch?: string;
  description?: string;
}

export default function BusinessesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams?.get("category") || "all"
  );
  const [sortOption, setSortOption] = useState<string>("default");

  // Sync category from URL param on mount
  useEffect(() => {
    const cat = searchParams?.get("category");
    if (cat) setSelectedCategory(cat);
  }, [searchParams]);

  // Extract unique categories from businesses
  const categories = useMemo(() => {
    const allCategories = businesses.map((b) => b.category).filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(allCategories))];
  }, [businesses]);

  const pageTitle = "Best Business Opportunities to Start in 2024 | VentureGuide";
  const pageDescription =
    "Discover 100+ verified business opportunities with complete setup guides. Get step-by-step requirements, cost estimates, and launch timelines to start your dream business.";
  const canonicalUrl = `'/businesses'}`;
  const pageKeywords =
    "business opportunities, start a business, entrepreneurship, small business ideas, business requirements";
  const featuredBusinesses = businesses.slice(0, 5);

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
      result = result.filter((business) => business.category === selectedCategory);
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

  const categorySlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    // Update URL so direct links work
    if (cat === "all") {
      router.replace("/businesses", { scroll: false });
    } else {
      router.replace(`/businesses?category=${encodeURIComponent(cat)}`, { scroll: false });
    }
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://www.ventureguide.com/images/og/business-opportunities-og.jpg" />
        <meta property="og:site_name" content="VentureGuide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:site" content="@VentureGuide" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: pageTitle,
            description: pageDescription,
            url: canonicalUrl,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: featuredBusinesses.map((business, index) => ({
                "@type": "ListItem",
                position: index + 1,
                item: {
                  "@type": "Business",
                  name: business.name,
                  url: `https://www.ventureguide.com/${business.slug}`,
                  image: business.image,
                  description: business.description || `Complete guide to starting a ${business.name} business`,
                },
              })),
            },
          })}
        </script>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#059669" />
        <meta name="robots" content="index, follow" />
      </Head>

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://www.ventureguide.com/" },
            { "@type": "ListItem", position: 2, name: "Business Opportunities", item: canonicalUrl },
          ],
        })}
      </script>

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <header className="relative bg-gradient-to-r from-emerald-600 to-teal-500 px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="absolute inset-0 opacity-10 bg-[url('/images/pattern.svg')] bg-cover" />
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Launch Your Dream Business <br className="hidden md:block" />With Confidence
            </h1>
            <p className="text-xl text-emerald-100 mb-10 max-w-3xl mx-auto">
              Discover vetted business opportunities with complete requirements, personalized cost estimates,
              and suppliers to provide what you need.
            </p>
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center bg-white rounded-xl shadow-xl overflow-hidden">
                <div className="pl-5 pr-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  id="business-search"
                  type="text"
                  placeholder="Search businesses (e.g. 'restaurant', 'ecommerce')..."
                  className="w-full px-4 py-4 border-0 focus:outline-none focus:ring-0 text-lg placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search business opportunities"
                />
                {searchTerm && (
                  <button className="px-4 text-gray-500 hover:text-gray-700" onClick={() => setSearchTerm("")}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-7xl mx-auto">

            {/* ── Category pill strip ───────────────────────────────────────── */}
            {!loading && categories.length > 1 && (
              <div className="mb-8">
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
                        className={`
                          inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium
                          border transition-all duration-150 whitespace-nowrap
                          ${isActive
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"}
                        `}
                      >
                        {cat === "all" ? "All" : cat}
                        {isActive && cat !== "all" && (
                          <X className="w-3 h-3 opacity-70" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active category header + link to full category page */}
                {selectedCategory !== "all" && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      Showing{" "}
                      <span className="font-semibold text-gray-800">
                        {filteredBusinesses.length}
                      </span>{" "}
                      {filteredBusinesses.length === 1 ? "business" : "businesses"} in{" "}
                      <span className="font-semibold text-emerald-700">{selectedCategory}</span>
                    </p>
                    <Link
                      href={`/categories/${categorySlug(selectedCategory)}`}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50 transition-colors"
                    >
                      Full {selectedCategory} page →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ── Heading + sort controls ───────────────────────────────────── */}
            <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">
                  {selectedCategory === "all" ? "Business Opportunities" : selectedCategory}
                </h2>
                <p className="text-gray-600 mt-2">
                  {filteredBusinesses.length}{" "}
                  {filteredBusinesses.length === 1 ? "business" : "businesses"} available
                </p>
              </div>

              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                {/* Category select — kept for mobile fallback */}
                <div className="relative sm:hidden">
                  <select
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Sort */}
                <div className="relative">
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
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Business cards grid ───────────────────────────────────────── */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <section aria-labelledby="business-list-heading">
                <h2 id="business-list-heading" className="sr-only">List of available businesses</h2>
                {filteredBusinesses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredBusinesses.map((biz) => (
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
                        requirements={[]}
                        sortedCategories={[]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="mt-6 text-2xl font-medium text-gray-900">No Matching Businesses Found</h2>
                    <p className="mt-3 text-gray-600 max-w-md mx-auto">
                      {searchTerm
                        ? `We couldn't find any businesses matching "${searchTerm}". Try adjusting your search or filters.`
                        : selectedCategory !== "all"
                        ? `No businesses in the "${selectedCategory}" category yet.`
                        : "No businesses available at the moment. Please check back later."}
                    </p>
                    <button
                      onClick={() => { setSearchTerm(""); handleCategorySelect("all"); }}
                      className="mt-6 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* CTA */}
            {!loading && filteredBusinesses.length > 0 && (
              <div className="mt-16 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Can&apos;t find what you&apos;re looking for?
                </h2>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  We&apos;re constantly adding new business opportunities. Sign up to be notified when we add new ventures.
                </p>
                <div className="max-w-md mx-auto flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                    Notify Me
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}