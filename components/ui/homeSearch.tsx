"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Search as SearchIcon,
  ChevronDown,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const locations = ["Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru"];

type Business = {
  id: number;
  name: string;
  slug: string;
};

export default function HomeSearch() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<Business[]>([]);
  const [suggestionType, setSuggestionType] = useState<
    "popular" | "recent" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/businesses/popular");
        const data = await response.json();

        if (response.ok && data.success) {
          setSearchSuggestions(data.results || []);
          setSuggestionType(data.type);
        } else {
          throw new Error(data.message || "Invalid API response");
        }
      } catch (err) {
        console.error("Error fetching search suggestions:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load search suggestions. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, []);

  const filteredLocations = locations.filter((loc) =>
    loc.toLowerCase().includes(location.toLowerCase())
  );

  const handleSearch = (keyword: string, loc: string = "") => {
    if (!keyword.trim()) return;

    let query = `/search?keyword=${encodeURIComponent(keyword.trim())}`;
    if (loc) {
      query += `&location=${encodeURIComponent(loc)}`;
    }
    router.push(query);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 text-white w-full overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-300 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-emerald-300 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-16 px-4 sm:px-6 lg:px-8">
        {/* Left Section - Enhanced content */}
        <div className="flex-1 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/30"
            >
              <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
              <span className="text-sm font-semibold">
                Kenya's #1 Business Startup Platform
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Launch Your Business{" "}
              <span className="relative inline-block">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400">
                  Smarter
                </span>
                <motion.div
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </span>
            </h1>

            <p className="text-xl md:text-2xl mb-10 max-w-2xl opacity-90 leading-relaxed">
              Discover everything you need to start any business in Kenya -
              requirements, costs, and suppliers - all in one intelligent
              platform.
            </p>

            {/* Enhanced Search + Location Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/95 backdrop-blur-md rounded-2xl p-2 shadow-2xl border border-white/20 w-full max-w-3xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-2">
                {/* Search Input - Updated to remove inner box styling */}
                <div className="relative flex-1 flex items-center">
                  <div className="absolute left-3 text-emerald-600">
                    <SearchIcon className="w-5 h-5" />
                  </div>
                  <Input
                    className="pl-11 pr-4 py-6 border-none focus:ring-0 focus-visible:ring-0 w-full h-auto placeholder-gray-500 text-base font-medium text-gray-800 rounded-xl"
                    placeholder="Search business (e.g. 'Gym')"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSearch(search, location);
                      }
                    }}
                  />
                </div>

                {/* Enhanced Search Button */}
                <Button
                  onClick={() => handleSearch(search, location)}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl px-8 py-6 text-base font-semibold whitespace-nowrap shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Search
                </Button>
              </div>
            </motion.div>

            {/* Enhanced Suggestions */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="mt-8"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-300 border-t-transparent mr-2"></div>
                  <span className="text-yellow-300 font-medium">
                    Loading suggestions...
                  </span>
                </div>
              ) : error ? (
                <span className="text-red-300 bg-red-500/20 px-3 py-1 rounded-full text-sm">
                  {error}
                </span>
              ) : searchSuggestions.length > 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-yellow-300 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {suggestionType === "popular"
                        ? "Popular Searches"
                        : "Recently Published"}
                      :
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {searchSuggestions.map((business) => (
                        <button
                          key={business.id}
                          onClick={() => handleSearch(business.name, location)}
                          className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 border border-white/30 hover:border-white/50 hover:scale-105"
                        >
                          {business.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        </div>

        {/* Right Section - Enhanced Graphics */}
        <div className="hidden lg:flex flex-1 justify-center items-center relative">
          <div className="relative w-full max-w-lg">
            {/* Main circular animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-white/30 rounded-full w-96 h-96 mx-auto"
            />

            {/* Inner rotating ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 border border-dotted border-white/20 rounded-full"
            />

            {/* Floating business icons with enhanced styling */}
            <div className="relative grid grid-cols-2 gap-6 w-80 h-80 mx-auto">
              {[
                {
                  icon: <Target className="w-8 h-8" />,
                  color: "from-yellow-400 to-orange-500",
                  label: "Goals",
                },
                {
                  icon: <Sparkles className="w-8 h-8" />,
                  color: "from-emerald-400 to-green-500",
                  label: "Innovation",
                },
                {
                  icon: <TrendingUp className="w-8 h-8" />,
                  color: "from-green-400 to-teal-500",
                  label: "Growth",
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  color: "from-teal-400 to-cyan-500",
                  label: "Community",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.5, duration: 0.6 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className={`relative bg-gradient-to-br ${item.color} rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-white cursor-pointer group`}
                >
                  {/* Glow effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.color} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center">
                    {item.icon}
                    <span className="text-xs font-semibold mt-2 opacity-90">
                      {item.label}
                    </span>
                  </div>

                  {/* Floating particles */}
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full opacity-60"
                    animate={{ y: [-5, 5], opacity: [0.3, 0.8] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                </motion.div>
              ))}
            </div>

            {/* Additional floating elements */}
            <motion.div
              className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full opacity-20 blur-xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -bottom-4 -left-4 w-20 h-20 bg-gradient-to-r from-emerald-300 to-teal-400 rounded-full opacity-20 blur-xl"
              animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
