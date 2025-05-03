"use client";

import { useEffect, useState, useMemo } from "react";
import BusinessCard from "@/components/business/BusinessCards";
import prisma from "@/lib/prisma";

interface Business {
  id: number;
  name: string;
  image?: string;
  slug: string;
}

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className="max-w-7xl mx-auto">
      {/* Green Background Section */}
      <div className="bg-green-600 px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Start Your Next Business in a Few Steps
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Browse our collection of business opportunities
          </p>
          
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search businesses..."
              className="w-full px-6 py-4 bg-white border-0 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-700 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                onClick={() => setSearchTerm("")}
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
      </div>

      {/* Main Content Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Popular Right Now
        </h2>

        {loading ? (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="h-80 bg-gray-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((biz) => (
                <BusinessCard
                  key={biz.id}
                  id={biz.id}
                  name={biz.name}
                  image={biz.image}
                  slug={biz.name.toLowerCase().replace(/\s+/g, "-")}
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
                    : "No businesses available at the moment"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}