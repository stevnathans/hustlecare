// components/Dashboard/MyListsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Globe, 
  Lock,
  Eye,
  Copy,
  Check,
  X,
  AlertTriangle,
  History
} from "lucide-react";
import Link from "next/link";

interface SavedBusiness {
  id: string;
  name: string;
  totalCost: number;
  itemsCount: number;
  lastUpdated: string;
  slug: string;
  isShared: boolean;
  viewCount?: number;
  copyCount?: number;
  copiedFrom?: {
    authorName: string;
    copiedAt: string;
  } | null;
}

// Add interface for the API response structure
interface ApiBusinessList {
  businessId: string;
  businessName: string;
  totalCost: number;
  totalItems: number;
  updatedAt: string;
  businessSlug: string;
  isShared: boolean;
  viewCount?: number;
  copyCount?: number;
  copiedFrom?: {
    authorName: string;
    copiedAt: string;
  } | null;
}

interface ApiResponse {
  lists: ApiBusinessList[];
}

export default function MyListsTab() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<SavedBusiness[]>([]);
  const [sharingStates, setSharingStates] = useState<Record<string, boolean>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [businessToRemove, setBusinessToRemove] = useState<SavedBusiness | null>(null);
  const [totalStats, setTotalStats] = useState({
    totalBusinesses: 0,
    totalItems: 0,
    totalCost: 0,
  });

  useEffect(() => {
    const fetchSavedBusinesses = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/profile/lists");
        if (!response.ok) {
          throw new Error("Failed to load saved businesses");
        }

        const data: ApiResponse = await response.json();
        const mappedBusinesses: SavedBusiness[] = data.lists.map((list: ApiBusinessList) => ({
          id: list.businessId,
          name: list.businessName,
          totalCost: list.totalCost,
          itemsCount: list.totalItems,
          lastUpdated: list.updatedAt,
          slug: list.businessSlug,
          isShared: list.isShared || false,
          viewCount: list.viewCount || 0,
          copyCount: list.copyCount || 0,
          copiedFrom: list.copiedFrom || null,
        }));

        // Any list with zero items is stale (e.g. all items were removed
        // from the requirements page) and should be auto-removed from the
        // profile rather than shown as an empty card.
        const emptyBusinesses = mappedBusinesses.filter((b) => b.itemsCount === 0);
        const nonEmptyBusinesses = mappedBusinesses.filter((b) => b.itemsCount > 0);

        if (emptyBusinesses.length > 0) {
          // Fire-and-forget cleanup; don't block rendering on this, and
          // don't show a confirmation prompt since this isn't a user-initiated action.
          Promise.all(
            emptyBusinesses.map((b) =>
              fetch(`/api/profile/lists/${b.id}`, {
                method: "DELETE",
              }).catch((err) => console.error("Error auto-removing empty list:", err))
            )
          );
        }

        setBusinesses(nonEmptyBusinesses);

        // Calculate total stats
        const totalCost = nonEmptyBusinesses.reduce((sum, business) => sum + business.totalCost, 0);
        const totalItems = nonEmptyBusinesses.reduce((sum, business) => sum + business.itemsCount, 0);
        
        setTotalStats({
          totalBusinesses: nonEmptyBusinesses.length,
          totalItems,
          totalCost,
        });
      } catch (error) {
        setError(error instanceof Error ? error.message : "An unknown error occurred");
        console.error("Error loading saved businesses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedBusinesses();
  }, []);

  const toggleShare = async (businessId: string, currentState: boolean) => {
    setSharingStates(prev => ({ ...prev, [businessId]: true }));

    try {
      const response = await fetch(`/api/profile/lists/${businessId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: !currentState }),
      });

      if (!response.ok) {
        throw new Error('Failed to update sharing status');
      }

      // Update local state
      setBusinesses(prev =>
        prev.map(b =>
          b.id === businessId ? { ...b, isShared: !currentState } : b
        )
      );
    } catch (error) {
      console.error('Error toggling share:', error);
      alert('Failed to update sharing status. Please try again.');
    } finally {
      setSharingStates(prev => ({ ...prev, [businessId]: false }));
    }
  };

  const copyShareLink = async (business: SavedBusiness) => {
    const shareUrl = `${window.location.origin}/community/${business.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(business.id);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const removeBusiness = async (business: SavedBusiness) => {
    setRemovingId(business.id);

    try {
      const response = await fetch(`/api/profile/lists/${business.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove business');
      }

      setBusinesses(prev => {
        const updated = prev.filter(b => b.id !== business.id);

        const totalCost = updated.reduce((sum, b) => sum + b.totalCost, 0);
        const totalItems = updated.reduce((sum, b) => sum + b.itemsCount, 0);
        setTotalStats({
          totalBusinesses: updated.length,
          totalItems,
          totalCost,
        });

        return updated;
      });

      setBusinessToRemove(null);
    } catch (error) {
      console.error('Error removing business:', error);
      alert('Failed to remove business. Please try again.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Loading your saved businesses...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Lists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your saved business lists</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-400">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Lists</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your saved business lists and share them with the community
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Businesses</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalStats.totalBusinesses}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalStats.totalItems}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                KSh {totalStats.totalCost.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Business Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <div key={business.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
            {/* Share Status Banner */}
            {business.isShared && (
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center text-white text-sm font-medium">
                  <Globe className="w-4 h-4 mr-2" />
                  Public
                </div>
                <div className="flex items-center space-x-3 text-white text-xs">
                  <span className="flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    {business.viewCount || 0}
                  </span>
                  <span className="flex items-center">
                    <Copy className="w-3 h-3 mr-1" />
                    {business.copyCount || 0}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                  <ShoppingBag className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDistanceToNow(new Date(business.lastUpdated), { addSuffix: true })}
                  </div>
                  <button
                    onClick={() => setBusinessToRemove(business)}
                    aria-label={`Remove ${business.name}`}
                    className="p-1.5 text-gray-400 dark:text-gray-500 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {business.name}
              </h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Items</span>
                  <span className="font-medium text-gray-900 dark:text-white">{business.itemsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    KSh {business.totalCost.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Link href={`/businesses/${business.slug}/requirements`}>
                  <button className="w-full flex items-center justify-center px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Details
                  </button>
                </Link>

                {/* Share Toggle */}
                <button
                  onClick={() => toggleShare(business.id, business.isShared)}
                  disabled={sharingStates[business.id]}
                  className={`w-full flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    business.isShared
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                  }`}
                >
                  {sharingStates[business.id] ? (
                    <>
                      <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Updating...
                    </>
                  ) : business.isShared ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Share Publicly
                    </>
                  )}
                </button>

                {/* Copy Link Button (only show if shared) */}
                {business.isShared && (
                  <button
                    onClick={() => copyShareLink(business)}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    {copiedUrl === business.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2 text-green-600" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Copied-From Indicator */}
              {business.copiedFrom && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-start text-xs text-gray-500 dark:text-gray-400">
                  <History className="w-3.5 h-3.5 mr-1.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Copied from{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {business.copiedFrom.authorName}
                    </span>{" "}
                    <span
                      title={formatDistanceToNow(new Date(business.copiedFrom.copiedAt), {
                        addSuffix: true,
                      })}
                    >
                      on {format(new Date(business.copiedFrom.copiedAt), "MMM d, yyyy")}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add New Business Card */}
        <Link href="/businesses">
          <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-6 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer">
            <div className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Plus className="w-8 h-8 text-gray-600 dark:text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Add New Business
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Start saving items from a new business
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Remove Confirmation Modal */}
      {businessToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => (removingId ? null : setBusinessToRemove(null))}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-full flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Remove &quot;{businessToRemove.name}&quot;?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This list contains{" "}
                  <span className="font-medium text-gray-900 dark:text-white">
                    {businessToRemove.itemsCount} {businessToRemove.itemsCount === 1 ? "item" : "items"}
                  </span>
                  . Are you sure you want to remove it from your profile? This action cannot be undone.
                </p>

                {businessToRemove.isShared && (
                  <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
                    <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                      This list is currently shared publicly. Removing it will also take it down from the
                      community templates. Anyone who has already copied it to their own profile will keep
                      their copy unaffected.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setBusinessToRemove(null)}
                disabled={removingId === businessToRemove.id}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={() => removeBusiness(businessToRemove)}
                disabled={removingId === businessToRemove.id}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-60 flex items-center"
              >
                {removingId === businessToRemove.id ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}