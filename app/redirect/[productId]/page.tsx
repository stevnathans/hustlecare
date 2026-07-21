// app/redirect/[productId]/page.tsx
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { trackEvent } from '@/lib/analytics'
import RedirectActions from '@/components/redirect/RedirectActions'

export default async function RedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ productId: string }>
  searchParams: Promise<{ businessId?: string; requirementName?: string; category?: string }>
}) {
  const { productId } = await params
  const { businessId, requirementName, category } = await searchParams

  const product = await prisma.product.findUnique({
    where: { id: Number(productId) },
    select: {
      id: true,
      name: true,
      image: true,
      price: true,
      url: true,
      vendor: { select: { id: true, name: true, logo: true, phone: true, website: true } },
    },
  })

  if (!product) notFound()

  const session = await getServerSession(authOptions)

  // This page load itself is the purchase-intent signal — the same moment
  // "Buy Now" used to kick off checkout. Logged server-side so it can't be
  // spoofed or skipped by a client that doesn't call the tracking endpoint.
  await trackEvent({
    type: 'BUY_NOW_CLICK',
    userId: session?.user?.id,
    vendorId: product.vendor?.id,
    productId: product.id,
    businessId: businessId ? Number(businessId) : null,
    requirementName: requirementName ?? null,
    category: category ?? null,
  })

  const whatsappUrl = product.vendor?.phone
    ? `https://wa.me/${product.vendor.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
        `Hi, I'm interested in "${product.name}" that I found on Hustlecare.`
      )}`
    : null

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 mt-6 sm:mt-12">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
        {product.image && (
          <div className="relative w-24 h-24 mx-auto mb-4 rounded-xl overflow-hidden border border-gray-100">
            <Image src={product.image} alt={product.name} fill className="object-contain" />
          </div>
        )}
        <h1 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h1>
        {product.vendor?.name && (
          <p className="text-sm text-gray-500 mb-3">by {product.vendor.name}</p>
        )}
        <p className="text-2xl font-bold text-emerald-600 mb-5">
          KSh {product.price?.toLocaleString() ?? '—'}
        </p>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700 mb-5 text-left">
          You&apos;re being taken to {product.vendor?.name ?? 'the vendor'} to complete this purchase.
          Hustlecare doesn&apos;t charge you anything to connect with vendors — we help entrepreneurs
          find what they need for free.
        </div>

        <RedirectActions
          productId={product.id}
          vendorId={product.vendor?.id ?? null}
          businessId={businessId ? Number(businessId) : null}
          requirementName={requirementName ?? null}
          category={category ?? null}
          productUrl={product.url ?? null}
          whatsappUrl={whatsappUrl}
        />
      </div>
    </div>
  )
}