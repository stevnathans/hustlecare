'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { useCart, CartItem } from '@/contexts/CartContext'; 
import { Business } from '@prisma/client';
import { FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiChevronDown, FiChevronRight, FiSave, FiCopy, FiShare2, FiX, FiEdit2, FiCheck, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [editingQuantity, setEditingQuantity] = useState<number | null>(null);
  const [quantityInputValue, setQuantityInputValue] = useState<string>('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
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
  
  // Format currency with commas
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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

    // Sort products within each requirement by productId to maintain consistent order
    Object.values(grouped).forEach(category => {
      Object.values(category.requirements).forEach(products => {
        products.sort((a, b) => Number(a.productId) - Number(b.productId));
      });
    });

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

  const handleQuantityEdit = (productId: number, currentQuantity: number) => {
    setEditingQuantity(productId);
    setQuantityInputValue(currentQuantity.toString());
  };

  const handleQuantitySave = (productId: number) => {
    const newQuantity = parseInt(quantityInputValue);
    if (!isNaN(newQuantity) && newQuantity > 0) {
      handleQuantityChange(productId, newQuantity);
    }
    setEditingQuantity(null);
    setQuantityInputValue('');
  };

  const handleQuantityInputKeyDown = (e: React.KeyboardEvent, productId: number) => {
    if (e.key === 'Enter') {
      handleQuantitySave(productId);
    } else if (e.key === 'Escape') {
      setEditingQuantity(null);
      setQuantityInputValue('');
    }
  };

  const handleDownloadPDF = async () => {
    if (items.length === 0) {
      setSaveStatus({ success: false, message: 'Cannot download an empty list' });
      return;
    }

    setIsGeneratingPDF(true);
    setSaveStatus(null);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let yPosition = margin;

      // Header
      doc.setFillColor(16, 185, 129); // emerald-600
      doc.rect(0, 0, pageWidth, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(`${business.name} Requirements`, margin, 15);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const listName = cartName.trim() || `My ${business.name} List`;
      doc.text(listName, margin, 25);
      
      const currentDate = new Date().toLocaleDateString('en-KE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Generated: ${currentDate}`, margin, 32);

      yPosition = 45;

      // Summary section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Items: ${formatItemCount(overallTotalItems)}`, margin, yPosition);
      yPosition += 6;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Cost: KSh ${formatCurrency(totalCost)}`, margin, yPosition);
      
      yPosition += 15;

      // Categories and items
      doc.setTextColor(0, 0, 0);
      
      for (const category of groupedAndSortedItems) {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        // Category header
        doc.setFillColor(243, 244, 246); // gray-100
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 41, 55); // gray-800
        doc.text(category.name, margin + 2, yPosition);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(
          `${formatItemCount(category.categoryTotalItems)} | KSh ${formatCurrency(category.categorySubtotal)}`,
          pageWidth - margin - 2,
          yPosition,
          { align: 'right' }
        );
        
        yPosition += 12;

        // Requirements and products
        for (const [requirementName, products] of Object.entries(category.requirements)) {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFontSize(10);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(55, 65, 81); // gray-700
          doc.text(`  ${requirementName}`, margin, yPosition);
          yPosition += 7;

          // Products table
          const tableData = products.map(item => [
            item.name,
            item.quantity.toString(),
            `KSh ${formatCurrency(item.price)}`,
            `KSh ${formatCurrency(item.price * item.quantity)}`
          ]);

          autoTable(doc, {
            startY: yPosition,
            head: [['Product', 'Qty', 'Unit Price', 'Subtotal']],
            body: tableData,
            theme: 'plain',
            styles: {
              fontSize: 9,
              cellPadding: 3,
            },
            headStyles: {
              fillColor: [249, 250, 251], // gray-50
              textColor: [75, 85, 99], // gray-600
              fontStyle: 'bold',
              fontSize: 8,
            },
            columnStyles: {
              0: { cellWidth: 'auto' },
              1: { cellWidth: 20, halign: 'center' },
              2: { cellWidth: 35, halign: 'right' },
              3: { cellWidth: 35, halign: 'right' },
            },
            margin: { left: margin + 5 },
            didDrawPage: (data) => {
              yPosition = data.cursor?.y || yPosition;
            }
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          yPosition = (doc as any).lastAutoTable.finalY + 8;
        }

        yPosition += 5;
      }

      // Footer on last page
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'This is an estimated cost breakdown. Actual prices may vary.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Save the PDF
      const fileName = `${business.name.replace(/\s+/g, '_')}_Requirements_${new Date().getTime()}.pdf`;
      doc.save(fileName);

      setSaveStatus({ success: true, message: 'PDF downloaded successfully!' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setSaveStatus({ success: false, message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleSaveCart = async () => {
    if (items.length === 0) {
      setSaveStatus({ success: false, message: 'Cannot save an empty list' });
      return;
    }
    
    setIsSaving(true);
    setSaveStatus(null);
    setShareUrl(null);

    const name = cartName.trim() || `My ${business.name} List`;
    const result = await saveCart(name);
    
    setIsSaving(false);
    
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
    if (confirm(`Are you sure you want to remove all items from ${categoryName}?`)) {
      await clearCategory(categoryName);
    }
  };

  const handleClearRequirement = async (requirementName: string, categoryName: string) => {
    if (confirm(`Are you sure you want to remove all items for ${requirementName}?`)) {
      await clearRequirement(requirementName, categoryName);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 sticky top-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
          <FiShoppingCart className="mr-2 text-emerald-600" />
          Your {business.name} Requirements
        </h2>
        <div className="text-center py-12 text-gray-500">
          <div className="mb-6 relative">
            <FiShoppingCart size={64} className="mx-auto text-gray-200" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <FiPlus className="text-emerald-600" size={16} />
              </div>
            </div>
          </div>
          <p className="text-lg font-medium text-gray-700 mb-2">Your requirements list is empty</p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Browse through the requirements below and add products to calculate your startup costs.
          </p>
        </div>
      </div>
    );
  }

  if (isMobile && !isExpanded) {
    return (
      <>
        {isExpanded && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsExpanded(false)} />
        )}
        
        <div 
          className="fixed bottom-4 left-4 right-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl shadow-2xl p-4 z-[60] transition-all duration-300 hover:shadow-emerald-500/50 cursor-pointer"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <FiShoppingCart className="text-white" size={20} />
                </div>
                <div>
                  <span className="text-white text-sm font-medium block">{formatItemCount(overallTotalItems)}</span>
                  <span className="text-white text-opacity-80 text-xs">in your list</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white font-bold text-xl block">KSh {formatCurrency(totalCost)}</span>
                <p className="text-white text-opacity-80 text-xs">Total Cost</p>
              </div>
            </div>
            
            <button 
              className="w-full bg-white text-emerald-600 rounded-xl py-2.5 text-sm font-semibold flex items-center justify-center shadow-md hover:shadow-lg transition-all"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
            >
              View Details
              <FiChevronRight className="ml-2" size={16} />
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {isMobile && isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[55]" onClick={() => setIsExpanded(false)} />
      )}
      
      <div className={`
        bg-white rounded-t-2xl shadow-2xl border border-gray-200
        ${isMobile ? 
          `fixed inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto z-[60] 
           transition-all duration-300 ease-in-out 
           ${isExpanded ? 'translate-y-0' : 'translate-y-full'}` 
          : "sticky top-8"}
      `}>
        {isMobile && (
          <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-2xl p-4 flex justify-between items-center z-10 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                <FiShoppingCart className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">{business.name} Requirements</h2>
                <p className="text-white text-opacity-80 text-xs">{formatItemCount(overallTotalItems)}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>
        )}
        
        <div className="p-6">
          {!isMobile && (
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                  <FiShoppingCart className="mr-2 text-emerald-600" />
                  {business.name} Requirements
                </h2>
                <p className="text-sm text-gray-500 mt-1">Review and adjust your selections</p>
              </div>
             
            </div>
          )}

          <div className="space-y-3 mb-6 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
            {groupedAndSortedItems.map((category) => (
              <div key={category.name} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div 
                  className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3.5 flex justify-between items-center cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all"
                  onClick={() => toggleCategory(category.name)}
                >
                  <div className="flex items-center">
                    <div className={`mr-3 transition-transform duration-200 ${expandedCategories[category.name] ? 'rotate-0' : '-rotate-90'}`}>
                      <FiChevronDown className="text-gray-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{category.name}</h3>
                      <p className="text-xs text-gray-500">{formatItemCount(category.categoryTotalItems)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-600 block">KSh {formatCurrency(category.categorySubtotal)}</span>
                  </div>
                </div>

                {expandedCategories[category.name] && (
                  <div className="p-3 bg-white">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearCategory(category.name);
                      }}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-md mb-2 ml-1 flex items-center transition-colors"
                      title={`Clear all items from ${category.name}`}
                    >
                      <FiTrash2 className="mr-1.5" size={12} /> Clear Category
                    </button>
                    {Object.entries(category.requirements).map(([requirementName, products]) => (
                      <div key={requirementName} className="mb-3 last:mb-0 px-3 py-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-800">{requirementName}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearRequirement(requirementName, category.name);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded flex items-center transition-colors"
                            title={`Clear all items for ${requirementName}`}
                          >
                            <FiTrash2 className="mr-1" size={11} /> Clear
                          </button>
                        </div>
                        <div className="space-y-2">
                          {products.map((item) => (
                            <div key={item.productId} className="flex items-center py-2.5 px-2 bg-white rounded-md border border-gray-100 hover:border-emerald-200 transition-colors">
                              {item.image && (
                                <div className="relative h-14 w-14 mr-3 flex-shrink-0 rounded-md overflow-hidden border border-gray-200">
                                  <Image
                                    src={item.image}
                                    alt={item.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    className="object-contain"
                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/56x56/f3f4f6/9ca3af?text=No+Image';}}
                                  />
                                </div>
                              )}
                              <div className="flex-grow min-w-0">
                                <h5 className="font-medium text-sm text-gray-800 truncate">{item.name}</h5>
                                <p className="text-xs text-gray-500 mt-0.5">KSh {formatCurrency(item.price)}</p>
                        
                              </div>
                              <div className="flex items-center space-x-1.5 ml-3">
                                <button
                                  onClick={() => handleQuantityChange(item.productId as number, item.quantity - 1)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <FiMinus size={14} />
                                </button>
                                {editingQuantity === item.productId as number ? (
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="number"
                                      value={quantityInputValue}
                                      onChange={(e) => setQuantityInputValue(e.target.value)}
                                      onKeyDown={(e) => handleQuantityInputKeyDown(e, item.productId as number)}
                                      onBlur={() => handleQuantitySave(item.productId as number)}
                                      className="w-12 text-center text-sm font-medium text-gray-700 border border-emerald-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      autoFocus
                                      min="1"
                                    />
                                    <button
                                      onClick={() => handleQuantitySave(item.productId as number)}
                                      className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                                      aria-label="Save quantity"
                                    >
                                      <FiCheck size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleQuantityEdit(item.productId as number, item.quantity)}
                                    className="w-10 text-center text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded px-2 py-1 transition-colors group"
                                    title="Click to edit quantity"
                                  >
                                    <span className="group-hover:hidden">{item.quantity}</span>
                                    <FiEdit2 className="hidden group-hover:inline mx-auto" size={12} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleQuantityChange(item.productId as number, item.quantity + 1)}
                                  className="p-1.5 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <FiPlus size={14} />
                                </button>
                                <button
                                  onClick={() => removeFromCart(item.productId)}
                                  className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md transition-colors ml-1"
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
          
          <div className="border-t border-gray-200 pt-5 bg-gradient-to-r from-emerald-50 to-green-50 -mx-6 px-6 py-5 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600 block mb-1">Total Estimated Cost</span>
                <span className="text-3xl font-bold text-emerald-700">KSh {formatCurrency(totalCost)}</span>
              </div>
               <div className="flex items-center">
                <span className="bg-emerald-100 text-emerald-800 rounded-full px-4 py-2 text-sm font-semibold flex items-center shadow-sm">
                  <FiShoppingCart className="mr-2" size={16} />
                  {formatItemCount(overallTotalItems)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6 space-y-4">
            {/* Show success message and share link above the heading */}
            {saveStatus && (
              <div className={`p-4 rounded-lg text-sm font-medium ${saveStatus.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                {saveStatus.message}
              </div>
            )}
            
            {shareUrl && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Share This Link:</label>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 font-mono"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg"
                  >
                    <FiCopy className="mr-2"/> Copy Link
                  </button>
                </div>
              </div>
            )}

            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiShare2 className="mr-2 text-emerald-600"/>
              Save & Share Your List
            </h3>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                placeholder="Name your list (e.g., Cafe Requirements)"
                value={cartName}
                onChange={(e) => setCartName(e.target.value)}
                className="flex-grow px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              />
              <button
                onClick={handleSaveCart}
                disabled={!businessId || items.length === 0 || isSaving}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2"/> Save List
                  </>
                )}
              </button>
            </div>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={items.length === 0 || isGeneratingPDF}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm font-semibold shadow-md hover:shadow-lg"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <FiDownload className="mr-2"/> Download as PDF
                </>
              )}
            </button>
          </div>
        </div>
        
        <style jsx global>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>
      </div>
    </>
  );
};

export default CostCalculator;