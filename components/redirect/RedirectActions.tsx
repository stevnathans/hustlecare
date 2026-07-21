// components/redirect/RedirectActions.tsx
'use client';

import { useState } from 'react';
import { FiExternalLink, FiMessageCircle, FiHeart } from 'react-icons/fi';

interface RedirectActionsProps {
  productId: number;
  vendorId: number | null;
  businessId: number | null;
  requirementName: string | null;
  category: string | null;
  productUrl: string | null;
  whatsappUrl: string | null;
}

async function logEvent(type: string, ctx: Omit<RedirectActionsProps, 'productUrl' | 'whatsappUrl'>) {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...ctx }),
    });
  } catch {
    // never block navigation on analytics failing
  }
}

export default function RedirectActions({
  productId,
  vendorId,
  businessId,
  requirementName,
  category,
  productUrl,
  whatsappUrl,
}: RedirectActionsProps) {
  const [showDonate, setShowDonate] = useState(false);

  const context = { productId, vendorId, businessId, requirementName, category };

  const handleContinue = (url: string) => {
    logEvent('OUTBOUND_REDIRECT', context);
    window.open(url, '_blank');
  };

  const handleDonateClick = () => {
    logEvent('DONATION_CLICK', context);
    setShowDonate((v) => !v);
  };

  return (
    <div className="space-y-2.5">
      {productUrl && (
        <button
          onClick={() => handleContinue(productUrl)}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Continue to Vendor Site <FiExternalLink size={15} />
        </button>
      )}

      {whatsappUrl && (
        <button
          onClick={() => handleContinue(whatsappUrl)}
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Message on WhatsApp <FiMessageCircle size={15} />
        </button>
      )}

      {!productUrl && !whatsappUrl && (
        <p className="text-sm text-gray-400 italic">
          This vendor hasn&apos;t added a link or contact number yet.
        </p>
      )}

      <div className="pt-2">
        <button
          onClick={handleDonateClick}
          className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 py-2 transition-colors"
        >
          <FiHeart size={13} /> Support Hustlecare
        </button>

        {showDonate && (
          <div className="mt-2 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600 text-left">
            {/* TODO: replace with your actual Till/Paybill number before launch */}
            You can support Hustlecare by sending any amount to M-Pesa Number{' '}
            <span className="font-semibold text-gray-800">0713140158</span>. Every bit
            helps us keep this free for entrepreneurs across Kenya.
          </div>
        )}
      </div>
    </div>
  );
}