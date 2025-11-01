"use client";

import React, { useState } from "react";
import {
  FiPlus,
  FiCheck,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiPackage,
} from "react-icons/fi";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import LoginModal from "../LoginModal";

interface ProductCardProps {
  product: {
    id: string | number;
    name: string;
    description?: string;
    price: number;
    image?: string;
    url?: string;
    vendor?: {
      id: number;
      name: string;
      website?: string;
      logo?: string;
    };
  };
  requirementName: string;
  category: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  requirementName,
  category,
}) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: session } = useSession();

  const cartItem = items.find((item) => item.productId === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        requirementName,
        category,
        __index: 0,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleRemoveFromCart = async () => {
    try {
      await removeFromCart(product.id);
    } catch (error) {
      console.error("Error removing from cart:", error);
    }
  };

  const handleGoToShop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.url) {
      window.open(product.url, "_blank");
    }
  };

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  const handleLogin = () => {
    // This will be handled by LoginModal component
  };

  return (
    <div className="border rounded-lg shadow-sm overflow-hidden bg-white hover:shadow-lg transition-all duration-200">
      <div className="flex flex-col sm:flex-row">
        {/* Compact Image Section */}
        <div className="relative w-full sm:w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover p-3"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <FiPackage size={32} />
            </div>
          )}
          {/* Vendor Badge on Image */}
          {product.vendor?.logo && (
            <div className="absolute bottom-1 right-1 bg-white rounded px-1.5 py-0.5 shadow-sm">
              <Image
                src={product.vendor.logo}
                alt={product.vendor.name}
                width={40}
                height={20}
                className="h-4 w-auto object-contain"
              />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          {/* Header Row */}
          <div className="flex justify-between items-start gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                {product.name}
              </h3>
              {product.vendor?.name && !product.vendor?.logo && (
                <p className="text-xs text-gray-500 mt-0.5">
                  by {product.vendor.name}
                </p>
              )}
            </div>

            {/* Price & Action */}
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold text-gray-900 whitespace-nowrap">
                KSh {product.price.toLocaleString()}
              </span>
              <button
                onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isInCart
                    ? "bg-green-500 text-white hover:bg-green-600 shadow-sm"
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                }`}
                aria-label={isInCart ? "Remove from cart" : "Add to cart"}
              >
                {isInCart ? (
                  <>
                    <FiCheck size={16} />
                    <span className="hidden sm:inline">Added</span>
                  </>
                ) : (
                  <>
                    <FiPlus size={16} />
                    <span className="hidden sm:inline">Add</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Info Row */}
          {!showDetails && product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {product.url && (
              <button
                onClick={handleGoToShop}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition font-medium"
              >
                <FiShoppingBag size={14} />
                <span>Visit Shop</span>
                <FiExternalLink size={12} />
              </button>
            )}

            <button
              onClick={toggleDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition font-medium ml-auto"
            >
              <span>{showDetails ? "Less" : "More"}</span>
              {showDetails ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>
          </div>

          {/* Cart Status */}
          {isInCart && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
              <FiCheck size={14} />
              <span className="font-medium">{cartQuantity} in your list</span>
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      {showDetails && (
        <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-2 border-t bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {product.description && (
              <div className="sm:col-span-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Description
                </h4>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Category
              </h4>
              <p className="text-gray-700">{category}</p>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                Requirement
              </h4>
              <p className="text-gray-700">{requirementName}</p>
            </div>

            {product.vendor?.name && (
              <div className="sm:col-span-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  Vendor
                </h4>
                <div className="flex items-center gap-2">
                  <p className="text-gray-700">{product.vendor.name}</p>
                  {product.vendor.website && (
                    <a
                      href={product.vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      <FiExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default ProductCard;