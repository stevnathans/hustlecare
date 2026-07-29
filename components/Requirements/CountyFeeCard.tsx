"use client";
// components/Requirements/CountyFeeCard.tsx

import React, { useState } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiFileText,
  FiMapPin,
  FiClock,
  FiInfo,
  FiShoppingBag,
} from "react-icons/fi";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import LoginModal from "@/components/LoginModal";
import { FeeScheduleResolution, countyGovernmentName } from "@/lib/legalFeeSchedule";
import { getBuyActionLabel } from "@/lib/buyAction";
import ApplyForMeButton from "@/components/shared/ApplyForMeButton";

type DurationUnit = "days" | "months" | "years";

interface ShellProductDetails {
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
}

interface CountyFeeCardProps {
  shellProductId?: number;
  shellProduct?: ShellProductDetails;
  countyId: number;
  countyName: string;
  requirementName: string;
  requirementDescription?: string;
  category: string;
  resolution: FeeScheduleResolution;
  businessId?: number;
}

function formatDuration(value?: number | null, unit?: DurationUnit | null): string | null {
  if (value === undefined || value === null || !unit) return null;
  const label = value === 1 ? unit.slice(0, -1) : unit;
  return `${value} ${label}`;
}

function formatProcessingTime(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max) return `${min}–${max} Days`;
  const val = min ?? max;
  return `${val} Day${val === 1 ? "" : "s"}`;
}

function buildApplyHref(
  productId: number,
  businessId?: number,
  requirementName?: string,
  category?: string,
  countyId?: number
) {
  const params = new URLSearchParams();
  if (businessId) params.set("businessId", String(businessId));
  if (requirementName) params.set("requirementName", requirementName);
  if (category) params.set("category", category);
  if (countyId) params.set("countyId", String(countyId));
  const query = params.toString();
  return `/redirect/${productId}${query ? `?${query}` : ""}`;
}

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

function DetailBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{label}</h4>
      <div className="text-gray-700 text-xs sm:text-sm">{children}</div>
    </div>
  );
}

