'use client';
import React from 'react';
import { use } from 'react';
import CostCalculator from '@/components/CostCalculator';
import BusinessHeader from '@/components/DetailsPage/BusinessHeader';
import RequirementsSection from '@/components/DetailsPage/RequirementsSection';
import { useBusinessData } from 'hooks/useBusinessData';
import { useFilterState } from 'hooks/useFilterState';
import Link from 'next/link';

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = use(params);
  
  const {
    business,
    requirements,
    products,
    error,
    groupedRequirements,
    sortedCategories
  } = useBusinessData(slug);

  const {
    categoryStates,
    globalSearchQuery,
    setGlobalSearchQuery,
    globalFilter,
    setGlobalFilter,
    requiredCount,
    optionalCount,
    unfilteredLowPrice,
    unfilteredHighPrice,
    totalRequirements,
    getFilteredRequirements,
    filteredCategories,
    toggleCategorySearch,
    toggleFilter,
    setFilter,
    handleCategorySearchChange
  } = useFilterState(requirements, products, groupedRequirements, sortedCategories);

  // Handle 404 case properly
  if (error === 'Business not found' || (!business && !error)) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Business Not Found</h1>
        <p className="text-gray-600 mb-4">
          The business you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" className="text-blue-600 hover:underline">
  Return to Home
</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 p-4 rounded-md text-red-800">
          <h1 className="text-xl font-semibold mb-2">Error Loading Business</h1>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": business.name,
    "description": business.description || `${business.name} business requirements and cost calculator`,
    "url": `https://yoursite.com/business/${slug}`,
    "image": business.image || "/images/default-business.jpg",
    "priceRange": unfilteredLowPrice && unfilteredHighPrice ? `$${unfilteredLowPrice}-$${unfilteredHighPrice}` : undefined,
    "aggregateRating": business.rating ? {
      "@type": "AggregateRating",
      "ratingValue": business.rating,
      "reviewCount": business.reviewCount || 1
    } : undefined,
    "address": business.address ? {
      "@type": "PostalAddress",
      "streetAddress": business.address.street,
      "addressLocality": business.address.city,
      "addressRegion": business.address.state,
      "postalCode": business.address.zip,
      "addressCountry": business.address.country || "US"
    } : undefined,
    "telephone": business.phone,
    "email": business.email,
    "openingHours": business.hours,
    "sameAs": business.socialLinks || []
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* Main heading for SEO */}
        <header className="mb-8">
          <h1 className="sr-only">
            {business.name} in Kenya - Complete Requirements and Costs
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <main className="md:col-span-2">
            {/* Header Section */}
            <BusinessHeader
              businessSlug={slug}
              totalRequirements={totalRequirements}
              businessName={business.name}
              unfilteredLowPrice={unfilteredLowPrice}
              unfilteredHighPrice={unfilteredHighPrice}
              requiredCount={requiredCount}
              optionalCount={optionalCount}
            />


            {/* Requirements Sections */}
            <section aria-label="Business requirements">
              <RequirementsSection
                businessName={business.name}
                sortedCategories={filteredCategories}
                groupedRequirements={groupedRequirements}
                products={products}
                categoryStates={categoryStates}
                globalSearchQuery={globalSearchQuery}
                globalFilter={globalFilter}
                setGlobalSearchQuery={setGlobalSearchQuery}
                setGlobalFilter={setGlobalFilter}
                onToggleCategorySearch={toggleCategorySearch}
                onToggleFilter={toggleFilter}
                onCategorySearchChange={handleCategorySearchChange}
                onSetFilter={setFilter}
                getFilteredRequirements={getFilteredRequirements}
                 
              />
            </section>
          </main>

          {/* Cost Calculator Sidebar */}
          <aside className="sticky top-8 self-start" aria-label="Cost calculator">
            <CostCalculator 
            business={business} />
          </aside>
        </div>
      </div> 
    </>
  );
}