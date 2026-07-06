// app/marketplace/products/[idSlug]/ProductDetailContent.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Truck, Clock, MapPin, Tag, ExternalLink, FileText } from 'lucide-react';

type Product = {
  id: number; name: string; description: string | null; price: number | null; priceMin: number | null; priceMax: number | null;
  currency: string; image: string | null; url: string | null; condition: string; negotiable: boolean;
  usedDurationValue: number | null; usedDurationUnit: string | null; hasReceipt: string | null;
  brand: string | null; modelNumber: string | null; voltage: string | null; wattage: string | null; dimensions: string | null;
  weight: number | null; weightUnit: string | null;
  warrantyType: string; warrantyDurationValue: number | null; warrantyDurationUnit: string | null;
  deliveryAvailable: boolean; pickupLocation: string | null; leadTime: string | null;
  vendor: { id: number; name: string; slug: string; logo: string | null; isVerified: boolean; description: string | null; location: string | null } | null;
  template: { id: number; name: string; category: string; necessity: string } | null;
  bulkPricing: { minQty: number; price: number }[];
};

type Related = { id: number; name: string; price: number | null; image: string | null; condition: string; vendor: { name: string } | null };

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function formatLeadTime(lt: string | null) {
  switch (lt) {
    case 'IN_STOCK': return 'In stock — ships immediately';
    case '1_3_DAYS': return 'Ships in 1–3 days';
    case '1_WEEK': return 'Ships in about 1 week';
    case '2_WEEKS_PLUS': return 'Ships in 2+ weeks';
    default: return null;
  }
}

export default function ProductDetailContent({ product, related }: { product: Product; related: Related[] }) {
  const [imageOpen, setImageOpen] = useState(false);
  const isUsed = product.condition === 'USED';
  const hasWarranty = product.warrantyType !== 'NONE';
  const leadTimeLabel = formatLeadTime(product.leadTime);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex items-center gap-1.5 text-xs text-gray-400">
          <Link href="/marketplace" className="hover:text-emerald-600">Marketplace</Link>
          <span>/</span>
          {product.template && <><span>{product.template.category}</span><span>/</span></>}
          <span className="text-gray-600">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.2fr]">
          {/* Image */}
          <div>
            <div
              className="aspect-square cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white"
              onClick={() => product.image && setImageOpen(true)}
            >
              {product.image ? (
                <Image src={product.image} alt={product.name} width={600} height={600} className="h-full w-full object-contain p-6" />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">No image available</div>
              )}
            </div>

            {product.vendor && (
              <Link href={`/vendors/${product.vendor.slug}`} className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:border-emerald-300">
                {product.vendor.logo ? (
                  <Image src={product.vendor.logo} alt={product.vendor.name} width={40} height={40} className="rounded-lg object-contain" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-gray-900">{product.vendor.name}</p>
                    {product.vendor.isVerified && <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />}
                  </div>
                  {product.vendor.location && <p className="text-xs text-gray-400">{product.vendor.location}</p>}
                </div>
              </Link>
            )}
          </div>

          {/* Details */}
          <div>
            {product.template && (
              <Link href={`/marketplace?category=${product.template.category}`} className="mb-2 inline-block rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-600">
                Fulfils: {product.template.name}
              </Link>
            )}
            <h1 className="mb-2 text-2xl font-bold text-gray-900">{product.name}</h1>

            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {product.price != null
                  ? `${product.currency} ${product.price.toLocaleString()}`
                  : product.priceMin != null
                  ? `${product.currency} ${product.priceMin.toLocaleString()} – ${product.priceMax?.toLocaleString()}`
                  : 'Price on request'}
              </span>
              {product.negotiable && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">Negotiable</span>}
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isUsed ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {isUsed ? 'Used' : 'Brand New'}
              </span>
              {hasWarranty && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"><ShieldCheck className="h-3 w-3" /> Warranty</span>}
              {product.deliveryAvailable && <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"><Truck className="h-3 w-3" /> Delivery</span>}
            </div>

            {product.description && <p className="mb-5 text-sm leading-relaxed text-gray-600">{product.description}</p>}

            {product.bulkPricing.length > 0 && (
              <div className="mb-5 overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500"><Tag className="h-3.5 w-3.5" /> Bulk pricing</div>
                {product.bulkPricing.map((tier, i) => (
                  <div key={i} className="flex justify-between px-3 py-2 text-sm even:bg-gray-50">
                    <span className="text-gray-500">{tier.minQty}+ units</span>
                    <span className="font-semibold text-gray-900">{product.currency} {tier.price.toLocaleString()} / unit</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-6 space-y-2 text-sm text-gray-600">
              {leadTimeLabel && <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-gray-400" /> {leadTimeLabel}</p>}
              {product.pickupLocation && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> Pickup: {product.pickupLocation}</p>}
              {(product.brand || product.modelNumber) && <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" /> {[product.brand, product.modelNumber].filter(Boolean).join(' · ')}</p>}
            </div>

            {product.url && (
              <a href={product.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
                Visit Vendor to Buy <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Also fulfils this requirement</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((r) => (
                <Link key={r.id} href={`/marketplace/products/${r.id}-${slugify(r.name)}`} className="rounded-xl border border-gray-100 bg-white p-3 hover:border-emerald-300">
                  {r.image ? <Image src={r.image} alt={r.name} width={100} height={100} className="mx-auto mb-2 h-20 w-20 object-contain" /> : <div className="mb-2 h-20 w-full rounded-lg bg-gray-50" />}
                  <p className="line-clamp-2 text-xs font-semibold text-gray-800">{r.name}</p>
                  {r.price != null && <p className="mt-1 text-sm font-bold text-gray-900">KSh {r.price.toLocaleString()}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {imageOpen && product.image && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setImageOpen(false)}>
          <Image src={product.image} alt={product.name} width={800} height={800} className="max-h-[85vh] w-auto object-contain" />
        </div>
      )}
    </div>
  );
}