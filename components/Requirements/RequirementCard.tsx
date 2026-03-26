"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Product } from "@/types";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { FiPlus, FiCheck } from "react-icons/fi";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequirementCardProps {
  requirement: {
    category: string;
    id: number;
    templateId?: number;
    name: string;
    description?: string;
    necessity: string;
    image?: string;
  };
  products?: Product[];
  onProductAssigned?: () => void;
}

// ─── Add-Product-to-Requirement Modal ────────────────────────────────────────

interface AddProductModalProps {
  templateId: number;
  requirementName: string;
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

function AddProductToRequirementModal({
  templateId,
  requirementName,
  isOpen,
  onClose,
  onAssigned,
}: AddProductModalProps) {
  const [allProducts, setAllProducts] = useState<
    { id: number; name: string; price: number; image?: string; templateId?: number | null }[]
  >([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(false);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [assigned, setAssigned] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    setFetching(true);
    setError(null);
    setAssigned(new Set());
    setSearch("");
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setAllProducts(Array.isArray(data) ? data : []))
      .catch(() => setError("Failed to load products"))
      .finally(() => setFetching(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const filtered = allProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async (productId: number) => {
    setAssigning(productId);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/assign-requirement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to assign");
      }
      setAssigned((prev) => new Set([...prev, productId]));
      onAssigned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setAssigning(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      style={{ animation: "rc-fadeIn 0.18s ease" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: "85vh", animation: "rc-slideUp 0.2s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Add Product to Requirement
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Assigning to:{" "}
              <span className="font-semibold text-emerald-600">
                {requirementName}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <XMarkIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-50">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <svg
              className="w-3.5 h-3.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        {/* Product list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {fetching ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <svg
                className="w-10 h-10 mx-auto mb-2 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <p className="text-sm">No products found</p>
            </div>
          ) : (
            filtered.map((product) => {
              const isAlreadyAssigned =
                product.templateId === templateId || assigned.has(product.id);
              const isAssigning = assigning === product.id;

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    isAlreadyAssigned
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-gray-50 border-gray-100 hover:border-gray-200"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0 flex items-center justify-center">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                    )}
                  </div>

                  {/* Name + price */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      KSh {product.price?.toLocaleString() ?? "—"}
                    </p>
                  </div>

                  {/* Action */}
                  {isAlreadyAssigned ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                      <FiCheck size={12} />
                      Added
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAssign(product.id)}
                      disabled={isAssigning}
                      className="flex items-center gap-1 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {isAssigning ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          />
                        </svg>
                      ) : (
                        <FiPlus size={12} />
                      )}
                      Add
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Done
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rc-fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rc-slideUp { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

// ─── RequirementCard ──────────────────────────────────────────────────────────

export default function RequirementCard({
  requirement,
  products = [],
  onProductAssigned,
}: RequirementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const { addToCart, removeFromCart, items } = useCart();
  const { data: session } = useSession();

  const canAddProduct =
    (session?.user as { role?: string })?.role === "admin" ||
    (session?.user as { role?: string })?.role === "author";

  const productCount = products?.length || 0;
  const lowestPrice =
    productCount > 0 ? Math.min(...products.map((p) => p.price)) : 0;

  const productlessId = `req_${requirement.id}`;
  const isProductlessInCart = items.some(
    (item) => item.productId === productlessId && item.isProductless
  );

  const handleAddProductlessToCart = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (isProductlessInCart) {
      await removeFromCart(productlessId);
    } else {
      await addToCart({
        productId: productlessId,
        name: requirement.name,
        price: 0,
        requirementName: requirement.name,
        category: requirement.category,
        isProductless: true,
        __index: 0,
      });
    }
  };

  const getStatus = () =>
    requirement.necessity.toLowerCase().includes("required") ? "required" : "optional";

  const status = getStatus();

  const statusConfig = {
    required: {
      color: "text-emerald-700",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      icon: CheckCircleIcon,
      dotColor: "bg-green-500",
    },
    optional: {
      color: "text-amber-700",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      icon: ExclamationTriangleIcon,
      dotColor: "bg-amber-500",
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig];
  const StatusIcon = config.icon;

  return (
    <>
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={() => setShowLoginModal(false)}
        />
      )}

      {/* Add Product Modal */}
      {showAddProductModal && requirement.templateId && (
        <AddProductToRequirementModal
          templateId={requirement.templateId}
          requirementName={requirement.name}
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          onAssigned={() => onProductAssigned?.()}
        />
      )}

      {/* Image Lightbox */}
      {isImageOpen && requirement.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.2s ease-out" }}
          onClick={() => setIsImageOpen(false)}
        >
          <div
            className="relative max-w-lg w-full mx-4"
            style={{ animation: "scaleIn 0.25s ease-out" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsImageOpen(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-gray-100 transition-colors duration-200"
            >
              <XMarkIcon className="h-5 w-5 text-gray-700" />
            </button>
            <div className="rounded-2xl overflow-hidden shadow-2xl bg-white">
              <Image
                src={requirement.image}
                alt={requirement.name}
                width={600}
                height={400}
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
          </div>
        </div>
      )}

      <div className="group relative bg-white sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm hover:shadow-xl sm:hover:border-gray-200 transition-all duration-300 sm:mb-6 mb-4 overflow-hidden">
        {/* Gradient hover overlay — pointer-events-none so it never blocks clicks */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* ── Collapsed card body ────────────────────────────────────────── */}
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4">

            {/* Image + title */}
            <div className="flex items-start space-x-3 sm:space-x-4 mb-3 sm:mb-0">
              <div className="relative flex-shrink-0">
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-inner ${
                    requirement.image ? "cursor-pointer" : ""
                  }`}
                  onClick={() => requirement.image && setIsImageOpen(true)}
                >
                  {requirement.image ? (
                    <Image
                      src={requirement.image}
                      alt={requirement.name}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                {/* Status dot */}
                <div
                  className={`absolute -top-1 -right-1 w-6 h-6 rounded-full ${config.bgColor} ${config.borderColor} border-2 flex items-center justify-center`}
                >
                  <StatusIcon className={`h-3 w-3 ${config.color}`} />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200 mb-2 break-words whitespace-normal">
                  {requirement.name}
                </h3>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color} ${config.borderColor} border`}
                >
                  <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                  <span className="capitalize">{status}</span>
                </div>
              </div>
            </div>

            {/* Stats + action buttons */}
            <div className="w-full sm:flex-1 sm:min-w-0">
              {requirement.description && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  {requirement.description}
                </p>
              )}

              <div className="space-y-4">
                {/* Price + count + right-side buttons row */}
                <div className="flex flex-row items-center justify-between sm:justify-start sm:gap-6">

                  {/* Price */}
                  {productCount > 0 ? (
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-emerald-50">
                        <CurrencyDollarIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Starting from</div>
                        <div className="text-lg font-bold text-emerald-600">
                          KSh {lowestPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-400">
                      <div className="p-2 rounded-lg bg-gray-50">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-xs font-medium">No products</div>
                        <div className="text-sm">available</div>
                      </div>
                    </div>
                  )}

                  {/* Product count */}
                  {productCount > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Available</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {productCount} {productCount === 1 ? "option" : "options"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Desktop: right-side buttons (collapsed state) ──────── */}
                  <div className="hidden sm:flex items-center gap-2 ml-auto">
                    {productCount === 0 && canAddProduct && requirement.templateId && (
                      <button
                        onClick={() => setShowAddProductModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
                        title="Assign a product to this requirement"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        Add Product
                      </button>
                    )}

                    {productCount > 0 && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200 font-medium text-sm group/button"
                      >
                        <span>{isExpanded ? "Hide Products" : "View Products"}</span>
                        {isExpanded ? (
                          <ChevronUpIcon className="h-4 w-4 transition-transform group-hover/button:-translate-y-px" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4 transition-transform group-hover/button:translate-y-px" />
                        )}
                      </button>
                    )}

                    {productCount === 0 && (
                      <button
                        onClick={handleAddProductlessToCart}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                          isProductlessInCart
                            ? "bg-green-500 text-white hover:bg-green-600"
                            : "bg-emerald-500 text-white hover:bg-emerald-600"
                        }`}
                      >
                        {isProductlessInCart ? (
                          <><FiCheck size={16} /><span>Added</span></>
                        ) : (
                          <><FiPlus size={16} /><span>Add</span></>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Mobile: buttons (collapsed state) ─────────────────────── */}
                <div className="sm:hidden flex flex-col gap-2">
                  {productCount === 0 && canAddProduct && requirement.templateId && (
                    <button
                      onClick={() => setShowAddProductModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add Product to This Requirement
                    </button>
                  )}

                  {productCount > 0 && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-all duration-200 font-medium text-sm"
                    >
                      <span>{isExpanded ? "Hide Products" : "View Products"}</span>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}

                  {productCount === 0 && (
                    <button
                      onClick={handleAddProductlessToCart}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                        isProductlessInCart
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : "bg-emerald-500 text-white hover:bg-emerald-600"
                      }`}
                    >
                      {isProductlessInCart ? (
                        <><FiCheck size={16} /><span>Added to List</span></>
                      ) : (
                        <><FiPlus size={16} /><span>Add to List</span></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Expanded products section ───────────────────────────────────── */}
        {isExpanded && productCount > 0 && (
          <div className="border-t border-gray-100 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="p-2 sm:p-6">

              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                {/* Left side: icon + heading — capped so it can never overflow
                    into the Add Product button on the right */}
                <div className="flex items-center space-x-2 min-w-0 mr-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <ShoppingBagIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 truncate">
                    Recommended Products
                  </h4>
                </div>

                {/* Add Product button — flex-shrink-0 ensures it is never
                    compressed or overlapped by the heading on the left */}
                {canAddProduct && requirement.templateId && (
                  <button
                    onClick={() => setShowAddProductModal(true)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap"
                    title="Assign a product to this requirement"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add Product
                  </button>
                )}
              </div>

              <div className="grid gap-4">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="transform transition-all duration-300"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animation: "slideInUp 0.5s ease-out forwards",
                    }}
                  >
                    <ProductCard
                      product={product}
                      requirementName={requirement.name}
                      category={requirement.category}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </div>
    </>
  );
}