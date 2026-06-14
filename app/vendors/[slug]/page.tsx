// app/vendors/[slug]/page.tsx
// NOTE: This is split into a server component (data fetching) and a client component
// (interactivity). The server component below fetches data and passes it as props.

// ─── SERVER COMPONENT ───────────────────────────────────────────────────────
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import Script from 'next/script';
import VendorStorefront from '@/components/vendors/VendorStorefront';

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { slug, status: 'ACTIVE' },
    select: {
      name: true,
      tagline: true,
      description: true,
      logo: true,
      location: true,
    },
  });

  if (!vendor) {
    return {
      title: 'Vendor Not Found',
      robots: { index: false },
    };
  }

  const title = `${vendor.name} | Hustlecare Marketplace`;
  const description =
    vendor.description
      ? vendor.description.slice(0, 155).trimEnd() + (vendor.description.length > 155 ? '…' : '')
      : vendor.tagline ?? `Shop products from ${vendor.name} on Hustlecare`;
  const url = `https://www.hustlecare.net/vendors/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: 'Hustlecare',
      ...(vendor.logo ? { images: [{ url: vendor.logo, width: 400, height: 400, alt: vendor.name }] } : {}),
    },
    twitter: {
      card: vendor.logo ? 'summary' : 'summary',
      title,
      description,
      ...(vendor.logo ? { images: [vendor.logo] } : {}),
    },
  };
}

export default async function VendorStorefrontPage({ params }: Props) {
  const { slug } = await params;

  const vendor = await prisma.vendor.findUnique({
    where: { slug, status: 'ACTIVE' },
    include: {
      user: { select: { createdAt: true } },
      products: {
        where: { status: 'ACTIVE' },
        include: {
          template: { select: { id: true, name: true, category: true } },
          _count: { select: { reviews: true, cartItems: true } },
        },
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
      },
      _count: { select: { products: true } },
    },
  });

  if (!vendor) notFound();

  // Increment profile view (fire-and-forget)
  prisma.vendorAnalytics.upsert({
    where: { vendorId_date: { vendorId: vendor.id, date: new Date(new Date().toDateString()) } },
    update: { profileViews: { increment: 1 } },
    create: { vendorId: vendor.id, date: new Date(new Date().toDateString()), profileViews: 1 },
  }).catch(() => {});

  // Serialise dates
  const serialised = {
    ...vendor,
    createdAt: vendor.createdAt.toISOString(),
    updatedAt: vendor.updatedAt.toISOString(),
    verifiedAt: vendor.verifiedAt?.toISOString() ?? null,
    suspendedAt: vendor.suspendedAt?.toISOString() ?? null,
    user: vendor.user ? { createdAt: vendor.user.createdAt.toISOString() } : null,
    products: vendor.products.map(p => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      publishedAt: p.publishedAt?.toISOString() ?? null,
      rejectedAt: p.rejectedAt?.toISOString() ?? null,
      featuredAt: p.featuredAt?.toISOString() ?? null,
    })),
  };

  const url = `https://www.hustlecare.net/vendors/${vendor.slug}`;

  // JSON-LD structured data — Organisation + ItemList of products
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': url,
        name: vendor.name,
        url,
        ...(vendor.logo ? { logo: vendor.logo } : {}),
        ...(vendor.description ? { description: vendor.description } : {}),
        ...(vendor.location ? { address: { '@type': 'PostalAddress', addressLocality: vendor.location } } : {}),
        ...(vendor.phone ? { telephone: vendor.phone } : {}),
        ...(vendor.website ? { sameAs: [vendor.website] } : {}),
      },
      ...(vendor.products.length > 0
        ? [{
            '@type': 'ItemList',
            name: `Products by ${vendor.name}`,
            url,
            numberOfItems: vendor.products.length,
            itemListElement: vendor.products.slice(0, 10).map((p, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              item: {
                '@type': 'Product',
                name: p.name,
                ...(p.description ? { description: p.description } : {}),
                ...(p.image ? { image: p.image } : {}),
                offers: {
                  '@type': 'Offer',
                  priceCurrency: p.currency ?? 'KES',
                  ...(p.price
                    ? { price: p.price }
                    : p.priceMin
                      ? { lowPrice: p.priceMin, highPrice: p.priceMax ?? p.priceMin, '@type': 'AggregateOffer' }
                      : {}),
                  availability: 'https://schema.org/InStock',
                  url: p.url ?? url,
                },
              },
            })),
          }]
        : []),
    ],
  };

  return (
    <>
      <Script
        id="vendor-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <VendorStorefront vendor={serialised} />
    </>
  );
}