'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Share2, ShoppingCart, Building, ArrowLeft, Plus, Minus, Download, FileText, Calendar, Package } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartItemType {
  id: string;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  requirementName?: string;
}

interface SharedCartProps {
  params: {
    cartId: string;
  };
}

// Helper to format currency
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Helper for item count
const formatItemCount = (count: number) => {
  return count === 1 ? `${count} item` : `${count} items`;
};

export default function SharedCartPage({ params }: SharedCartProps) {
  const { cartId } = params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<{
    id: string;
    name: string;
    businessName: string;
    totalCost: number;
    items: CartItemType[];
  } | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/shared/${cartId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load shared cart');
        }
        
        const data = await response.json();
        setCart(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        console.error('Error loading shared cart:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [cartId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (!cart || newQuantity < 0) return;
    
    setCart(prev => {
      if (!prev) return prev;
      
      const updatedItems = prev.items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
      
      const totalCost = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...prev,
        items: updatedItems,
        totalCost
      };
    });
  };

  const handleDownloadPDF = async () => {
    if (!cart) return;
    
    setGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      let yPosition = margin;

      // Header with gradient effect
      doc.setFillColor(16, 185, 129); // emerald-600
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(cart.name, margin, 15);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Business: ${cart.businessName}`, margin, 25);
      
      const currentDate = new Date().toLocaleDateString('en-KE', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Generated: ${currentDate}`, margin, 33);

      yPosition = 50;

      // Summary section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cart Summary', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Items: ${cart.items.length}`, margin, yPosition);
      yPosition += 7;
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      doc.text(`Total Cost: KSh ${formatCurrency(cart.totalCost)}`, margin, yPosition);
      
      yPosition += 15;

      // Group items by category if available
      const groupedItems: { [key: string]: CartItemType[] } = {};
      const hasCategories = cart.items.some(item => item.category);

      if (hasCategories) {
        cart.items.forEach(item => {
          const category = item.category || 'Uncategorized';
          if (!groupedItems[category]) {
            groupedItems[category] = [];
          }
          groupedItems[category].push(item);
        });

        // Render items by category
        for (const [category, items] of Object.entries(groupedItems)) {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = margin;
          }

          // Category header
          doc.setFillColor(243, 244, 246);
          doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 10, 'F');
          
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(31, 41, 55);
          doc.text(category, margin + 2, yPosition);
          
          const categoryTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(107, 114, 128);
          doc.text(
            `${items.length} items | KSh ${formatCurrency(categoryTotal)}`,
            pageWidth - margin - 2,
            yPosition,
            { align: 'right' }
          );
          
          yPosition += 12;

          // Items table
          const tableData = items.map(item => [
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
              fillColor: [249, 250, 251],
              textColor: [75, 85, 99],
              fontStyle: 'bold',
              fontSize: 9,
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

          yPosition = (doc as any).lastAutoTable.finalY + 10;
        }
      } else {
        // No categories - simple table
        const tableData = cart.items.map(item => [
          item.name,
          item.quantity.toString(),
          `KSh ${formatCurrency(item.price)}`,
          `KSh ${formatCurrency(item.price * item.quantity)}`
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Product', 'Qty', 'Unit Price', 'Subtotal']],
          body: tableData,
          theme: 'striped',
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [16, 185, 129],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 40, halign: 'right' },
          },
          margin: { left: margin, right: margin },
        });
      }

      // Footer
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'italic');
      doc.text(
        'This is a shared cart. Visit the original link to create your own list.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `${cart.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-6"></div>
            <ShoppingCart className="w-6 h-6 text-emerald-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-lg font-medium text-gray-700">Loading shared cart...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  if (error || !cart) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <ShoppingCart className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Cart Not Found</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {error || 'The requested cart could not be loaded. The link may be invalid or expired.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-semibold transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {generatingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </>
                )}
              </button>
              
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg font-medium"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print
              </button>
              
              <button
                onClick={handleShare}
                className="inline-flex items-center px-4 py-2.5 bg-white text-gray-700 rounded-lg border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm font-medium"
              >
                <Share2 className="w-4 h-4 mr-2" />
                {isCopied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Cart Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8 border border-gray-100">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium mb-3">
                      <Package className="w-4 h-4 mr-2" />
                      Shared Cart
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{cart.name}</h1>
                    <div className="flex flex-wrap items-center gap-4 text-emerald-50">
                      <div className="flex items-center">
                        <Building className="w-5 h-5 mr-2" />
                        <span className="font-medium">{cart.businessName}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        <span>{new Date().toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl p-6 text-center min-w-[160px]">
                    <p className="text-emerald-50 text-sm font-medium mb-1">Total Items</p>
                    <p className="text-4xl font-bold">{totalItems}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Products</p>
                    <p className="text-2xl font-bold text-gray-900">{cart.items.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <ShoppingCart className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Quantity</p>
                    <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Package className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4 shadow-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-50 mb-1 font-medium">Total Cost</p>
                    <p className="text-2xl font-bold text-white">KSh {formatCurrency(cart.totalCost)}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <ShoppingCart className="w-6 h-6 mr-3 text-emerald-600" />
                Cart Items
              </h2>
              
              {cart.items.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No items in this cart</p>
                  <p className="text-gray-400 text-sm mt-2">This cart is currently empty</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center p-4 border-2 border-gray-100 rounded-2xl hover:border-emerald-200 hover:shadow-md transition-all bg-gradient-to-r from-white to-gray-50 print:border-gray-300 print:shadow-none"
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full font-bold mr-4 flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      {item.image && (
                        <div className="relative h-20 w-20 mr-4 flex-shrink-0 rounded-xl overflow-hidden border-2 border-gray-200 print:hidden shadow-sm">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80/f3f4f6/9ca3af?text=No+Image';}}
                          />
                        </div>
                      )}
                      
                      <div className="flex-grow min-w-0 mr-4">
                        <h3 className="font-semibold text-gray-900 text-lg mb-1">{item.name}</h3>
                        {item.category && (
                          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium mr-2">
                            {item.category}
                          </span>
                        )}
                        <p className="text-lg font-bold text-emerald-600 mt-1">KSh {formatCurrency(item.price)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 print:hidden">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 hover:border-emerald-500 transition-all"
                            disabled={item.quantity <= 0}
                          >
                            <Minus className="w-5 h-5 text-gray-600" />
                          </button>
                          
                          <div className="w-16 text-center">
                            <span className="text-2xl font-bold text-gray-900">{item.quantity}</span>
                          </div>
                          
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="w-10 h-10 rounded-xl border-2 border-gray-300 flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-500 transition-all"
                          >
                            <Plus className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>

                        <div className="hidden print:flex items-center space-x-2">
                          <span className="font-medium text-gray-700">Qty: {item.quantity}</span>
                        </div>
                        
                        <div className="text-right min-w-[120px] bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                          <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                          <p className="text-xl font-bold text-gray-900">
                            KSh {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total Section */}
            {cart.items.length > 0 && (
              <div className="border-t-2 border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 p-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Estimated Cost</p>
                    <p className="text-4xl font-bold text-emerald-700">
                      KSh {formatCurrency(cart.totalCost)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-md border border-emerald-200">
                    <ShoppingCart className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-gray-700">{formatItemCount(totalItems)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden mb-8">
            <button
              onClick={handleDownloadPDF}
              disabled={generatingPdf}
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-3" />
                  Download as PDF
                </>
              )}
            </button>
            
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-gray-700 rounded-xl border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 transition-all shadow-md font-semibold text-lg"
            >
              <Share2 className="w-5 h-5 mr-3" />
              {isCopied ? 'Link Copied!' : 'Share This Cart'}
            </button>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 text-center print:hidden">
            <div className="flex items-center justify-center mb-3">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">This is a Shared Cart</h3>
            </div>
            <p className="text-gray-600 max-w-2xl mx-auto">
              You're viewing a read-only version of this cart. Quantity adjustments are temporary and won't be saved. 
              Create your own list to save and manage your requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
        }
      `}</style>
    </div>
  );
}