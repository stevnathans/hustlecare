'use client';

import { useState } from 'react';
import { ShareIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

export default function BusinessCard({
  name,
  cost,
  items,
  lastUpdated,
  slug,
}: {
  name: string;
  cost: string;
  items: number;
  lastUpdated: string;
  slug: string;
}) {
  const router = useRouter();
  const { saveCart } = useCart();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [loadingShare, setLoadingShare] = useState(false);

  const generateShareUrl = async () => {
    setLoadingShare(true);
    const result = await saveCart();

    if (result.success && result.cartId) {
      const url = `${window.location.origin}/shared/${result.cartId}`;
      setShareUrl(url);
    } else {
      setShareUrl('');
    }

    setLoadingShare(false);
  };

  const copyToClipboard = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopyStatus('Link copied to clipboard!');
      setTimeout(() => setCopyStatus(null), 2000);
    }
  };

  const handleShareClick = async () => {
    setIsShareModalOpen(true);
    await generateShareUrl();
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900">{name}</h3>
            <span className="text-xs text-gray-500">Updated {lastUpdated}</span>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <div>
              <p className="text-2xl font-semibold text-indigo-600">{cost}</p>
              <p className="text-sm text-gray-500">{items} items</p>
            </div>
            <div className="flex space-x-2">
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={() => router.push(`/business/${slug}`)}
              >
                <PencilIcon className="h-5 w-5 text-gray-500" />
              </button>
              <button
                className="p-2 rounded-full hover:bg-gray-100"
                onClick={handleShareClick}
              >
                <ShareIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Share This List</h2>

            {loadingShare ? (
              <div className="text-gray-500">Generating link...</div>
            ) : shareUrl ? (
              <>
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-grow px-4 py-2 border rounded-md bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                  >
                    Copy
                  </button>
                </div>

                {copyStatus && (
                  <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800">
                    {copyStatus}
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">Failed to generate share link</div>
            )}

            <div className="text-right">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
