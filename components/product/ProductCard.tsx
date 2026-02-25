// This component represents a product card that can be used to display products related to business requirements. It includes functionality to add/remove products from the cart, view product details, and visit the vendor's shop. It also handles user authentication for adding items to the cart.
"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiPlus,
  FiCheck,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiPackage,
} from "react-icons/fi";
import { XMarkIcon } from "@heroicons/react/24/outline";
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

// ── Portal wrapper ────────────────────────────────────────────────────────────
// Renders children directly into document.body so no parent stacking context,
// overflow:hidden, or z-index can clip or suppress them.
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const portalRoot = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Reuse a single shared portal root so multiple cards don't litter the DOM
    let el = document.getElementById("product-card-portal-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "product-card-portal-root";
      document.body.appendChild(el);
    }
    portalRoot.current = el;
    setMounted(true);
  }, []);

  if (!mounted || !portalRoot.current) return null;
  return createPortal(children, portalRoot.current);
}

// ── Image Lightbox ────────────────────────────────────────────────────────────
function ImageLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <Portal>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        style={{ zIndex: 9999, animation: "pc-fadeIn 0.2s ease-out" }}
        onClick={onClose}
      >
        <div
          className="relative max-w-lg w-full mx-4"
          style={{ animation: "pc-scaleIn 0.25s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5 text-gray-700" />
          </button>

          <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
            <Image
              src={src}
              alt={alt}
              width={600}
              height={400}
              className="w-full h-auto object-contain max-h-[70vh]"
            />
          </div>

          {/* Caption */}
          <p className="text-center text-white/80 text-sm mt-3 font-medium drop-shadow">
            {alt}
          </p>
        </div>

        <style>{`
          @keyframes pc-fadeIn  { from { opacity: 0; }                          to { opacity: 1; } }
          @keyframes pc-scaleIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    </Portal>
  );
}

// ── Login Modal Portal wrapper ────────────────────────────────────────────────
// Wraps the existing LoginModal in a Portal so it also escapes any stacking context.
function PortaledLoginModal({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}) {
  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Wrapper that ensures the modal sits above everything */}
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
        <div style={{ pointerEvents: "auto" }}>
          <LoginModal isOpen={isOpen} onClose={onClose} onLogin={onLogin} />
        </div>
      </div>
    </Portal>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const ProductCard: React.FC<ProductCardProps> = ({
  product,
  requirementName,
  category,
}) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
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
    if (product.url) window.open(product.url, "_blank");
  };

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <>
      {/* Lightbox — portaled to body, always above everything */}
      {isImageOpen && product.image && (
        <ImageLightbox
          src={product.image}
          alt={product.name}
          onClose={() => setIsImageOpen(false)}
        />
      )}

      {/* Login modal — portaled to body, always above everything */}
      <PortaledLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {}}
      />

      {/* ── Card ── */}
      <div className="border rounded-xl overflow-hidden bg-white transition-all duration-200">
        <div className="p-3">
          {/* Top Row: Image, Name/Price, Add Button */}
          <div className="flex items-start gap-3 mb-3">

            {/* Product Image — clickable to open lightbox */}
            <div
              className={`group/img relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 rounded-lg overflow-hidden ${
                product.image ? "cursor-pointer" : ""
              }`}
              onClick={() => product.image && setIsImageOpen(true)}
              title={product.image ? "Click to expand" : undefined}
            >
              {product.image ? (
                <>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover p-2 transition-transform duration-300 group-hover/img:scale-110"
                  />
                  {/* Hover overlay with expand icon */}
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white opacity-0 group-hover/img:opacity-100 drop-shadow-md transition-opacity duration-200"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
                      />
                    </svg>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <FiPackage size={24} />
                </div>
              )}

              {/* Vendor logo badge */}
              {product.vendor?.logo && (
                <div className="absolute bottom-1 right-1 bg-white rounded px-1 py-0.5 shadow-sm z-10">
                  <Image
                    src={product.vendor.logo}
                    alt={product.vendor.name}
                    width={32}
                    height={16}
                    className="h-3 w-auto object-contain"
                  />
                </div>
              )}
            </div>

            {/* Name and Price */}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                {product.name}
              </h3>
              {product.vendor?.name && !product.vendor?.logo && (
                <p className="text-xs text-gray-500 mb-1">
                  by {product.vendor.name}
                </p>
              )}
              <span className="text-base sm:text-lg font-bold text-gray-900">
                ${product.price.toLocaleString()}
              </span>
            </div>

            {/* Add / Remove Button */}
            <button
              onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
              className={`flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                isInCart
                  ? "bg-green-500 text-white hover:bg-green-600"
                  : "bg-emerald-500 text-white hover:bg-emerald-600"
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

          {/* Cart Status */}
          {isInCart && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3">
              <FiCheck size={12} />
              <span className="font-medium">{cartQuantity} in your list</span>
            </div>
          )}

          {/* Description preview (collapsed state) */}
          {!showDetails && product.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            {product.url && (
              <button
                onClick={handleGoToShop}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition font-medium"
              >
                <FiShoppingBag size={14} />
                <span>Visit Shop</span>
                <FiExternalLink size={12} />
              </button>
            )}

            <button
              onClick={toggleDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition font-medium ml-auto"
            >
              <span>{showDetails ? "Less" : "Details"}</span>
              {showDetails ? (
                <FiChevronUp size={14} />
              ) : (
                <FiChevronDown size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Details Panel */}
        {showDetails && (
          <div className="px-3 pb-3 pt-2 border-t bg-gray-50">
            <div className="space-y-3 text-sm">
              {product.description && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Description
                  </h4>
                  <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
                    {product.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Category
                  </h4>
                  <p className="text-gray-700 text-xs sm:text-sm">{category}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Requirement
                  </h4>
                  <p className="text-gray-700 text-xs sm:text-sm">{requirementName}</p>
                </div>
              </div>

              {product.vendor?.name && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                    Vendor
                  </h4>
                  <div className="flex items-center gap-2">
                    <p className="text-gray-700 text-xs sm:text-sm">
                      {product.vendor.name}
                    </p>
                    {product.vendor.website && (
                      <a
                        href={product.vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <FiExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCard;