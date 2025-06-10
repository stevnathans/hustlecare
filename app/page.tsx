"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { Search, ClipboardCheck, Wallet, ArrowRight, ChevronRight } from "lucide-react";
import HomeSearch from "@/components/ui/homeSearch";
import BusinessCard from "@/components/business/BusinessCards";
import Skeleton from "react-loading-skeleton";
import { motion } from "framer-motion";

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
        <section className="relative bg-white py-20" aria-label="How Hustlecare Works">
          {/* Decorative wave transition */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-emerald-700 to-green-600 transform -skew-y-1 origin-top-left"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-4xl font-bold tracking-tight sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600"
              >
                How Hustlecare Works
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed"
              >
                Transform your business dreams into reality with our streamlined 3-step process
              </motion.p>
            </div>

            <div className="relative">
              {/* Enhanced connecting line with gradient */}
              <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent transform -translate-y-1/2 z-0 opacity-60" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative z-10">
                {[
                  {
                    icon: <Search className="w-10 h-10" />,
                    title: "Search & Discover",
                    description: "Find any business idea you're passionate about with our intelligent search",
                    color: "from-emerald-400 to-green-500",
                    bgColor: "from-emerald-50 to-green-50"
                  },
                  {
                    icon: <ClipboardCheck className="w-10 h-10" />,
                    title: "Customize Requirements",
                    description: "View detailed startup requirements and tailor them to your specific needs",
                    color: "from-green-500 to-teal-600",
                    bgColor: "from-green-50 to-teal-50"
                  },
                  {
                    icon: <Wallet className="w-10 h-10" />,
                    title: "Calculate Costs",
                    description: "Get precise startup cost estimates automatically calculated for your business",
                    color: "from-teal-600 to-emerald-700",
                    bgColor: "from-teal-50 to-emerald-50"
                  }
                ].map((step, index) => (
                  <motion.div 
                    key={index}
                    initial={{ y: 50, opacity: 0 }}
                    whileInView={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: index * 0.15 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center group"
                  >
                    {/* Icon with enhanced styling */}
                    <div className={`mb-8 relative`}>
                      <div className={`absolute inset-0 bg-gradient-to-r ${step.color} rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300`}></div>
                      <div className={`relative p-6 rounded-full bg-gradient-to-r ${step.color} shadow-xl group-hover:shadow-2xl transition-all duration-300`}>
                        <div className="text-white">
                          {step.icon}
                        </div>
                      </div>
                    </div>
                    
                    {/* Content card with enhanced styling */}
                    <motion.div 
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className={`bg-gradient-to-br ${step.bgColor} p-8 rounded-2xl shadow-lg border border-white/50 w-full text-center backdrop-blur-sm group-hover:shadow-xl transition-all duration-300`}
                    >
                      <div className="flex justify-center mb-4">
                        <span className="bg-white/80 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
                          Step {index + 1}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed text-lg">{step.description}</p>
                      
                      {index < 2 && (
                        <div className="md:hidden flex justify-center mt-6">
                          <div className="p-2 bg-emerald-100 rounded-full">
                            <ChevronRight className="w-6 h-6 text-emerald-600" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-16 text-center">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full shadow-xl text-white bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 transition-all duration-300 hover:shadow-2xl"
              >
                Start Your Journey Today
                <ArrowRight className="ml-3 h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </section>

        {/* Business Cards Section with enhanced styling */}
        <section className="bg-gradient-to-b from-white to-slate-50 py-20" aria-label="Popular Businesses">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-12">
              <motion.h2 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-green-600"
              >
                Popular Businesses
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <Link 
                  href="/business" 
                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold text-lg group transition-colors duration-300"
                >
                  Explore All Businesses
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