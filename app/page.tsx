"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Search, ClipboardCheck, ArrowRight, Calculator } from "lucide-react";
import HomeSearch from "@/components/ui/homeSearch";
import BusinessCard from "@/components/business/BusinessCards";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";
import { WhatWeDoSection } from "@/components/WhatWeDo"; 

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
      if (!res.ok) throw new Error("Failed to fetch businesses");
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
      <Head>
        <title>Start Any Business in Kenya – Hustlecare</title>
        <meta
          name="description"
          content="Discover startup requirements, estimate costs, and explore popular business ideas in Kenya with Hustlecare."
        />
        <link rel="canonical" href="http://localhost:3000/" />

        {/* Open Graph */}
        <meta property="og:title" content="Start Any Business in Kenya – Hustlecare" />
        <meta
          property="og:description"
          content="Search a business idea, view requirements, and calculate startup costs with Hustlecare – Kenya's smart business starter."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hustlecare.com/" />
        <meta property="og:image" content="https://hustlecare.com/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Start Any Business in Kenya – Hustlecare" />
        <meta
          name="twitter:description"
          content="Quickly search business ideas, customize requirements, and estimate startup costs – all in one place."
        />
        <meta name="twitter:image" content="https://hustlecare.com/og-image.jpg" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Search Section */}
        <section className="w-full">
          <HomeSearch />
        </section>

        {/* How it Works Section - Seamlessly connected */}
        <section className="py-20 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
      <span className="inline-block px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100/50 rounded-full mb-4">
        Our Process
      </span>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Simple <span className="text-emerald-600">3-Step</span> Process
      </h2>
      <p className="text-gray-600 max-w-3xl mx-auto text-lg">
        From idea to launch in the most efficient way possible
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        {
          icon: <Search className="w-6 h-6 text-emerald-600" />,
          title: "1. Discover",
          description: "Find your perfect business match with our intelligent search",
          borderColor: "border-emerald-200"
        },
        {
          icon: <ClipboardCheck className="w-6 h-6 text-emerald-600" />,
          title: "2. Customize",
          description: "Tailor requirements to your specific needs and location",
          borderColor: "border-emerald-300"
        },
        {
          icon: <Calculator className="w-6 h-6 text-emerald-600" />,
          title: "3. Calculate",
          description: "Get precise cost estimates for your startup budget",
          borderColor: "border-emerald-400"
        }
      ].map((step, index) => (
        <div 
          key={index}
          className={`p-8 rounded-xl border-t-4 ${step.borderColor} bg-white shadow-sm hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-emerald-50 rounded-lg">
              {step.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>
      ))}
    </div>

    <div className="mt-16 text-center">
      <Link
        href="/businesses"
        className="inline-flex items-center px-6 py-3 text-base font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
      >
        Browse All Businesses
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  </div>
</section>

        <WhatWeDoSection />  

        {/* Business Cards Section with enhanced styling */}
        <section className="bg-gradient-to-b from-white to-slate-50 py-20" aria-label="Popular Businesses">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-emerald-600"
              >
                Popular Now
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link 
                  href="/businesses" 
                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold text-lg group transition-colors duration-300"
                >
                  All Businesses
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </motion.div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {businesses.length > 0 ? (
                businesses.slice(0, 3).map((business, index) => (
                  <motion.div
                    key={business.id}
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <BusinessCard
                      id={business.id}
                      name={business.name}
                      image={business.image}
                      requirements={business.requirements}
                      groupedRequirements={business.groupedRequirements}
                      sortedCategories={business.sortedCategories}
                      slug={business.slug}
                    />
                  </motion.div>
                ))
              ) : (
                [...Array(3)].map((_, index) => (
                  <motion.div 
                    key={index} 
                    className="w-full"
                    initial={{ y: 30, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <Skeleton height={200} className="rounded-xl" />
                      <Skeleton width="70%" height={24} className="mt-6" />
                      <Skeleton width="50%" height={20} className="mt-3" />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}