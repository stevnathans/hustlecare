"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Eye,
  User,
  Package,
  DollarSign,
  CheckCircle,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import LoginModal from "@/components/LoginModal";

interface BusinessItem {
  id: string;
  name: string;
  image?: string;
  requirementName: string;
  quantity: number;
  price: number;
}

interface SharedBusinessDetails {
  id: string;
  name: string;
  description?: string;
  business: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    image?: string;
  };
  author: {
    name: string;
    avatar?: string;
    verified: boolean;
  };
  stats: {
    viewCount: number;
    copyCount: number;
    totalItems: number;
    totalCost: number;
  };
  sharedAt: string;
  categories: string[];
  itemsByCategory: Record<string, BusinessItem[]>;
}

type CopyState = "idle" | "copying" | "already_copied" | "own_list" | "error";

interface Props {
  sharedBusinessId: string;
}

export default function SharedBusinessPreviewClient({ sharedBusinessId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [business, setBusiness] = useState<SharedBusinessDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    fetchBusinessDetails();
  }, [sharedBusinessId]);

  const fetchBusinessDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/${sharedBusinessId}`);
      if (!response.ok) throw new Error("Failed to load business details");
      const data = await response.json();
      setBusiness(data);
    } catch (error) {
      console.error("Error fetching business:", error);
      setError("Failed to load business details");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (copyState !== "idle") return;
    setCopyState("copying");

    try {
      const response = await fetch(`/api/community/${sharedBusinessId}/copy`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "UNAUTHENTICATED") {
          setCopyState("idle");
          setShowLoginModal(true);
          return;
        }
        if (data.code === "ALREADY_COPIED") {
          setCopyState("already_copied");
          return;
        }
        if (data.code === "OWN_LIST") {
          setCopyState("own_list");
          return;
        }
        throw new Error(data.error || "Failed to copy business");
      }

      router.push(`/businesses/${data.newBusinessSlug}/requirements`);
    } catch (error) {
      console.error("Error copying business:", error);
      setCopyState("error");
    }
  };

  const copyButtonContent = () => {
    switch (copyState) {
      case "copying":
        return (
          <span className="flex items-center">
            <div className="animate-spin mr-2 h-5 w-5 border-2 border-white border-t-transparent rounded-full" aria-hidden="true" />
            Copying...
          </span>
        );
      case "already_copied":
        return (
          <span className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
            Already in your list
          </span>
        );
      case "own_list":
        return (
          <span className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
            This is your list
          </span>
        );
      case "error":
        return (
          <span className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
            Failed — try again
          </span>
        );
      default:
        return (
          <span className="flex items-center">
            <Copy className="w-5 h-5 mr-2" aria-hidden="true" />
            Copy to My List
          </span>
        );
    }
  };

  const copyButtonClass = () => {
    const base = "px-8 py-4 rounded-xl font-semibold text-lg transition-colors";
    switch (copyState) {
      case "already_copied":
      case "own_list":
        return `${base} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-default`;
      case "error":
        return `${base} bg-red-600 text-white hover:bg-red-700 cursor-pointer`;
      case "copying":
        return `${base} bg-emerald-400 text-white cursor-wait`;
      default:
        return `${base} bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading template">
            <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded w-1/3" />
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded" />
            <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-900 dark:text-red-400 mb-2">
              Business Not Found
            </h1>
            <p className="text-red-700 dark:text-red-500 mb-6">
              {error || "This shared business could not be found or is no longer available."}
            </p>
            <button
              onClick={() => router.push("/community")}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: business.name,
    description: business.description,
    author: { "@type": "Person", name: business.author.name },
    datePublished: business.sharedAt,
    publisher: { "@type": "Organization", name: "Hustlecare", url: "https://hustlecare.net" },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to copy this list"
        message="Create a free account or sign in to copy this requirement list to your own business and start customising it."
      />

      <div className="max-w-6xl mx-auto px-4">
        <button
          onClick={() => router.push("/community")}
          className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
          aria-label="Back to Community"
        >
          <ArrowLeft className="w-5 h-5 mr-2" aria-hidden="true" />
          Back to Community
        </button>

        {/* Header */}
        <article className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-8 border-b border-gray-100 dark:border-gray-700">
            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold uppercase tracking-wide mb-1">
              {business.business.name}
            </p>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {business.name}
            </h1>
            {business.description && (
              <p className="text-gray-500 dark:text-gray-400 text-lg">{business.description}</p>
            )}
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
              <div className="flex items-center">
                <div className="relative">
                  {business.author.avatar ? (
                    <Image
                      src={business.author.avatar}
                      alt={`${business.author.name}'s avatar`}
                      width={56}
                      height={56}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <User className="w-7 h-7 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                    </div>
                  )}
                  {business.author.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
                      <CheckCircle
                        className="w-5 h-5 text-emerald-600 fill-current"
                        aria-label="Verified author"
                      />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Shared by</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {business.author.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center mt-1">
                    <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                    <time dateTime={business.sharedAt}>
                      {formatDistanceToNow(new Date(business.sharedAt), { addSuffix: true })}
                    </time>
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={handleCopy}
                  disabled={
                    copyState === "copying" ||
                    copyState === "already_copied" ||
                    copyState === "own_list"
                  }
                  className={copyButtonClass()}
                  aria-label={`Copy ${business.name} to my list`}
                >
                  {copyButtonContent()}
                </button>

                {(copyState === "already_copied" || copyState === "own_list") && (
                  <Link
                    href={`/businesses/${business.business.slug}/requirements`}
                    className="flex items-center text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                    {copyState === "own_list" ? "Go to your list" : "View your requirements"}
                  </Link>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm mb-2">
                  <Eye className="w-4 h-4 mr-2" aria-hidden="true" />
                  Views
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.stats.viewCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm mb-2">
                  <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
                  Copies
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.stats.copyCount.toLocaleString()}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm mb-2">
                  <Package className="w-4 h-4 mr-2" aria-hidden="true" />
                  Items
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {business.stats.totalItems}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm mb-2">
                  <DollarSign className="w-4 h-4 mr-2" aria-hidden="true" />
                  Total Cost
                </div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  KSh {business.stats.totalCost.toLocaleString()}
                </p>
              </div>
            </div>

            {business.categories.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Categories Included
                </h2>
                <div className="flex flex-wrap gap-2">
                  {business.categories.map((category) => (
                    <span
                      key={category}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Items by category */}
        <div className="space-y-6">
          {business.categories.map((category) => (
            <section
              key={category}
              aria-labelledby={`category-${category}`}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h2 id={`category-${category}`} className="text-xl font-bold text-gray-900 dark:text-white">
                  {category}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {business.itemsByCategory[category].length} items
                </p>
              </div>

              <ul className="p-6 space-y-4" aria-label={`${category} items`}>
                {business.itemsByCategory[category].map((item: BusinessItem) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    {item.image && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-white">
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.requirementName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                      <p className="font-bold text-gray-900 dark:text-white">
                        KSh {(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        {/* Bottom CTA */}
        <section
          aria-label="Copy this template"
          className="mt-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ready to use this template?
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Copy this requirement list to your account and customise it for your business
          </p>
          <button
            onClick={handleCopy}
            disabled={
              copyState === "copying" ||
              copyState === "already_copied" ||
              copyState === "own_list"
            }
            className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label={`Copy ${business.name} to my list`}
          >
            {copyState === "already_copied"
              ? "Already in your list"
              : copyState === "own_list"
              ? "This is your list"
              : copyState === "copying"
              ? "Copying..."
              : "Copy to My List"}
          </button>

          {copyState === "already_copied" && (
            <p className="mt-3 text-gray-500 dark:text-gray-400 text-sm">
              You already have this list.{" "}
              <Link
                href={`/businesses/${business.business.slug}/requirements`}
                className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
              >
                View your requirements →
              </Link>
            </p>
          )}
        </section>
      </div>
    </div>
  );
}