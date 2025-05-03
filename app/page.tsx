"use client";

import { useEffect, useState } from "react";
import HomeSearch from "@/components/ui/homeSearch";
import { Search, ClipboardCheck, Wallet } from "lucide-react";
import Footer from "@/components/footer";
import BusinessCard from "@/components/business/BusinessCards"; 
import Skeleton from 'react-loading-skeleton'; 

type Business = {
  sortedCategories: string[];
  groupedRequirements: Record<string, Requirement[]>;
  requirements: Requirement[] | undefined;
  id: string;
  name: string;
  image: string;
  slug: string;
};

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);

  const fetchBusinesses = async () => {
    try {
      const res = await fetch("/api/businesses"); 
      if (!res.ok) throw new Error(`Failed to fetch businesses`);
      const data = await res.json();
      setBusinesses(data);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  return (
    <>
      <main className="p-4">
        {/* Search Section */}
        <section className="flex flex-col items-center justify-center mb-8">
          <HomeSearch />
        </section>

        {/* How it Works Section */}
        <section className="mt-12">
          <div className="bg-white shadow-md rounded-2xl p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-3">
                  <Search className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  Search a Business
                </h3>
                <p className="text-sm text-gray-600">
                  Start by searching any business idea you&apos;re interested
                  in.
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-3">
                  <ClipboardCheck className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Add Requirements</h3>
                <p className="text-sm text-gray-600">
                  View and customize all requirements for starting that
                  business.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 p-4 rounded-full mb-3">
                  <Wallet className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-1">Cost Estimated</h3>
                <p className="text-sm text-gray-600">
                  We automatically calculate estimated startup costs for you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Business Cards Section */}
        <section className="mt-16 max-w-5xl mx-auto">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-2xl font-bold">Popular Businesses</h2>
    <a
      href="/businesses"
      className="text-green-600 hover:text-green-700"
    >
      See All Businesses
    </a>
  </div>

  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
    {businesses.length > 0 ? (
      businesses
        .slice(0, 3)
        .map((business) => (
          <BusinessCard 
            key={business.id}
            id={business.id}
            name={business.name}
            image={business.image}
            requirements={business.requirements}
            groupedRequirements={business.groupedRequirements}
            sortedCategories={business.sortedCategories}
            slug={business.name.toLowerCase().replace(/\s+/g, "-")} 
          />
        ))
    ) : (
      <>
        {/* Skeleton Loader for Businesses */}
        {[...Array(3)].map((_, index) => (
          <div key={index} className="w-full">
            <Skeleton height={200} />
            <Skeleton width="60%" height={20} className="mt-4" />
          </div>
        ))}
      </>
    )}
  </div>
</section>
      </main>

      <Footer />
    </>
  );
}
