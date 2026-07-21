// app/orders/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiCheckCircle, FiClock, FiXCircle, FiPackage, FiRefreshCw } from 'react-icons/fi';

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  consolidationFee: number;
  totalAmount: number;
  business: { name: string; slug: string };
  payment: { status: string } | null;
  vendorSubOrders: {
    id: string;
    status: string;
    subtotal: number;
    vendor: { name: string; logo?: string; phone?: string };
    items: {
      id: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      product: { name: string; image?: string };
    }[];
  }[];
};

const SUB_ORDER_META: Record<string, { label: string; text: string; bg: string }> = {
  PENDING_VENDOR_CONFIRMATION: { label: 'Awaiting vendor confirmation', text: 'text-amber-600', bg: 'bg-amber-50' },
  CONFIRMED: { label: 'Confirmed — preparing', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  DELIVERED: { label: 'Delivered', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  REJECTED: { label: 'Rejected by vendor', text: 'text-red-500', bg: 'bg-red-50' },
  CANCELLED: { label: 'Cancelled', text: 'text-gray-400', bg: 'bg-gray-50' },
  REFUNDED: { label: 'Refunded', text: 'text-gray-400', bg: 'bg-gray-50' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const paymentStatusParam = searchParams.get('status'); // success | failed | pending | unknown

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function fetchOrder() {
    const res = await fetch(`/api/orders/${id}`);
    if (res.ok) setOrder(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleRetryPayment = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/orders/${id}/retry-payment`, { method: 'POST' });
      const data = await res.json();
      if (data.redirectUrl) window.location.href = data.redirectUrl;
    } finally {
      setRetrying(false);
    }
  };

  const handleConfirmReceipt = async (subOrderId: string) => {
    setConfirmingId(subOrderId);
    try {
      const res = await fetch(`/api/orders/${id}/suborders/${subOrderId}/confirm-receipt`, {
        method: 'POST',
      });
      if (res.ok) await fetchOrder();
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading order…</div>;
  if (!order) return <div className="p-8 text-center text-gray-400">Order not found.</div>;

  const paymentPending = order.status === 'PENDING_PAYMENT' || order.payment?.status === 'FAILED';

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-1">Order</p>
        <h1 className="text-xl font-bold text-gray-900">{order.orderNumber}</h1>
        <p className="text-sm text-gray-500">{order.business.name}</p>
      </div>

      {/* Payment status banners */}
      {paymentStatusParam === 'success' && order.status !== 'PENDING_PAYMENT' && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <FiCheckCircle /> Payment received — your order is being processed.
        </div>
      )}
      {(paymentStatusParam === 'failed' || order.payment?.status === 'FAILED') && (
        <div className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span className="flex items-center gap-2">
            <FiXCircle /> Payment failed or was not completed.
          </span>
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            <FiRefreshCw className={retrying ? 'animate-spin' : ''} size={12} /> Retry payment
          </button>
        </div>
      )}
      {paymentPending && paymentStatusParam !== 'failed' && order.status === 'PENDING_PAYMENT' && (
        <div className="mb-5 flex items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <span className="flex items-center gap-2">
            <FiClock /> Waiting for payment confirmation.
          </span>
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
          >
            <FiRefreshCw className={retrying ? 'animate-spin' : ''} size={12} /> Pay now
          </button>
        </div>
      )}

      {/* Vendor sub-orders */}
      <div className="space-y-4">
        {order.vendorSubOrders.map((subOrder) => {
          const meta = SUB_ORDER_META[subOrder.status] ?? SUB_ORDER_META.PENDING_VENDOR_CONFIRMATION;
          return (
            <div key={subOrder.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {subOrder.vendor.logo && (
                    <Image
                      src={subOrder.vendor.logo}
                      alt={subOrder.vendor.name}
                      width={24}
                      height={24}
                      className="rounded"
                    />
                  )}
                  <span className="font-semibold text-sm text-gray-800">{subOrder.vendor.name}</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>
              </div>

              <div className="space-y-2 mb-3">
                {subOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {item.product.image && (
                      <div className="relative w-10 h-10 flex-shrink-0 rounded border border-gray-100 overflow-hidden">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <span className="flex-1 text-gray-700 truncate">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-gray-500">KSh {item.lineTotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm font-semibold text-gray-700">
                  Subtotal: KSh {subOrder.subtotal.toLocaleString()}
                </span>
                {subOrder.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleConfirmReceipt(subOrder.id)}
                    disabled={confirmingId === subOrder.id}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <FiPackage size={12} /> {confirmingId === subOrder.id ? 'Confirming…' : "I've received this"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl bg-gray-50 border border-gray-200 p-4 text-sm">
        <div className="flex justify-between text-gray-600 mb-1">
          <span>Subtotal</span>
          <span>KSh {order.subtotal.toLocaleString()}</span>
        </div>
        {order.consolidationFee > 0 && (
          <div className="flex justify-between text-gray-600 mb-1">
            <span>Consolidation fee</span>
            <span>KSh {order.consolidationFee.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200 mt-1">
          <span>Total</span>
          <span>KSh {order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <Link
        href={`/marketplace/${order.business.slug}`}
        className="inline-block mt-5 text-sm text-emerald-600 hover:underline"
      >
        ← Back to {order.business.name}
      </Link>
    </div>
  );
}