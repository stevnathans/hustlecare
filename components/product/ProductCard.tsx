// This component represents a product card that can be used to display products related to business requirements. It includes functionality to add/remove products from the cart, view product details, and go to a redirect page before visiting the vendor. It also handles user authentication for adding items to the cart.
"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  FiPlus,
  FiCheck,
  FiExternalLink,
  FiChevronDown,
  FiChevronUp,
  FiShoppingBag,
  FiPackage,
  FiShield,
  FiTruck,
  FiClock,
  FiMapPin,
  FiFileText,
  FiTag,
} from "react-icons/fi";
import { XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import LoginModal from "../LoginModal";
import { getBuyActionLabel } from "@/lib/buyAction";

type DurationUnit = "days" | "months" | "years";

interface BulkPriceTier {
  minQty: number;
  price: number;
}

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

    // Condition
    condition?: "NEW" | "USED";
    usedDurationValue?: number | null;
    usedDurationUnit?: DurationUnit | null;
    hasReceipt?: "YES" | "NO" | "UNKNOWN" | null;

    // Specifications
    brand?: string | null;
    modelNumber?: string | null;
    voltage?: string | null;
    wattage?: string | null;
    dimensions?: string | null;
    weight?: number | null;
    weightUnit?: "kg" | "g" | "lb" | null;

    // Warranty
    warrantyType?: "NONE" | "MANUFACTURER" | "VENDOR";
    warrantyDurationValue?: number | null;
    warrantyDurationUnit?: DurationUnit | null;

    // Delivery / logistics
    deliveryAvailable?: boolean;
    pickupLocation?: string | null;
    leadTime?: string | null;

    // Commercial terms
    negotiable?: boolean;
    bulkPricing?: BulkPriceTier[];

    // Legal (Legal-category products) — county availability is derived
    // from the vendor, not stored here.
    validityValue?: number | null;
    validityUnit?: DurationUnit | null;
    processingTimeMinDays?: number | null;
    processingTimeMaxDays?: number | null;
  };
  requirementName: string;
  category: string;
  businessId?: number;
}

// ── Formatting helpers ────────────────────────────────────────────────────────
function formatDuration(value?: number | null, unit?: DurationUnit | null): string | null {
  if (value === undefined || value === null || !unit) return null;
  const label = value === 1 ? unit.slice(0, -1) : unit;
  return `${value} ${label}`;
}

function formatLeadTime(leadTime?: string | null): string | null {
  switch (leadTime) {
    case "IN_STOCK": return "In stock — ships immediately";
    case "1_3_DAYS": return "Ships in 1–3 days";
    case "1_WEEK": return "Ships in about 1 week";
    case "2_WEEKS_PLUS": return "Ships in 2+ weeks";
    default: return null;
  }
}

function formatWeight(value?: number | null, unit?: string | null): string | null {
  if (value === undefined || value === null || !unit) return null;
  return `${value}${unit}`;
}

function formatReceipt(hasReceipt?: "YES" | "NO" | "UNKNOWN" | null): string | null {
  switch (hasReceipt) {
    case "YES": return "Original receipt available";
    case "NO": return "No receipt available";
    case "UNKNOWN": return "Receipt availability not specified";
    default: return null;
  }
}

function formatProcessingTime(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} Days`;
  const val = min ?? max;
  return `${val} Day${val === 1 ? "" : "s"}`;
}

function buildRedirectHref(
  productId: string | number,
  businessId?: number,
  requirementName?: string,
  category?: string
) {
  const params = new URLSearchParams();
  if (businessId) params.set("businessId", String(businessId));
  if (requirementName) params.set("requirementName", requirementName);
  if (category) params.set("category", category);
  const query = params.toString();
  return `/redirect/${productId}${query ? `?${query}` : ""}`;
}

// ── Small badge used in the always-visible summary row ─────────────────────────
function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "emerald" | "amber" | "indigo" | "gray";
}) {
  const toneCls = {
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    indigo: "bg-indigo-50 text-indigo-600",
    gray: "bg-gray-100 text-gray-600",
  }[tone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ${toneCls}`}>
      {children}
    </span>
  );
}

