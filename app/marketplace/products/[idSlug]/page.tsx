// app/marketplace/products/[idSlug]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetailContent from './ProductDetailContent';

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
    where: { id, status: 'ACTIVE' },
    include: {
      vendor: { select: { id: true, name: true, slug: true, logo: true, isVerified: true, description: true, location: true } },
      template: { select: { id: true, name: true, category: true, necessity: true } },
      bulkPricing: { select: { minQty: true, price: true }, orderBy: { minQty: 'asc' } },
    },
  });

  return product ? { ...product, currency: product.currency ?? 'KES' } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ idSlug: string }> }): Promise<Metadata> {
  const { idSlug } = await params;
  const parsed = parseIdSlug(idSlug);
  if (!parsed) return { title: 'Product Not Found | HustleCare' };

  const product = await fetchProduct(parsed.id);
  if (!product) return { title: 'Product Not Found | HustleCare', robots: { index: false, follow: true } };

  const canonicalSlug = slugify(product.name);
  const canonicalUrl = `${SITE_URL}/marketplace/products/${product.id}-${canonicalSlug}`;

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

export default async function ProductDetailPage({ params }: { params: Promise<{ idSlug: string }> }) {
  const { idSlug } = await params;
  const parsed = parseIdSlug(idSlug);
  if (!parsed) notFound();

  const product = await fetchProduct(parsed.id);
  if (!product) notFound();

  // Redirect stale slugs (product renamed since last crawl) to the
  // current canonical URL — never 404 on a valid id with an old slug.
  const canonicalSlug = slugify(product.name);
  if (parsed.slug !== canonicalSlug) {
    redirect(`/marketplace/products/${product.id}-${canonicalSlug}`);
  }

  const related = product.templateId
    ? await prisma.product.findMany({
        where: { templateId: product.templateId, status: 'ACTIVE', id: { not: product.id } },
        select: { id: true, name: true, price: true, image: true, condition: true, vendor: { select: { name: true } } },
        take: 4,
        orderBy: { price: 'asc' },
      })
    : [];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.image || undefined,
    ...(product.price != null
      ? { offers: { '@type': 'Offer', price: product.price, priceCurrency: product.currency || 'KES', availability: 'https://schema.org/InStock', url: `${SITE_URL}/marketplace/products/${product.id}-${canonicalSlug}` } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ProductDetailContent product={product} related={related} />
    </>
  );
}