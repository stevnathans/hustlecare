'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useCart, CartItem } from '@/contexts/CartContext'; 
import { Business } from '@prisma/client';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiChevronDown, FiChevronRight, FiSave, FiCopy, FiShare2, FiX } from 'react-icons/fi';

// Define the order of categories for consistent display
const CATEGORY_ORDER = [
  "Legal",
  "Equipment",
  "Software",
  "Documents",
  "Branding",
  "Operating Expenses",
  "Uncategorized",
];

interface CostCalculatorProps {
  business: Business;
}

type GroupedCartItems = {
  [categoryName: string]: {
    requirements: {
      [requirementName: string]: CartItem[];
    };
    categoryTotalItems: number;
    categorySubtotal: number;
  };
};

const CostCalculator: React.FC<CostCalculatorProps> = ({ business }) => {
  const { items, totalCost, totalItems: overallTotalItems, updateQuantity, removeFromCart, saveCart, businessId, clearCategory, clearRequirement } = useCart();
  const [cartName, setCartName] = useState('');
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Lock body scroll when calculator is expanded on mobile
  useEffect(() => {
    if (isMobile && isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isExpanded]);
  
  // Helper function for singular/plural items
  const formatItemCount = (count: number) => {
    return count === 1 ? `${count} item` : `${count} items`;
  };

  const groupedAndSortedItems = useMemo(() => {
    const grouped: GroupedCartItems = items.reduce((acc, item) => {
      const category = item.category || "Uncategorized";
      const requirement = item.requirementName || "Unspecified Requirement";

      if (!acc[category]) {
        acc[category] = {
          requirements: {},
          categoryTotalItems: 0,
          categorySubtotal: 0,
        };
      }
      if (!acc[category].requirements[requirement]) {
        acc[category].requirements[requirement] = [];
      }

      acc[category].requirements[requirement].push(item);
      acc[category].categoryTotalItems += item.quantity;
      acc[category].categorySubtotal += item.price * item.quantity;

      return acc;
    }, {} as GroupedCartItems);

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const indexA = CATEGORY_ORDER.indexOf(a);
      const indexB = CATEGORY_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
    
    return sortedCategories.map(categoryName => ({
        name: categoryName,
        ...grouped[categoryName]
    }));
  }, [items]);

  useEffect(() => {
    const initialExpandedState: Record<string, boolean> = {};
    groupedAndSortedItems.forEach(category => {
      initialExpandedState[category.name] = true;
    });
    setExpandedCategories(prev => ({ ...initialExpandedState, ...prev }));
  }, [groupedAndSortedItems]);

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    if (quantity > 0) {
      updateQuantity(productId, quantity);
    } else {
      removeFromCart(productId);
    }
  };

  const handleSaveCart = async () => {
    if (items.length === 0) {
      setSaveStatus({ success: false, message: 'Cannot save an empty list' });
      return;
    }
    setSaveStatus(null);
    setShareUrl(null);

    const name = cartName.trim() || `My ${business.name} List`;
    const result = await saveCart(name);
    
    if (result.success && result.cartId) {
      const url = `${window.location.origin}/shared/${result.cartId}`;
      setShareUrl(url);
      setSaveStatus({ success: true, message: 'List saved successfully!' });
    } else {
      setSaveStatus({ success: false, message: 'Failed to save list. Please try again.' });
    }
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          setSaveStatus({ success: true, message: 'Link copied to clipboard!' });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          setSaveStatus({ success: false, message: 'Failed to copy link.' });
        });
    }
  };

  const handleClearCategory = async (categoryName: string) => {
    await clearCategory(categoryName);
  };

  const handleClearRequirement = async (requirementName: string, categoryName: string) => {
    await clearRequirement(requirementName, categoryName);
  };

  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 sticky top-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Your {business.name} Requirements</h2>
        <div className="text-center py-10 text-gray-500">
          <FiShoppingCart size={56} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Your list is empty.</p>
          <p className="text-sm mt-2 text-gray-400">
            Add products from the requirements to calculate your startup costs.
          </p>
        </div>
      </div>
    );
  }

 if (isMobile && !isExpanded) {
  return (
    <>
      {/* Overlay that will be shown when calculator is expanded */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsExpanded(false)} />
      )}
      
      {/* Mobile summary panel */}
      <div 
        className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-xl p-4 z-50 transition-all duration-300"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex flex-col space-y-3">
         
          
          {/* Middle section with counts and total */}
          <div className="flex justify-between items-center px-4">
            <div className="flex items-center space-x-2">
              <FiShoppingCart className="text-white" size={18} />
              <span className="text-white text-sm">{formatItemCount(overallTotalItems)}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-bold text-lg">${totalCost.toFixed(2)}</span>
              <p className="text-white text-opacity-80 text-xs">Estimated Cost</p>
            </div>
          </div>
          
          {/* View Details button at bottom */}
          <button 
            className="w-full bg-white bg-opacity-20 text-emerald-600 rounded-lg py-2 text-sm font-medium flex items-center justify-center mt-2"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
          >
            View Details
          </button>
        </div>
      </div>
    </>
  );
}

  return (
    <>
      {/* Overlay that will be shown when calculator is expanded on mobile */}
      {isMobile && isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsExpanded(false)} />
      )}
      
      {/* Main calculator content */}
      <div className={`
        bg-white rounded-t-lg shadow-2xl border border-gray-200
        ${isMobile ? 
          `fixed inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto z-50 
           transition-all duration-300 ease-in-out 
           ${isExpanded ? 'translate-y-0' : 'translate-y-full'}` 
          : "sticky top-8"}
      `}>
        {isMobile && (
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-gray-800">{business.name} Requirements</h2>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>
        )}
        
        <div className="p-6">
          {!isMobile && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">{business.name} Requirements</h2>
              <div className="flex items-center">
                <span className="bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-sm font-medium flex items-center">
                  <FiShoppingCart className="mr-1" size={14} />
                  {formatItemCount(overallTotalItems)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {groupedAndSortedItems.map((category) => (
              <div key={category.name} className="border border-gray-200 rounded-md overflow-hidden">
                {/* Category Header */}
                <div 
                  className="bg-gray-100 px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={() => toggleCategory(category.name)}
                >
                  <div className="flex items-center">
                    {expandedCategories[category.name] ? <FiChevronDown className="mr-2 text-gray-600" /> : <FiChevronRight className="mr-2 text-gray-600" />}
                    <h3 className="font-semibold text-lg text-gray-700">{category.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-600 block">{formatItemCount(category.categoryTotalItems)}</span>
                    <span className="text-sm font-medium text-green-600 block">${category.categorySubtotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Expanded Category Content */}
                {expandedCategories[category.name] && (
                  <div className="p-1 bg-white">
                    <button 
                        onClick={() => handleClearCategory(category.name)}
                        className="text-xs text-red-500 hover:text-red-700 mb-2 ml-3 mt-1 flex items-center"
                        title={`Clear all items from ${category.name}`}
                    >
                        <FiTrash2 className="mr-1" /> Clear Category
                    </button>
                    {Object.entries(category.requirements).map(([requirementName, products]) => (
                      <div key={requirementName} className="mb-2 last:mb-0 px-3 py-2 bg-gray-50 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                            <h4 className="font-medium text-md text-gray-700">{requirementName}</h4>
                            <button 
                                onClick={() => handleClearRequirement(requirementName, category.name)}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center"
                                title={`Clear all items for ${requirementName}`}
                            >
                                <FiTrash2 className="mr-1" /> Clear Requirement
                            </button>
                        </div>
                        <div className="space-y-2">
                          {products.map((item) => (
                            <div key={item.productId} className="flex items-center py-2 border-b border-gray-100 last:border-b-0">
                              {item.image && (
                                <div className="relative h-12 w-12 mr-3 flex-shrink-0">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-contain rounded"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/48x48/cccccc/969696?text=N/A';}}
                                  />
                                </div>
                              )}
                              <div className="flex-grow">
                                <h5 className="font-normal text-sm text-gray-800">{item.name}</h5>
                                <p className="text-xs text-gray-500">${item.price.toFixed(2)}</p>
                              </div>
                              <div className="flex items-center space-x-1.5 ml-2">
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <FiMinus size={12} />
                                </button>
                                <span className="w-5 text-center text-sm font-medium text-gray-700">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <FiPlus size={12} />
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.productId)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                                  aria-label="Remove item"
                                >
                                  <FiTrash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-xl font-semibold text-gray-800">
              <span>Total Estimated Cost:</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center"><FiShare2 className="mr-2"/>Save or Share This List</h3>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                placeholder="Name your list (e.g., Cafe Requirements)"
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                className="flex-grow px-4 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              <button
                onClick={handleSaveCart}
                disabled={!businessId || items.length === 0}
                className="px-6 py-2.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm font-medium"
              >
                <FiSave className="mr-2"/> Save List
              </button>
            </div>
            
            {saveStatus && (
              <div className={`p-3 rounded-md text-sm ${saveStatus.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {saveStatus.message}
              </div>
            )}
            
            {shareUrl && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-600 mb-1">Shareable Link:</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow px-4 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-700"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-2.5 bg-gray-700 text-white rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center text-sm font-medium"
                  >
                    <FiCopy className="mr-2"/> Copy Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c7c7c7;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #a3a3a3;
          }
        `}</style>
      </div>
    </>
  );
};

export default CostCalculator;