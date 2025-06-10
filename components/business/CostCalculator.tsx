"use client";
import { useEffect, useMemo, useState } from "react";
import { FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiDownload } from "react-icons/fi";
import { useCart } from "@/contexts/CartContext";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

export default function CostCalculator({ businessName = "Business Requirements" }: { businessName?: string }) {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Reset cart open state when business changes
  useEffect(() => {
    setIsOpen(false);
  }, [businessName]);

  // Group items by category and calculate category counts
  const { groupedItems, categoryCounts } = useMemo(() => {
    const groups = cartItems.reduce((acc, item) => {
      const category = item.category || "Other Requirements";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, typeof cartItems>);

    const counts = Object.keys(groups).reduce((acc, category) => {
      acc[category] = groups[category].reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
      );
      return acc;
    }, {} as Record<string, number>);

    return { groupedItems: groups, categoryCounts: counts };
  }, [cartItems]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
      0
    );
  }, [cartItems]);

  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [cartItems]);

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  const generatePDF = () => {
    const input = document.getElementById("pdf-content");
    
    if (!input) return;
    
    // Create a clone of the element to modify styles for PDF generation
    const clone = input.cloneNode(true) as HTMLElement;
    
    // Apply PDF-friendly styles to the clone
    clone.style.backgroundColor = "#ffffff";
    clone.style.padding = "20px";
    clone.style.width = "100%";
    
    // Hide interactive elements in the PDF
    const buttons = clone.querySelectorAll("button");
    buttons.forEach(button => {
      button.style.display = "none";
    });
    
    // Add the clone to the DOM (temporarily)
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    document.body.appendChild(clone);
    
    html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${businessName}_Requirements.pdf`);
      
      // Remove the clone from the DOM
      document.body.removeChild(clone);
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const calculator = document.getElementById("cost-calculator");
      if (calculator && !calculator.contains(event.target as Node) && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Desktop version - always expanded
  if (!isMobile) {
    return (
      <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96" id="cost-calculator">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#3b82f6] text-white px-4 py-3 flex justify-between items-center">
            <h3 className="font-medium text-lg">{businessName} Requirements</h3>
            <div className="inline-flex items-center justify-center w-6 h-6 bg-white text-[#3b82f6] rounded-full text-xs font-bold">
              {totalItems}
            </div>
          </div>

          <div id="pdf-content" className="max-h-96 overflow-y-auto p-4 space-y-4 bg-white">
            {Object.keys(groupedItems).length > 0 ? (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">{category}</h4>
                    <span className="text-sm text-gray-500">
                      {categoryCounts[category]} {categoryCounts[category] === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 text-sm">
                          {item.name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          ${item.price} {item.unit ? `(${item.unit})` : ""}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                (item.quantity || 1) - 1
                              )
                            }
                            className="p-1 hover:bg-gray-100"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                (item.quantity || 1) + 1
                              )
                            }
                            className="p-1 hover:bg-gray-100"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiShoppingCart
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />
                <p>No Requirements Added For {businessName} Business.</p>
                <p className="text-sm mt-2">
                  Add products to calculate your startup costs.
                </p>
              </div>
            )}
          </div>

          {Object.keys(groupedItems).length > 0 && (
            <div className="border-t border-gray-200 p-4 bg-white">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-800">Estimated Cost:</span>
                <span className="font-bold text-lg text-[#3b82f6]">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
              <button
                onClick={generatePDF}
                className="w-full mt-2 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
              >
                <FiDownload size={16} />
                Download as PDF
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Mobile version - sticky bar with expandable panel
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50" id="cost-calculator">
      {/* Sticky bar header */}
      <div className="bg-[#3b82f6] text-white px-4 py-3 shadow-lg transition-all duration-300">
        {isOpen && (
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white font-semibold text-lg">{businessName}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="bg-white text-[#3b82f6] px-3 py-1 rounded-md font-medium text-sm"
            >
              Hide
            </button>
          </div>
        )}
  
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FiShoppingCart size={20} />
            <span>
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Estimated Cost:</span>
            <span className="font-bold text-lg">
              ${totalCost.toLocaleString()}
            </span>
          </div>
        </div>
  
        {!isOpen && (
          <div className="mt-3 flex justify-center">
            <button
              onClick={() => setIsOpen(true)}
              className="bg-white text-[#3b82f6] px-5 py-2 rounded-md font-medium text-sm w-3/4"
            >
              View List
            </button>
          </div>
        )}
      </div>
  
      {/* Expandable panel with animation */}
      <div
        className={`bg-white border-t border-gray-200 overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[60vh]" : "max-h-0"
        }`}
      >
        <div className="p-4">
          <div id="pdf-content" className="space-y-4 bg-white">
            {Object.keys(groupedItems).length > 0 ? (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-700">{category}</h4>
                    <span className="text-sm text-gray-500">
                      {categoryCounts[category]}{" "}
                      {categoryCounts[category] === 1 ? "item" : "items"}
                    </span>
                  </div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                    >
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-800 text-sm">
                          {item.name}
                        </h5>
                        <p className="text-sm text-gray-500">
                          ${item.price} {item.unit ? `(${item.unit})` : ""}
                        </p>
                      </div>
  
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-md">
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                (item.quantity || 1) - 1
                              )
                            }
                            className="p-1 hover:bg-gray-100"
                          >
                            <FiMinus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() =>
                              handleQuantityChange(
                                item.id,
                                (item.quantity || 1) + 1
                              )
                            }
                            className="p-1 hover:bg-gray-100"
                          >
                            <FiPlus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiShoppingCart
                  size={48}
                  className="mx-auto mb-4 text-gray-300"
                />
                <p>No Requirements Added For {businessName} Business.</p>
                <p className="text-sm mt-2">
                  Add products to calculate your startup costs.
                </p>
              </div>
            )}
          </div>

          {Object.keys(groupedItems).length > 0 && (
            <button
              onClick={generatePDF}
              className="w-full mt-4 bg-[#3b82f6] hover:bg-[#2563eb] text-white py-2 px-4 rounded-md flex items-center justify-center gap-2"
            >
              <FiDownload size={16} />
              Download as PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}