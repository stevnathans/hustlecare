"use client";
import { useEffect, useState, useMemo } from "react";
import RequirementCard from "@/components/Requirements/RequirementCard";
import { FiSliders, FiSearch, FiX } from "react-icons/fi";
import { useCart } from "@/contexts/CartContext";
import { Product } from "@/types/index";

interface BusinessDetailsClientProps {
  groupedRequirements: Record<string, any[]>;
  sortedCategories: string[];
  businessName: string;
}

export default function BusinessDetailsClient({
  groupedRequirements,
  sortedCategories,
  businessName,
}: BusinessDetailsClientProps) {
  const { cartItems, addToCart, removeFromCart } = useCart();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [expandedRequirementId, setExpandedRequirementId] = useState<string | null>(null);
  const [filterStates, setFilterStates] = useState<
    Record<
      string,
      {
        showFilter: boolean;
        filter: "all" | "required" | "optional";
        showSearch: boolean;
        searchQuery: string;
      }
    >
  >({});
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Calculate total requirements across all categories
  const totalRequirements = useMemo(() => {
    return sortedCategories.reduce((total, category) => {
      return total + (groupedRequirements[category]?.length || 0);
    }, 0);
  }, [groupedRequirements, sortedCategories]);

  // Function to find matching products for a requirement
  const findMatchingProducts = (requirement) => {
    const requirementName = requirement.name.toLowerCase();
    return allProducts
      .filter(product => product.name.toLowerCase().includes(requirementName))
      .slice(0, 4)
      .map(product => ({
        ...product,
        category: requirement.category || requirement.categoryName || "Uncategorized",
        requirement: requirement.name,
        // Ensure product has an ID
        id: product.id || `product-${product.name.toLowerCase().replace(/\s+/g, '-')}`,
      }));
  };

  // Calculate estimated cost range
  const { lowPrice, highPrice } = useMemo(() => {
    let minTotal = 0;
    let maxTotal = 0;

    // Only calculate if we have products loaded
    if (allProducts.length === 0) {
      return { lowPrice: 0, highPrice: 0 };
    }

    sortedCategories.forEach(category => {
      const requirements = groupedRequirements[category] || [];
      requirements.forEach(requirement => {
        // Find matching products for this requirement
        const matchingProducts = findMatchingProducts(requirement);
        
        if (matchingProducts.length > 0) {
          const prices = matchingProducts.map(p => {
            const price = p.price || 0;
            const quantity = p.quantity || 1;
            return price * quantity;
          });
          
          if (prices.length > 0) {
            minTotal += Math.min(...prices);
            maxTotal += Math.max(...prices);
          }
        }
      });
    });

    return { lowPrice: minTotal, highPrice: maxTotal };
  }, [groupedRequirements, sortedCategories, allProducts]);

  // Format price range display
  const priceRangeText = useMemo(() => {
    if (lowPrice === 0 && highPrice === 0) return 'No cost estimate';
    if (lowPrice === highPrice) return `~$${lowPrice.toLocaleString()}`;
    return `$${lowPrice.toLocaleString()} - $${highPrice.toLocaleString()}`;
  }, [lowPrice, highPrice]);

  // Get all requirements flattened for global search
  const allRequirements = useMemo(() => {
    return sortedCategories.flatMap(category =>
      (groupedRequirements[category] || []).map(req => ({
        ...req,
        category
      }))
    );
  }, [groupedRequirements, sortedCategories]);

  // Filter requirements based on global search
  const filteredByGlobalSearch = useMemo(() => {
    if (!globalSearchQuery.trim()) return [];
    const query = globalSearchQuery.toLowerCase().trim();
    return allRequirements.filter(req =>
      req.name.toLowerCase().includes(query) ||
      (req.description && req.description.toLowerCase().includes(query)) ||
      req.category.toLowerCase().includes(query)
    );
  }, [allRequirements, globalSearchQuery]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setAllProducts(data);
      } catch (error) {
        console.error("Failed to fetch products", error);
      }
    };

    fetchProducts();
  }, []);

  // Initialize filter states
  useEffect(() => {
    const initialFilters = sortedCategories.reduce((acc, category) => {
      acc[category] = {
        showFilter: false,
        filter: "all",
        showSearch: false,
        searchQuery: "",
      };
      return acc;
    }, {} as Record<string, any>);
    setFilterStates(initialFilters);
  }, [sortedCategories]);

  const toggleRequirement = (id: string) => {
    setExpandedRequirementId(prevId => (prevId === id ? null : id));
  };

  const handleToggleList = (product: Product) => {
    const isInCart = cartItems.some(item => item.id === product.id);

    if (isInCart) {
      removeFromCart(product.id);
    } else {
      // Ensure all required fields are included
      const completeProduct = {
        id: product.id, 
        name: product.name,
        price: product.price || 0,
        business: businessName || "",
        category: product.category || "Uncategorized",
        quantity: 1,
        // Include any other properties that might be required
        requirement: product.requirement || ""
      };
      
      addToCart(completeProduct);
    }
  };

  const isProductInList = (product: Product) => {
    return cartItems.some(item => item.id === product.id);
  };

  // Get product quantity from cart
  const getProductQuantity = (productId: string): number => {
    const cartItem = cartItems.find(item => item.id === productId);
    return cartItem ? (cartItem.quantity || 1) : 1;
  };

  const toggleFilter = (category: string) => {
    setFilterStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        showFilter: !prev[category].showFilter,
        showSearch: false,
      },
    }));
  };

  const toggleSearch = (category: string) => {
    setFilterStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        showSearch: !prev[category].showSearch,
        showFilter: false,
      },
    }));
  };

  const setFilter = (
    category: string,
    filter: "all" | "required" | "optional"
  ) => {
    setFilterStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        filter,
      },
    }));
  };

  const handleSearchChange = (category: string, query: string) => {
    setFilterStates(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        searchQuery: query,
      },
    }));
  };

  const clearGlobalSearch = () => {
    setGlobalSearchQuery("");
  };

  return (
    <div className="space-y-6">
      {/* Business Header Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-2">
              <p className="text-sm">
                <span className="font-medium">{totalRequirements}</span> total requirements
              </p>
              <p className="text-sm">
                <span className="font-medium">Estimated cost:</span> {priceRangeText}
              </p>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search all requirements..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
            />
            {globalSearchQuery && (
              <button
                onClick={clearGlobalSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <FiX className="text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results or Categories */}
      {globalSearchQuery ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Search Results for "{globalSearchQuery}" ({filteredByGlobalSearch.length})
          </h2>

          {filteredByGlobalSearch.length > 0 ? (
            filteredByGlobalSearch.map(requirement => {
              // Using our new helper function
              const matchingProducts = findMatchingProducts(requirement);
              const isExpanded = expandedRequirementId === requirement.id.toString();

              return (
                <div key={requirement.id} className="bg-white rounded-lg shadow p-6">
                  <div className="mb-2 text-sm text-gray-500 font-medium">
                    {requirement.category}
                  </div>
                  <RequirementCard
                    requirement={{
                      id: requirement.id.toString(),
                      name: requirement.name,
                      description: requirement.description || "",
                      status: requirement.necessity.toLowerCase() === "required" ? "required" : "optional",
                      productCount: matchingProducts.length,
                      lowestPrice: matchingProducts.length ? Math.min(...matchingProducts.map(p => p.price ?? 0)) : 0,
                      imageUrl: requirement.image || undefined,
                    }}
                    matchingProducts={matchingProducts}
                    isExpanded={isExpanded}
                    onToggle={() => toggleRequirement(requirement.id.toString())}
                    isProductInList={isProductInList}
                    onToggleList={handleToggleList}
                    getProductQuantity={getProductQuantity}
                    business={businessName}
                  />
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No requirements found matching "{globalSearchQuery}"</p>
              <button
                onClick={clearGlobalSearch}
                className="mt-4 text-blue-600 hover:text-blue-800"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      ) : (
        sortedCategories.map(category => {
          const requirementsCount = groupedRequirements[category]?.length || 0;
          const currentFilter = filterStates[category]?.filter || "all";
          const showFilter = filterStates[category]?.showFilter || false;
          const showSearch = filterStates[category]?.showSearch || false;
          const searchQuery = filterStates[category]?.searchQuery || "";

          const filteredRequirements = groupedRequirements[category]?.filter(req => {
            if (currentFilter !== "all" && req.necessity.toLowerCase() !== currentFilter) {
              return false;
            }
            if (searchQuery) {
              const query = searchQuery.toLowerCase();
              return (
                req.name.toLowerCase().includes(query) ||
                (req.description && req.description.toLowerCase().includes(query))
              );
            }
            return true;
          }) || [];

          return (
            <section
              key={category}
              id={category.replace(/\s+/g, "-").toLowerCase()}
              className="scroll-mt-32 bg-gray-100 rounded-lg shadow"
            >
              <div className="bg-gray-200 rounded-t-lg px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold">{category}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 text-sm font-medium">
                    {filteredRequirements.length} of {requirementsCount} Requirements
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleSearch(category)}
                      className={`p-2 rounded-full ${showSearch ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <FiSearch className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleFilter(category)}
                      className={`p-2 rounded-full ${showFilter ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                      <FiSliders className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {showSearch && (
                <div className="px-6 py-3 bg-gray-50 border-t border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${category} requirements...`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(category, e.target.value)}
                    />
                  </div>
                </div>
              )}

              {showFilter && (
                <div className="px-6 py-3 bg-gray-50 border-t border-b border-gray-200 flex gap-2">
                  <button
                    onClick={() => setFilter(category, "all")}
                    className={`px-3 py-1 text-xs rounded-md ${
                      currentFilter === "all" ? "bg-blue-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter(category, "required")}
                    className={`px-3 py-1 text-xs rounded-md ${
                      currentFilter === "required" ? "bg-green-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Required
                  </button>
                  <button
                    onClick={() => setFilter(category, "optional")}
                    className={`px-3 py-1 text-xs rounded-md ${
                      currentFilter === "optional" ? "bg-yellow-500 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    Optional
                  </button>
                </div>
              )}

              <div className="p-6 space-y-6">
                {filteredRequirements.length > 0 ? (
                  filteredRequirements.map(requirement => {
                    // Using our new helper function
                    const matchingProducts = findMatchingProducts(requirement);
                    const isExpanded = expandedRequirementId === requirement.id.toString();

                    return (
                      <div key={requirement.id} className="space-y-4">
                        <RequirementCard
                          requirement={{
                            id: requirement.id.toString(),
                            name: requirement.name,
                            description: requirement.description || "",
                            status: requirement.necessity.toLowerCase() === "required" ? "required" : "optional",
                            productCount: matchingProducts.length,
                            lowestPrice: matchingProducts.length ? Math.min(...matchingProducts.map(p => p.price ?? 0)) : 0,
                            imageUrl: requirement.image || undefined,
                          }}
                          matchingProducts={matchingProducts}
                          isExpanded={isExpanded}
                          onToggle={() => toggleRequirement(requirement.id.toString())}
                          isProductInList={isProductInList}
                          onToggleList={handleToggleList}
                          getProductQuantity={getProductQuantity} 
                          business={businessName}                        
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    No requirements match your search
                  </div>
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}