// ── Detail panel row: label above, value below (matches existing style) ────────
function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</h4>
      <div className="text-gray-700 text-xs sm:text-sm">{children}</div>
    </div>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const portalRoot = useRef<HTMLElement | null>(null);

  useEffect(() => {
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

// ── Image Lightbox ─────────────────────────────────────────────────────────
function ImageLightbox({
  src,
  alt,
  onClose,
  redirectHref,
  buyLabel,
}: {
  src: string;
  alt: string;
  onClose: () => void;
  redirectHref: string;
  buyLabel: string;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

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

          <p className="text-center text-white/80 text-sm mt-3 font-medium drop-shadow">
            {alt}
          </p>

          <div className="text-center mt-3">
            <Link
              href={redirectHref}
              onClick={(e) => e.stopPropagation()}
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-6 rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {buyLabel}
            </Link>
          </div>
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
function PortaledLoginModal({
  isOpen,
  onClose,
  onLogin,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Portal>
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
  businessId,
}) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const { data: session } = useSession();

  const cartItem = items.find((item) => item.productId === product.id);
  const isInCart = !!cartItem;
  const cartQuantity = cartItem?.quantity || 0;

  const redirectHref = buildRedirectHref(product.id, businessId, requirementName, category);
  const buyLabel = getBuyActionLabel(category);

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

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  const isUsed = product.condition === "USED";
  const hasWarranty = !!product.warrantyType && product.warrantyType !== "NONE";
  const usedDuration = formatDuration(product.usedDurationValue, product.usedDurationUnit);
  const warrantyDuration = formatDuration(product.warrantyDurationValue, product.warrantyDurationUnit);
  const leadTimeLabel = formatLeadTime(product.leadTime);
  const weightLabel = formatWeight(product.weight, product.weightUnit);
  const hasSpecs = !!(product.brand || product.modelNumber || product.voltage || product.wattage || product.dimensions || weightLabel);
  const hasBulkPricing = Array.isArray(product.bulkPricing) && product.bulkPricing.length > 0;

  const isLegal = category === "Legal";
  const validityLabel = formatDuration(product.validityValue, product.validityUnit);
  const processingTimeLabel = formatProcessingTime(product.processingTimeMinDays, product.processingTimeMaxDays);
  const hasLegalDetails = isLegal && (validityLabel || processingTimeLabel);

  return (
    <>
      {isImageOpen && product.image && (
        <ImageLightbox
          src={product.image}
          alt={product.name}
          onClose={() => setIsImageOpen(false)}
          redirectHref={redirectHref}
          buyLabel={buyLabel}
        />
      )}

      <PortaledLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {}}
      />

      {/* ── Card ── */}
      <div className="border rounded-xl overflow-hidden bg-white transition-all duration-200">
        <div className="p-3">
          <div className="flex items-start gap-3 mb-3">
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

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                {product.name}
              </h3>
              {product.vendor?.name && (
                <p className="text-xs text-gray-500 mb-1">
                  by {product.vendor.name}
                </p>
              )}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base sm:text-lg font-bold text-gray-900">
                  KSh {product.price.toLocaleString()}
                </span>
                {product.negotiable && <Badge tone="indigo">Negotiable</Badge>}
              </div>
            </div>

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

          {(product.condition || hasWarranty || product.deliveryAvailable) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {product.condition && (
                <Badge tone={isUsed ? "amber" : "emerald"}>
                  {isUsed ? `Used${usedDuration ? ` · ${usedDuration}` : ""}` : "Brand New"}
                </Badge>
              )}
              {hasWarranty && (
                <Badge tone="gray">
                  <FiShield size={10} /> Warranty
                </Badge>
              )}
              {product.deliveryAvailable && (
                <Badge tone="gray">
                  <FiTruck size={10} /> Delivery
                </Badge>
              )}
            </div>
          )}

          {isInCart && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3">
              <FiCheck size={12} />
              <span className="font-medium">{cartQuantity} in your list</span>
            </div>
          )}

          {!showDetails && product.description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={redirectHref}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium"
            >
              <FiShoppingBag size={14} />
              <span>{buyLabel}</span>
            </Link>

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

        {showDetails && (
          <div className="px-3 pb-3 pt-2 border-t bg-gray-50">
            <div className="space-y-3 text-sm">
              {product.description && (
                <DetailBlock label="Description">
                  <p className="leading-relaxed">{product.description}</p>
                </DetailBlock>
              )}

              <div className="grid grid-cols-2 gap-3">
                <DetailBlock label="Category">{category}</DetailBlock>
                <DetailBlock label="Requirement">{requirementName}</DetailBlock>
              </div>

              {hasLegalDetails && (
                <DetailBlock label="Legal Details">
                  <div className="space-y-1">
                    {validityLabel && <p>Validity: {validityLabel}</p>}
                    {processingTimeLabel && <p>Processing Time: {processingTimeLabel}</p>}
                  </div>
                </DetailBlock>
              )}

              {product.condition && (
                <DetailBlock label="Condition">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={isUsed ? "amber" : "emerald"}>
                      {isUsed ? "Used" : "Brand New"}
                    </Badge>
                    {isUsed && usedDuration && <span className="text-gray-600">Used for {usedDuration}</span>}
                  </div>
                  {isUsed && product.hasReceipt && (
                    <p className="mt-1 flex items-center gap-1 text-gray-600">
                      <FiFileText size={11} /> {formatReceipt(product.hasReceipt)}
                    </p>
                  )}
                </DetailBlock>
              )}

              {hasSpecs && (
                <DetailBlock label="Specifications">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {product.brand && <span>Brand: {product.brand}</span>}
                    {product.modelNumber && <span>Model: {product.modelNumber}</span>}
                    {(product.voltage || product.wattage) && (
                      <span>Power: {[product.voltage, product.wattage].filter(Boolean).join(", ")}</span>
                    )}
                    {product.dimensions && <span>Dimensions: {product.dimensions}</span>}
                    {weightLabel && <span>Weight: {weightLabel}</span>}
                  </div>
                </DetailBlock>
              )}

              {hasWarranty && (
                <DetailBlock label="Warranty">
                  <p className="flex items-center gap-1">
                    <FiShield size={11} className="text-gray-400" />
                    {product.warrantyType === "MANUFACTURER" ? "Manufacturer warranty" : "Vendor-provided warranty"}
                    {warrantyDuration && ` · ${warrantyDuration}`}
                  </p>
                </DetailBlock>
              )}

              {(product.deliveryAvailable || product.pickupLocation || leadTimeLabel) && (
                <DetailBlock label="Delivery & Logistics">
                  <div className="space-y-1">
                    {product.deliveryAvailable && (
                      <p className="flex items-center gap-1"><FiTruck size={11} className="text-gray-400" /> Delivery available</p>
                    )}
                    {product.pickupLocation && (
                      <p className="flex items-center gap-1"><FiMapPin size={11} className="text-gray-400" /> Pickup: {product.pickupLocation}</p>
                    )}
                    {leadTimeLabel && (
                      <p className="flex items-center gap-1"><FiClock size={11} className="text-gray-400" /> {leadTimeLabel}</p>
                    )}
                  </div>
                </DetailBlock>
              )}

              {hasBulkPricing && (
                <DetailBlock label="Bulk Pricing">
                  <div className="flex items-center gap-1 mb-1 text-gray-500">
                    <FiTag size={11} /> <span>Buy more, pay less</span>
                  </div>
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    {product.bulkPricing!
                      .slice()
                      .sort((a, b) => a.minQty - b.minQty)
                      .map((tier, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-between px-2.5 py-1.5 text-xs sm:text-sm ${i % 2 ? "bg-white" : "bg-gray-50"}`}
                        >
                          <span className="text-gray-600">{tier.minQty}+ units</span>
                          <span className="font-semibold text-gray-900">KSh {tier.price.toLocaleString()} / unit</span>
                        </div>
                      ))}
                  </div>
                </DetailBlock>
              )}

              {product.vendor?.name && (
                <DetailBlock label="Vendor">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm">{product.vendor.name}</p>
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
                </DetailBlock>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProductCard;