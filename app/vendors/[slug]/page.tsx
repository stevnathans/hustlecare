// app/vendors/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Image from 'next/image';
import Link from 'next/link';
import {
  Globe, MapPin, Phone, Twitter, Instagram,
  Facebook, Linkedin, Package, Star, ShoppingCart,
  CheckCircle2, ArrowLeft, ExternalLink,
} from 'lucide-react';

type Props = { params: Promise<{ slug: string }> };

// Revalidate every 10 minutes
export const revalidate = 600;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const vendor = await prisma.vendor.findUnique({
    where: { slug, status: 'ACTIVE' },
    select: { name: true, tagline: true },
  });
  if (!vendor) return { title: 'Vendor Not Found' };
  return {
    title: `${vendor.name} | Hustlecare Marketplace`,
    description: vendor.tagline ?? `Shop products from ${vendor.name} on Hustlecare`,
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

  // Group products by requirement category
  const productsByCategory = vendor.products.reduce((acc, product) => {
    const cat = product.template?.category ?? 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, typeof vendor.products>);

  const totalReviews = vendor.products.reduce((s, p) => s + p._count.reviews, 0);
  const activeProducts = vendor.products.length;

  // Increment profile view (fire-and-forget, non-blocking)
  // In production this would go through an analytics queue
  prisma.vendorAnalytics.upsert({
    where: { vendorId_date: { vendorId: vendor.id, date: new Date(new Date().toDateString()) } },
    update: { profileViews: { increment: 1 } },
    create: { vendorId: vendor.id, date: new Date(new Date().toDateString()), profileViews: 1 },
  }).catch(() => {});

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Back link */}
      <div style={S.topBar}>
        <Link href="/marketplace" style={S.backLink}>
          <ArrowLeft size={14} /> Back to Marketplace
        </Link>
      </div>

      {/* Cover + header */}
      <div style={S.hero}>
        {vendor.coverImage ? (
          <div style={{ ...S.cover, backgroundImage: `url(${vendor.coverImage})` }} />
        ) : (
          <div style={{ ...S.cover, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
        )}

        <div style={S.heroContent}>
          <div style={S.logoWrap}>
            {vendor.logo ? (
              <Image src={vendor.logo} alt={vendor.name} width={80} height={80}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }} />
            ) : (
              <div style={S.logoFallback}><Package size={28} color="#f59e0b" /></div>
            )}
          </div>

          <div style={S.heroMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h1 style={S.vendorName}>{vendor.name}</h1>
              {vendor.isVerified && (
                <span style={S.verifiedBadge}>
                  <CheckCircle2 size={12} /> Verified
                </span>
              )}
            </div>
            {vendor.tagline && <p style={S.tagline}>{vendor.tagline}</p>}

            <div style={S.metaRow}>
              {vendor.location && (
                <span style={S.metaItem}><MapPin size={12} /> {vendor.location}</span>
              )}
              {vendor.website && (
                <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ ...S.metaItem, ...S.metaLink }}>
                  <Globe size={12} /> {vendor.website.replace(/^https?:\/\//, '')} <ExternalLink size={10} />
                </a>
              )}
              {vendor.phone && (
                <span style={S.metaItem}><Phone size={12} /> {vendor.phone}</span>
              )}
            </div>

            {/* Social links */}
            <div style={S.socialRow}>
              {vendor.twitterUrl && (
                <a href={vendor.twitterUrl} target="_blank" rel="noopener noreferrer" style={S.socialBtn}>
                  <Twitter size={15} />
                </a>
              )}
              {vendor.instagramUrl && (
                <a href={vendor.instagramUrl} target="_blank" rel="noopener noreferrer" style={S.socialBtn}>
                  <Instagram size={15} />
                </a>
              )}
              {vendor.facebookUrl && (
                <a href={vendor.facebookUrl} target="_blank" rel="noopener noreferrer" style={S.socialBtn}>
                  <Facebook size={15} />
                </a>
              )}
              {vendor.linkedinUrl && (
                <a href={vendor.linkedinUrl} target="_blank" rel="noopener noreferrer" style={S.socialBtn}>
                  <Linkedin size={15} />
                </a>
              )}
            </div>
          </div>

          {/* Stats strip */}
          <div style={S.statsStrip}>
            {[
              { label: 'Products', value: activeProducts },
              { label: 'Reviews', value: totalReviews },
              { label: 'Member since', value: new Date(vendor.user?.createdAt ?? vendor.createdAt).getFullYear() },
            ].map(stat => (
              <div key={stat.label} style={S.statItem}>
                <div style={S.statValue}>{stat.value}</div>
                <div style={S.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={S.body}>
        {/* About section */}
        {vendor.description && (
          <div style={S.aboutCard}>
            <h2 style={S.sectionTitle}>About</h2>
            <p style={S.aboutText}>{vendor.description}</p>
          </div>
        )}

        {/* Products */}
        {vendor.products.length === 0 ? (
          <div style={S.emptyState}>
            <Package size={32} style={{ color: '#3a3a56', marginBottom: '0.75rem' }} />
            <p style={{ color: '#55556e', fontSize: '0.84rem' }}>No products listed yet</p>
          </div>
        ) : (
          <>
            {Object.entries(productsByCategory).map(([category, products]) => (
              <div key={category} style={S.categorySection}>
                <h2 style={S.categoryTitle}>{category}</h2>
                <div style={S.productGrid}>
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function ProductCard({ product }: {
  product: {
    id: number; name: string; description: string | null;
    price: number | null; priceMin: number | null; priceMax: number | null;
    currency: string | null; image: string | null; url: string | null;
    isFeatured: boolean; publishedAt: Date | null;
    template: { id: number; name: string; category: string } | null;
    _count: { reviews: number; cartItems: number };
  };
}) {
  function priceStr() {
    const currency = product.currency ? `${product.currency} ` : '';
    if (product.priceMin && product.priceMax) {
      return `${currency}${product.priceMin.toLocaleString()} – ${product.priceMax.toLocaleString()}`;
    }
    if (product.price) return `${currency}${product.price.toLocaleString()}`;
    return 'Contact for price';
  }

  return (
    <div style={S.productCard} className="product-card">
      {product.isFeatured && (
        <div style={S.featuredBadge}>
          <Star size={10} fill="currentColor" /> Featured
        </div>
      )}

      {/* Image */}
      <div style={S.productImageWrap}>
        {product.image ? (
          <Image src={product.image} alt={product.name} fill
            style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 50vw, 25vw" />
        ) : (
          <div style={S.productImageFallback}>
            <Package size={24} color="#3a3a56" />
          </div>
        )}
      </div>

      <div style={S.productBody}>
        {product.template && (
          <Link href={`/marketplace?templateId=${product.template.id}`} style={S.reqTag}>
            {product.template.name}
          </Link>
        )}

        <h3 style={S.productName}>{product.name}</h3>

        {product.description && (
          <p style={S.productDesc}>{product.description}</p>
        )}

        <div style={S.productFooter}>
          <span style={S.price}>{priceStr()}</span>

          <div style={S.productActions}>
            {product.url && (
              <a href={product.url} target="_blank" rel="noopener noreferrer" style={S.buyBtn}>
                Buy <ExternalLink size={11} />
              </a>
            )}
            <div style={S.productStats}>
              <span style={S.productStat}>
                <ShoppingCart size={10} /> {product._count.cartItems}
              </span>
              {product._count.reviews > 0 && (
                <span style={S.productStat}>
                  <Star size={10} /> {product._count.reviews}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #080810; }
  a { text-decoration: none; color: inherit; }
  .product-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(0,0,0,0.4); border-color: rgba(245,158,11,0.2) !important; }
`;

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#080810', fontFamily: "'DM Sans', sans-serif", color: '#f0f0f5' },
  topBar: { padding: '1rem 2rem 0' },
  backLink: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#55556e', transition: 'color 0.15s' },
  hero: { position: 'relative', marginBottom: '2rem' },
  cover: { height: 220, backgroundSize: 'cover', backgroundPosition: 'center' },
  heroContent: { maxWidth: 960, margin: '0 auto', padding: '0 2rem 1.5rem' },
  logoWrap: { width: 80, height: 80, borderRadius: 16, border: '3px solid #080810', overflow: 'hidden', marginTop: -40, marginBottom: '0.75rem', background: '#13131a', position: 'relative' },
  logoFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.1)' },
  heroMeta: { marginBottom: '1.25rem' },
  vendorName: { fontSize: '1.75rem', fontFamily: "'Instrument Serif', serif", fontWeight: 400, letterSpacing: '-0.02em', color: '#f0f0f5' },
  verifiedBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 100, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontSize: '0.72rem', fontWeight: 700 },
  tagline: { fontSize: '0.9rem', color: '#9494b0', margin: '0.4rem 0 0.75rem', lineHeight: 1.5 },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' },
  metaItem: { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#55556e' },
  metaLink: { color: '#818cf8' },
  socialRow: { display: 'flex', gap: '0.4rem' },
  socialBtn: { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9494b0', transition: 'all 0.15s' },
  statsStrip: { display: 'flex', gap: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' },
  statItem: { textAlign: 'center' },
  statValue: { fontSize: '1.3rem', fontFamily: "'DM Mono', monospace", fontWeight: 700, color: '#f0f0f5' },
  statLabel: { fontSize: '0.72rem', color: '#55556e', marginTop: '0.1rem' },
  body: { maxWidth: 960, margin: '0 auto', padding: '0 2rem 4rem' },
  aboutCard: { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, padding: '1.5rem', marginBottom: '2rem' },
  sectionTitle: { fontSize: '0.78rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' },
  aboutText: { fontSize: '0.88rem', color: '#c8c8dc', lineHeight: 1.8, whiteSpace: 'pre-wrap' },
  emptyState: { textAlign: 'center', padding: '4rem 2rem', color: '#55556e' },
  categorySection: { marginBottom: '2.5rem' },
  categoryTitle: { fontSize: '1rem', fontWeight: 700, color: '#e2e2f0', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' },
  productCard: { background: '#0f0f1a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 13, overflow: 'hidden', transition: 'all 0.2s', position: 'relative' },
  featuredBadge: { position: 'absolute', top: 10, right: 10, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.55rem', borderRadius: 100, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700, zIndex: 1 },
  productImageWrap: { position: 'relative', height: 160, background: 'rgba(255,255,255,0.03)' },
  productImageFallback: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  productBody: { padding: '0.9rem' },
  reqTag: { display: 'inline-flex', padding: '0.18rem 0.55rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700, background: 'rgba(99,102,241,0.1)', color: '#818cf8', marginBottom: '0.5rem' },
  productName: { fontSize: '0.88rem', fontWeight: 700, color: '#f0f0f5', marginBottom: '0.35rem', lineHeight: 1.4 },
  productDesc: { fontSize: '0.76rem', color: '#55556e', lineHeight: 1.6, marginBottom: '0.75rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const },
  productFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '0.5rem', flexWrap: 'wrap' },
  price: { fontFamily: "'DM Mono', monospace", fontSize: '0.84rem', fontWeight: 700, color: '#34d399' },
  productActions: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  buyBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.3rem 0.75rem', borderRadius: 7, background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#0a0a0f', fontSize: '0.75rem', fontWeight: 700 },
  productStats: { display: 'flex', gap: '0.5rem' },
  productStat: { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', color: '#3a3a56' },
};