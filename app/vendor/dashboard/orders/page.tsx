// app/vendor/dashboard/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { FiCheck, FiX, FiPackage } from 'react-icons/fi';

type SubOrder = {
  id: string;
  status: string;
  subtotal: number;
  payoutAmount: number;
  vendorNotes: string | null;
  order: { orderNumber: string; createdAt: string };
  items: { id: string; quantity: number; lineTotal: number; product: { name: string; image?: string } }[];
};

const STATUS_META: Record<string, { label: string; text: string; bg: string }> = {
  PENDING_VENDOR_CONFIRMATION: { label: 'Needs confirmation', text: 'text-amber-600', bg: 'bg-amber-50' },
  CONFIRMED: { label: 'Confirmed', text: 'text-indigo-600', bg: 'bg-indigo-50' },
  DELIVERED: { label: 'Delivered', text: 'text-emerald-600', bg: 'bg-emerald-50' },
  REJECTED: { label: 'Rejected', text: 'text-red-500', bg: 'bg-red-50' },
  CANCELLED: { label: 'Cancelled', text: 'text-gray-400', bg: 'bg-gray-50' },
  REFUNDED: { label: 'Refunded', text: 'text-gray-400', bg: 'bg-gray-50' },
};

export default function VendorOrdersPage() {
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function fetchOrders() {
    const res = await fetch('/api/vendors/orders');
    if (res.ok) setSubOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleConfirm = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/vendors/orders/${id}/confirm`, { method: 'POST' });
      if (res.ok) await fetchOrders();
    } finally {
      setActingId(null);
    }
  };

  const submitReject = async (id: string) => {
    setActingId(id);
    try {
      const res = await fetch(`/api/vendors/orders/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (res.ok) {
        setRejectingId(null);
        setRejectReason('');
        await fetchOrders();
      }
    } finally {
      setActingId(null);
    }
  };

  const pendingCount = subOrders.filter((s) => s.status === 'PENDING_VENDOR_CONFIRMATION').length;

  if (loading) return <div className="p-6 text-gray-400">Loading orders…</div>;

  return (
    <div className="w-full max-w-[1020px] pb-4">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900 mb-0.5">Orders</h1>
        <p className="text-sm text-gray-500">
          {pendingCount > 0
            ? `${pendingCount} order${pendingCount > 1 ? 's' : ''} awaiting your confirmation`
            : 'All caught up'}
        </p>
      </div>

      {subOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <FiPackage size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">No orders yet.</p>
        </div>
      )}

      <div className="space-y-3">
        {subOrders.map((subOrder) => {
          const meta = STATUS_META[subOrder.status] ?? STATUS_META.PENDING_VENDOR_CONFIRMATION;
          return (
            <div key={subOrder.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-sm font-semibold text-gray-800">{subOrder.order.orderNumber}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(subOrder.order.createdAt).toLocaleDateString('en-KE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                  {meta.label}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {subOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    {item.product.image && (
                      <div className="relative w-9 h-9 flex-shrink-0 rounded border border-gray-100 overflow-hidden">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-contain" />
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
                <div className="text-sm">
                  <span className="text-gray-500">You&apos;ll receive: </span>
                  <span className="font-semibold text-emerald-600">
                    KSh {subOrder.payoutAmount.toLocaleString()}
                  </span>
                </div>

                {subOrder.status === 'PENDING_VENDOR_CONFIRMATION' && rejectingId !== subOrder.id && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRejectingId(subOrder.id)}
                      className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50"
                    >
                      <FiX size={12} /> Can&apos;t fulfil
                    </button>
                    <button
                      onClick={() => handleConfirm(subOrder.id)}
                      disabled={actingId === subOrder.id}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      <FiCheck size={12} /> Confirm
                    </button>
                  </div>
                )}
              </div>

              {rejectingId === subOrder.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Reason (e.g. out of stock)"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => submitReject(subOrder.id)}
                    disabled={actingId === subOrder.id}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Confirm rejection
                  </button>
                  <button
                    onClick={() => setRejectingId(null)}
                    className="rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {subOrder.status === 'REJECTED' && subOrder.vendorNotes && (
                <p className="mt-2 text-xs text-gray-400 italic">Reason given: {subOrder.vendorNotes}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}