/* eslint-disable react/no-unescaped-entities */
// app/admin/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { FiTrendingUp, FiHeart, FiDollarSign } from 'react-icons/fi';

type VendorRow = {
  vendorId: number;
  vendorName: string;
  vendorStatus: string;
  buyNowClicks: number;
  outboundRedirects: number;
  cartAdds: number;
  donationClicks: number;
  clickThroughRate: number;
  suggestedInvoiceKES: number;
};

type AnalyticsResponse = {
  days: number;
  perLeadFeeKES: number;
  totalDonationClicks: number;
  vendors: VendorRow[];
};

const RANGE_OPTIONS = [7, 30, 90];

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const totalRedirects = data?.vendors.reduce((sum, v) => sum + v.outboundRedirects, 0) ?? 0;
  const totalSuggestedInvoice = data?.vendors.reduce((sum, v) => sum + v.suggestedInvoiceKES, 0) ?? 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Vendor Engagement Analytics</h1>
          <p className="text-sm text-gray-500">
            Buy Now clicks, outbound redirects, and cart adds per vendor — the basis for manual
            pay-per-lead invoicing until checkout is live.
          </p>
        </div>
        <div className="flex gap-1.5">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setDays(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                days === opt ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-400">
            <FiTrendingUp size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Outbound Redirects</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalRedirects.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-400">
            <FiDollarSign size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Suggested Invoicing</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            KSh {totalSuggestedInvoice.toLocaleString()}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            at KSh {data?.perLeadFeeKES ?? '—'} / redirect — adjust in lib/constants.ts
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-1 text-gray-400">
            <FiHeart size={14} />
            <span className="text-xs font-bold uppercase tracking-wider">Donation Clicks</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{data?.totalDonationClicks ?? 0}</div>
        </div>
      </div>

      {/* Vendor table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3 text-right">Buy Now Clicks</th>
                <th className="px-4 py-3 text-right">Continued to Vendor</th>
                <th className="px-4 py-3 text-right">Cart Adds</th>
                <th className="px-4 py-3 text-right">Click-through</th>
                <th className="px-4 py-3 text-right">Suggested Invoice</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && data?.vendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No engagement recorded in this window yet.
                  </td>
                </tr>
              )}
              {!loading &&
                data?.vendors.map((v) => (
                  <tr key={v.vendorId} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{v.vendorName}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{v.buyNowClicks}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{v.outboundRedirects}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{v.cartAdds}</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {(v.clickThroughRate * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                      KSh {v.suggestedInvoiceKES.toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        "Buy Now Clicks" = the interstitial page was viewed (purchase intent). "Continued to
        Vendor" = the user actually clicked through to the vendor's site or WhatsApp. A big gap
        between the two for a vendor often means their product page or link needs work, not
        necessarily that demand is low.
      </p>
    </div>
  );
}
