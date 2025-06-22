'use client';
import { useEffect, useState, useMemo } from "react";
import BusinessCard from "@/components/business/BusinessCards";
import Head from "next/head";

interface Business {
  groupedRequirements: Record<string, Requirement[]> | undefined;
  id: number;
  name: string;
  image?: string;
  slug: string;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // SEO Metadata
  const pageTitle = "Business Opportunities | Start Your Next Venture";
  const pageDescription = "Discover the best business opportunities to start. Browse our curated collection of ventures with step-by-step requirements.";
  const canonicalUrl = "https://yourdomain.com/businesses";

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
    return businesses.filter((business) =>
      business.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [businesses, searchTerm]);

  return (
    <>
      {/* SEO Head Section */}
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content="https://yourdomain.com/images/business-opportunities-og.jpg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={canonicalUrl} />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://yourdomain.com/images/business-opportunities-twitter.jpg" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": businesses.slice(0, 5).map((business, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Business",
                "name": business.name,
                "url": `https://yourdomain.com/business/${business.slug}`
              }
            }))
          })}
        </script>
      </Head>

      <div className="max-w-7xl mx-auto">
        {/* emerald Background Section - Improved semantic structure */}
        <header className="bg-emerald-600 px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Start Your Next Business in a Few Steps
            </h1>
            <p className="text-xl text-emerald-100 mb-8">
              Browse our collection of verified business opportunities with complete setup requirements
            </p>
            
            <div className="relative max-w-2xl mx-auto">
              <label htmlFor="business-search" className="sr-only">Search businesses</label>
              <input
                id="business-search"
                type="text"
                placeholder="Search businesses..."
                className="w-full px-6 py-4 bg-white border-0 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Search business opportunities"
              />
              {searchTerm && (
                <button
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
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
        </header>

        {/* Main Content Section */}
        <main className="px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Trending Business Opportunities
          </h2>

          {loading ? (
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-80 bg-gray-100 rounded-2xl animate-pulse"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : (
            <section aria-labelledby="business-list-heading">
              <h3 id="business-list-heading" className="sr-only">List of available businesses</h3>
              <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBusinesses.length > 0 ? (
                  filteredBusinesses.map((biz) => (
                    <BusinessCard
                      key={biz.id}
                      id={biz.id}
                      name={biz.name}
                      image={biz.image}
                      slug={biz.name.toLowerCase().replace(/\s+/g, "-")}
                      groupedRequirements={biz.groupedRequirements}
                    />
                  ))
                ) : (
                  <div className="col-span-full text-center py-16">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-16 w-16 mx-auto text-gray-400"
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
                    <h3 className="mt-4 text-xl font-medium text-gray-900">
                      No Businesses Found
                    </h3>
                    <p className="mt-2 text-gray-600">
                      {searchTerm
                        ? "Try a different search term"
                        : "No businesses available at the moment. Please check back later."}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}