const CountyFeeCard: React.FC<CountyFeeCardProps> = ({
  shellProductId,
  shellProduct,
  countyId,
  countyName,
  requirementName,
  requirementDescription,
  category,
  resolution,
  businessId,
}) => {
  const { addToCart, items, removeFromCart } = useCart();
  const [showDetails, setShowDetails] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const { data: session } = useSession();

  const cartItem = shellProductId != null
    ? items.find((item) => item.productId === shellProductId)
    : undefined;
  const isInCart = !!cartItem;

  const isExact = resolution.status === "exact";
  const isRange = resolution.status === "range";
  const price = isExact ? resolution.price : isRange ? resolution.lowPrice : 0;
  const matchedRow = isExact ? resolution.matchedRow : null;

  const validityLabel = matchedRow
    ? formatDuration(matchedRow.validityValue, matchedRow.validityUnit as DurationUnit | null)
    : null;
  const processingTimeLabel = matchedRow
    ? formatProcessingTime(matchedRow.processingTimeMinDays, matchedRow.processingTimeMaxDays)
    : null;

  const issuer = countyGovernmentName(countyName);
  const displayName = shellProduct?.name || requirementName;
  const description = matchedRow?.notes || shellProduct?.description || requirementDescription;
  const buyLabel = getBuyActionLabel(category);
  const applyHref = shellProductId && shellProduct?.url
    ? buildApplyHref(shellProductId, businessId, requirementName, category, countyId)
    : null;

  const handleAddToCart = async () => {
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (!isExact || !shellProductId) return;
    setAddError(null);
    try {
      await addToCart({
        productId: shellProductId,
        name: `${requirementName} (${countyName})`,
        price,
        requirementName,
        category,
        countyId,
        __index: 0,
      });
    } catch (error) {
      console.error("Error adding county fee to cart:", error);
      setAddError("Couldn't add this to your list. Please try again.");
    }
  };

  const handleRemoveFromCart = async () => {
    if (!shellProductId) return;
    try {
      await removeFromCart(shellProductId);
    } catch (error) {
      console.error("Error removing county fee from cart:", error);
    }
  };

  const toggleDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDetails(!showDetails);
  };

  return (
    <>
      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={() => {}} />
      )}

      <div className="border rounded-xl overflow-hidden bg-white transition-all duration-200">
        <div className="p-3">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-50 to-gray-100 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-gray-300">
              {shellProduct?.image ? (
                <Image
                  src={shellProduct.image}
                  alt={displayName}
                  fill
                  className="object-cover p-2"
                />
              ) : (
                <FiFileText size={24} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">
                {displayName}
              </h3>
              <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <FiMapPin size={10} /> {issuer}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {isExact ? (
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    KSh {price.toLocaleString()}
                  </span>
                ) : (
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    KSh {resolution.status === "range" ? resolution.lowPrice.toLocaleString() : "—"}
                    {resolution.status === "range" && ` – ${resolution.highPrice.toLocaleString()}`}
                  </span>
                )}
                {isRange && <Badge tone="amber">Varies by type/size</Badge>}
              </div>
            </div>

            <button
              onClick={isInCart ? handleRemoveFromCart : handleAddToCart}
              disabled={!isExact || !shellProductId}
              title={
                !shellProductId
                  ? "Setting up — please refresh in a moment"
                  : !isExact
                  ? "Use the Permit Cost Calculator with your business type & size for an exact price"
                  : undefined
              }
              className={`flex-shrink-0 flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:gap-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                !isExact || !shellProductId
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isInCart
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

          {(validityLabel || processingTimeLabel) && (
            <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
              {validityLabel && <Badge tone="gray">Validity: {validityLabel}</Badge>}
              {processingTimeLabel && <Badge tone="gray"><FiClock size={10} /> {processingTimeLabel}</Badge>}
            </div>
          )}

          {isInCart && (
            <div className="flex items-center gap-1.5 text-xs text-green-600 mb-3">
              <FiCheck size={12} />
              <span className="font-medium">In your list</span>
            </div>
          )}

          {addError && (
            <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600">
              {addError}
            </div>
          )}

          {!showDetails && description && (
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
          )}

          {isRange && (
            <div className="flex items-start gap-2 mb-3 p-2.5 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
              <FiInfo size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                Price depends on business type/size in {countyName}. Use the{" "}
                <a href="/tools/permit-costs" className="underline font-medium">
                  Permit Cost Calculator
                </a>{" "}
                for an exact figure.
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {applyHref && (
              <Link
                href={applyHref}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition font-medium"
              >
                <FiShoppingBag size={14} />
                <span>{buyLabel}</span>
              </Link>
            )}

            <ApplyForMeButton
              requirementName={requirementName}
              countyName={countyName}
              businessId={businessId}
            />

            <button
              onClick={toggleDetails}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition font-medium ml-auto"
            >
              <span>{showDetails ? "Less" : "Details"}</span>
              {showDetails ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="px-3 pb-3 pt-2 border-t bg-gray-50">
            <div className="space-y-3 text-sm">
              {description && (
                <DetailBlock label="Description">
                  <p className="leading-relaxed">{description}</p>
                </DetailBlock>
              )}

              <div className="grid grid-cols-2 gap-3">
                <DetailBlock label="Category">{category}</DetailBlock>
                <DetailBlock label="Requirement">{requirementName}</DetailBlock>
              </div>

              {(validityLabel || processingTimeLabel) && (
                <DetailBlock label="Legal Details">
                  <div className="space-y-1">
                    {validityLabel && <p>Validity: {validityLabel}</p>}
                    {processingTimeLabel && <p>Processing Time: {processingTimeLabel}</p>}
                  </div>
                </DetailBlock>
              )}

              <DetailBlock label="Issuing Authority">
                <p className="flex items-center gap-1">
                  <FiMapPin size={11} className="text-gray-400" /> {issuer}
                </p>
              </DetailBlock>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CountyFeeCard;