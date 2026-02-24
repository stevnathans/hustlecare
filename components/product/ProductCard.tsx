// This component represents a product card that can be used to display products related to business requirements. It includes functionality to add/remove products from the cart, view product details, and visit the vendor's shop. It also handles user authentication for adding items to the cart.
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FiPlus,
  FiCheck,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiPackage,
  FiX,
  FiZoomIn,
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

// ── Image Lightbox ────────────────────────────────────────────────────────────

function ImageLightbox({
  src,
  alt,
  onClose,
  originRect,
}: {
  src: string;
  alt: string;
  onClose: () => void;
  originRect: DOMRect | null;
}) {
  const [phase, setPhase] = useState<"enter" | "open" | "exit">("enter");
  const overlayRef = useRef<HTMLDivElement>(null);

  // Compute the "from" transform so the image animates out of the thumbnail
  const fromStyle = (): React.CSSProperties => {
    if (!originRect) return {};
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const scaleX = originRect.width / Math.min(vw * 0.9, 720);
    const scaleY = originRect.height / Math.min(vh * 0.8, 720);
    const scale = Math.max(scaleX, scaleY);
    const tx = originRect.left + originRect.width / 2 - vw / 2;
    const ty = originRect.top + originRect.height / 2 - vh / 2;
    return {
      transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
      opacity: 0,
      borderRadius: "12px",
    };
  };

  const openStyle = (): React.CSSProperties => ({
    transform: "translate(0, 0) scale(1)",
    opacity: 1,
    borderRadius: "16px",
  });

  useEffect(() => {
    // Tiny delay so browser paints the "from" frame first
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPhase("open"));
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Prevent body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  function handleClose() {
    setPhase("exit");
    setTimeout(onClose, 320);
  }

  const imgStyle: React.CSSProperties =
    phase === "enter"
      ? { ...fromStyle(), transition: "none" }
      : phase === "open"
      ? { ...openStyle(), transition: "transform 0.35s cubic-bezier(0.34,1.26,0.64,1), opacity 0.25s ease, border-radius 0.35s ease" }
      : { ...fromStyle(), transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease, border-radius 0.3s ease" };

  const overlayStyle: React.CSSProperties = {
    opacity: phase === "open" ? 1 : 0,
    transition: "opacity 0.28s ease",
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        backgroundColor: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        cursor: "zoom-out",
        ...overlayStyle,
      }}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "1rem",
          right: "1rem",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          opacity: phase === "open" ? 1 : 0,
          transform: phase === "open" ? "scale(1)" : "scale(0.7)",
          transition: "opacity 0.25s ease 0.1s, transform 0.3s cubic-bezier(0.34,1.4,0.64,1) 0.1s",
          zIndex: 1,
        }}
        aria-label="Close image"
      >
        <FiX size={18} />
      </button>

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          bottom: "1.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.75)",
          fontSize: "0.85rem",
          fontWeight: 500,
          textAlign: "center",
          maxWidth: "80vw",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          opacity: phase === "open" ? 1 : 0,
          transition: "opacity 0.25s ease 0.15s",
        }}
      >
        {alt}
      </div>

      {/* Expanded image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "min(90vw, 720px)",
          height: "min(80vh, 720px)",
          cursor: "default",
          boxShadow: phase === "open" ? "0 32px 80px rgba(0,0,0,0.6)" : "none",
          ...imgStyle,
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 720px) 90vw, 720px"
          className="object-contain"
          style={{ borderRadius: "inherit" }}
          priority
        />
      </div>
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  requirementName,
  category,
}) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [thumbRect, setThumbRect] = useState<DOMRect | null>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
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

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!product.image) return;
    if (thumbRef.current) {
      setThumbRect(thumbRef.current.getBoundingClientRect());
    }
    setLightboxOpen(true);
  };

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-white transition-all duration-200">
        <div className="p-3">
          {/* Top Row: Image, Name/Price, Add Button */}
          <div className="flex items-start gap-3 mb-3">

            {/* Image — clickable thumbnail */}
            <div
              ref={thumbRef}
              onClick={handleImageClick}
              style={{
                cursor: product.image ? "zoom-in" : "default",
                position: "relative",
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 rounded-lg overflow-hidden group"
              title={product.image ? "Click to expand" : undefined}
            >
              {product.image ? (
                <>
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover p-2 transition-transform duration-200 group-hover:scale-105"
                  />
                  {/* Zoom hint overlay */}
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ background: "rgba(0,0,0,0.28)" }}
                  >
                    <FiZoomIn size={18} color="#fff" />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <FiPackage size={24} />
                </div>
              )}

              {/* Vendor Badge on Image */}
              {product.vendor?.logo && (
                <div className="absolute bottom-1 right-1 bg-white rounded px-1 py-0.5 shadow-sm">
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

            {/* Name and Price Column */}
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

            {/* Add Button */}
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

          {/* Description - Full Width */}
          {!showDetails && product.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Bottom Row: Action Buttons */}
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
              {showDetails ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>
          </div>
        </div>

        {/* Expandable Details */}
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
                    <p className="text-gray-700 text-xs sm:text-sm">{product.vendor.name}</p>
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

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {}}
      />

      {/* Image Lightbox */}
      {lightboxOpen && product.image && (
        <ImageLightbox
          src={product.image}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
          originRect={thumbRect}
        />
      )}
    </>
  );
};

export default ProductCard;