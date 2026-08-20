// app/us/marketplace/products/[idSlug]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetailContent from '../../../../marketplace/products/[idSlug]/ProductDetailContent';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

function parseIdSlug(idSlug: string) {
  const match = idSlug.match(/^(\d+)(?:-(.*))?$/);
  return match ? { id: Number(match[1]), slug: match[2] || '' } : null;
}

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function fetchProduct(id: number) {
  const product = await prisma.product.findFirst({
    // vendor.country: 'US' is the market boundary — a Kenyan product's id
    // simply won't match here, so this route 404s instead of rendering a
    // KES product under a /us URL.
    where: { id, status: 'ACTIVE', vendor: { country: 'US' } },
    include: {
      vendor: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, description: true, location: true } },
      template: { select: { id: true, name: true, category: true, necessity: true } },
      bulkPricing: { select: { minQty: true, price: true }, orderBy: { minQty: 'asc' } },
    },
  });

  return product ? { ...product, currency: product.currency ?? 'USD' } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ idSlug: string }> }): Promise<Metadata> {
  const { idSlug } = await params;
  const parsed = parseIdSlug(idSlug);
  if (!parsed) return { title: 'Product Not Found | HustleCare' };

  const product = await fetchProduct(parsed.id);
  if (!product) return { title: 'Product Not Found | HustleCare', robots: { index: false, follow: true } };

  const canonicalSlug = slugify(product.name);
  const canonicalUrl = `${SITE_URL}/us/marketplace/products/${product.id}-${canonicalSlug}`;

  return {
    title: `${product.name} | HustleCare Marketplace`,
    description: product.description || `${product.name} — available from ${product.vendor?.name || 'a verified vendor'} on HustleCare.`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: product.name,
      description: product.description || undefined,
      images: product.image ? [{ url: product.image }] : undefined,
      type: 'website',
    },
  };
}

export default async function USProductDetailPage({ params }: { params: Promise<{ idSlug: string }> }) {
  const { idSlug } = await params;
  const parsed = parseIdSlug(idSlug);
  if (!parsed) notFound();

  const product = await fetchProduct(parsed.id);
  if (!product) notFound();

  const canonicalSlug = slugify(product.name);
  if (parsed.slug !== canonicalSlug) {
    redirect(`/us/marketplace/products/${product.id}-${canonicalSlug}`);
  }

  const relatedRaw = product.templateId
    ? await prisma.product.findMany({
        where: { templateId: product.templateId, status: 'ACTIVE', id: { not: product.id }, vendor: { country: 'US' } },
        select: { id: true, name: true, price: true, currency: true, image: true, condition: true, vendor: { select: { name: true } } },
        take: 4,
        orderBy: { price: 'asc' },
      })
    : [];
  const related = relatedRaw.map((r) => ({ ...r, currency: r.currency ?? 'USD' }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.image || undefined,
    ...(product.price != null
      ? { offers: { '@type': 'Offer', price: product.price, priceCurrency: product.currency || 'USD', availability: 'https://schema.org/InStock', url: `${SITE_URL}/us/marketplace/products/${product.id}-${canonicalSlug}` } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ProductDetailContent product={product} related={related} market="US" />
    </>
  );
}