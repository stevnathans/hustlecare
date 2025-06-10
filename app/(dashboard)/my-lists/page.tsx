"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import DesktopSidebar from "@/components/UserProfile/DesktopSidebar";
import MobileHeader from "@/components/UserProfile/MobileHeader";
import BusinessCard from "@/components/UserProfile/BusinessCard";
import UserStats from "@/components/UserProfile/UserStats";
import Link from "next/link";

interface SavedBusiness {
  id: string;
  name: string;
  totalCost: number;
  itemsCount: number;
  lastUpdated: string;
  slug: string;
}

export default function MyLists() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  

  useEffect(() => {
    const fetchSavedBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile/lists");

        if (!response.ok) {
          throw new Error("Failed to load saved businesses");
        }

        const data = await response.json();

        const mappedBusinesses: SavedBusiness[] = data.lists.map(
          (list: any) => ({
            id: list.businessId,
            name: list.businessName,
            totalCost: list.totalCost,
            itemsCount: list.totalItems,
            lastUpdated: list.updatedAt,
            slug: list.businessSlug,
          })
        );

        setBusinesses(mappedBusinesses);

        const calculatedTotal = mappedBusinesses.reduce(
          (sum: number, business: SavedBusiness) => sum + business.totalCost,
          0
        );
        setTotalCost(calculatedTotal);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "An unknown error occurred"
        );
        console.error("Error loading saved businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedBusinesses();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full">
        <DesktopSidebar />
        <MobileHeader />
        <main className="flex-1 md:pl-64 pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="text-center">
              <p className="text-lg">Loading your businesses...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full">
        <DesktopSidebar />
        <MobileHeader />
        <main className="flex-1 md:pl-64 pt-16 md:pt-0">
          <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <div className="bg-red-100 p-4 rounded-md text-red-800">
              <p>Error: {error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <DesktopSidebar />
      <MobileHeader />

      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <UserStats
            businesses={businesses.length}
            totalCost={`$${totalCost.toLocaleString()}`}
          />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {businesses.map((business) => (
              <BusinessCard
                key={business.id}
                name={business.name}
                cost={`$${business.totalCost.toLocaleString()}`}
                items={business.itemsCount}
                lastUpdated={`${formatDistanceToNow(
                  new Date(business.lastUpdated),
                  { addSuffix: true }
                )}`}
                slug={business.slug}
              />
            ))}

            <Link href="/business">
              <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:text-indigo-500 transition-colors flex flex-col items-center justify-center p-6 cursor-pointer">
                <span className="text-2xl font-medium">+</span>
                <span className="mt-2 text-sm font-medium">
                  Add New Business
                </span>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
