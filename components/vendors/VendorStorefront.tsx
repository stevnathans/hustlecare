'use client';
// components/vendor/VendorStorefront.tsx
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Globe, MapPin, Phone, Twitter, Instagram,
  Facebook, Linkedin, Package, Star, ShoppingCart,
  CheckCircle2, ArrowLeft, ExternalLink, LayoutGrid,
  List, ChevronDown, ChevronUp,
} from 'lucide-react';

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number | null;
  priceMin: number | null;
  priceMax: number | null;
  currency: string | null;
  image: string | null;
  url: string | null;
  isFeatured: boolean;
  publishedAt: string | null;
  template: { id: number; name: string; category: string } | null;
  _count: { reviews: number; cartItems: number };
};

type Vendor = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  website: string | null;
  logo: string | null;
  location: string | null;
  phone: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  user: { createdAt: string } | null;
  products: Product[];
};

export default function VendorStorefront({ vendor }: { vendor: Vendor }) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [aboutOpen, setAboutOpen] = useState(false);

  const activeProducts = vendor.products.length;
  const totalReviews = vendor.products.reduce((s, p) => s + p._count.reviews, 0);
  const memberSince = new Date(vendor.user?.createdAt ?? vendor.createdAt).getFullYear();

  const productsByCategory = vendor.products.reduce((acc, product) => {
    const cat = product.template?.category ?? 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  const hasSocials = vendor.twitterUrl || vendor.instagramUrl || vendor.facebookUrl || vendor.linkedinUrl;

  return (
    <div style={S.page}>
      <style>{CSS}</style>

      {/* Back */}
      <div style={S.topBar}>
        <Link href="/marketplace" style={S.backLink} className="vs-back">
          <ArrowLeft size={13} /> Marketplace
        </Link>
      </div>

      <div style={S.shell} className="vs-shell">

        {/* ── LEFT SIDEBAR ── */}
        <aside style={S.sidebar} className="vs-sidebar">
          <div style={S.sidebarInner}>

            {/* Logo + name */}
            <div style={S.vendorHead}>
              <div style={S.logoWrap}>
                {vendor.logo ? (
                  <Image src={vendor.logo} alt={vendor.name} fill
                    style={{ objectFit: 'cover' }} sizes="72px" />
                ) : (
                  <div style={S.logoFallback}>
                    <Package size={22} color="#f59e0b" />
                  </div>
                )}
              </div>
              <div>
                <h1 style={S.vendorName}>{vendor.name}</h1>
                {vendor.isVerified && (
                  <span style={S.verifiedBadge}>
                    <CheckCircle2 size={11} /> Verified
                  </span>
                )}
              </div>
            </div>

            <div style={S.divider} />

            {/* Stats */}
            <div style={S.statsRow}>
              <div style={S.stat}>
                <div style={S.statVal}>{activeProducts}</div>
                <div style={S.statLbl}>Products</div>
              </div>
              <div style={S.statDivider} />
              <div style={S.stat}>
                <div style={S.statVal}>{totalReviews}</div>
                <div style={S.statLbl}>Reviews</div>
              </div>
              <div style={S.statDivider} />
              <div style={S.stat}>
                <div style={S.statVal}>{memberSince}</div>
                <div style={S.statLbl}>Since</div>
              </div>
            </div>

            <div style={S.divider} />

            {/* Contact info */}
            <div style={S.metaList}>
              {vendor.location && (
                <div style={S.metaItem}>
                  <MapPin size={13} style={{ color: '#55556e', flexShrink: 0 }} />
                  <span>{vendor.location}</span>
                </div>
              )}
              {vendor.phone && (
                <div style={S.metaItem}>
                  <Phone size={13} style={{ color: '#55556e', flexShrink: 0 }} />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div style={S.metaItem}>
                  <Globe size={13} style={{ color: '#55556e', flexShrink: 0 }} />
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={S.websiteLink}
                  >
                    {vendor.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            {/* About — always visible on desktop */}
            {vendor.description && (
              <>
                <div style={S.divider} />
                <div>
                  <div style={S.sideLabel}>About</div>
                  <p style={S.aboutText}>{vendor.description}</p>
                </div>
              </>
            )}

            {/* Socials */}
            {hasSocials && (
              <>
                <div style={S.divider} />
                <div>
                  <div style={S.sideLabel}>Find us on</div>
                  <div style={S.socialsRow}>
                    {vendor.twitterUrl && (
                      <a href={vendor.twitterUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="Twitter / X">
                        <Twitter size={14} />
                      </a>
                    )}
                    {vendor.instagramUrl && (
                      <a href={vendor.instagramUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="Instagram">
                        <Instagram size={14} />
                      </a>
                    )}
                    {vendor.facebookUrl && (
                      <a href={vendor.facebookUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="Facebook">
                        <Facebook size={14} />
                      </a>
                    )}
                    {vendor.linkedinUrl && (
                      <a href={vendor.linkedinUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon} title="LinkedIn">
                        <Linkedin size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={S.main}>

          {/* Mobile vendor header — compact, no sidebar */}
          <div style={S.mobileHeader} className="vs-mobile-header">
            <div style={S.mobileVendorRow}>
              <div style={{ ...S.logoWrap, width: 52, height: 52, borderRadius: 12 }}>
                {vendor.logo ? (
                  <Image src={vendor.logo} alt={vendor.name} fill
                    style={{ objectFit: 'cover' }} sizes="52px" />
                ) : (
                  <div style={S.logoFallback}><Package size={18} color="#f59e0b" /></div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h1 style={{ ...S.vendorName, fontSize: '1.1rem' }}>{vendor.name}</h1>
                  {vendor.isVerified && (
                    <span style={S.verifiedBadge}><CheckCircle2 size={10} /> Verified</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                  <span style={S.mobileStatChip}><strong>{activeProducts}</strong> products</span>
                  <span style={S.mobileStatChip}><strong>{totalReviews}</strong> reviews</span>
                  {vendor.location && (
                    <span style={S.mobileStatChip}>
                      <MapPin size={10} /> {vendor.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* About accordion — mobile only */}
            {vendor.description && (
              <button
                style={S.accordionBtn}
                onClick={() => setAboutOpen(o => !o)}
                aria-expanded={aboutOpen}
              >
                <span>About {vendor.name}</span>
                {aboutOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {aboutOpen && vendor.description && (
              <div style={S.accordionBody}>
                <p style={{ ...S.aboutText, fontSize: '0.84rem' }}>{vendor.description}</p>
                {/* Show socials inside accordion on mobile if they exist */}
                {hasSocials && (
                  <div style={{ ...S.socialsRow, marginTop: '0.85rem' }}>
                    {vendor.twitterUrl && <a href={vendor.twitterUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon}><Twitter size={14} /></a>}
                    {vendor.instagramUrl && <a href={vendor.instagramUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon}><Instagram size={14} /></a>}
                    {vendor.facebookUrl && <a href={vendor.facebookUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon}><Facebook size={14} /></a>}
                    {vendor.linkedinUrl && <a href={vendor.linkedinUrl} target="_blank" rel="noopener noreferrer" style={S.socialIcon}><Linkedin size={14} /></a>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Products header + view toggle */}
          <div style={S.productsHeader}>
            <div>
              <h2 style={S.productsTitle}>Products</h2>
              <p style={S.productsCount}>{activeProducts} listing{activeProducts !== 1 ? 's' : ''}</p>
            </div>
            <div style={S.viewToggle}>
              <button
                style={{ ...S.toggleBtn, ...(viewMode === 'grid' ? S.toggleBtnActive : {}) }}
                onClick={() => setViewMode('grid')}
                title="Grid view"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                style={{ ...S.toggleBtn, ...(viewMode === 'list' ? S.toggleBtnActive : {}) }}
                onClick={() => setViewMode('list')}
                title="List view"
                aria-pressed={viewMode === 'list'}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {vendor.products.length === 0 ? (
            <div style={S.emptyState}>
              <Package size={28} style={{ color: '#3a3a56', marginBottom: '0.65rem' }} />
              <p style={{ color: '#55556e', fontSize: '0.84rem' }}>No products listed yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {Object.entries(productsByCategory).map(([category, products]) => (
                <section key={category}>
                  <div style={S.categoryHead}>
                    <span style={S.categoryLabel}>{category}</span>
                    <div style={S.categoryLine} />
                    <span style={S.categoryCount}>{products.length}</span>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="vs-product-grid" style={S.productGrid}>
                      {products.map(p => <ProductCardGrid key={p.id} product={p} />)}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {products.map(p => <ProductCardList key={p.id} product={p} />)}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ── GRID CARD ─────────────────────────────────────────────────── */
function ProductCardGrid({ product }: { product: Product }) {
  const price = priceStr(product);
  return (
    <div style={G.card} className="vs-card">
      {product.isFeatured && <div style={G.featured}><Star size={9} fill="currentColor" /> Featured</div>}
      <div style={G.imageWrap}>
        {product.image ? (
          <Image src={product.image} alt={product.name} fill
            style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 50vw, 280px" />
        ) : (
          <div style={G.imageFallback}><Package size={20} color="#3a3a56" /></div>
        )}
      </div>
      <div style={G.body}>
        {product.template && (
          <Link href={`/marketplace?templateId=${product.template.id}`} style={G.reqTag}>
            {product.template.name}
          </Link>
        )}
        <h3 style={G.name}>{product.name}</h3>
        {product.description && <p style={G.desc}>{product.description}</p>}
        <div style={G.footer}>
          <span style={G.price}>{price}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={G.stat}><ShoppingCart size={10} /> {product._count.cartItems}</span>
            {product._count.reviews > 0 && <span style={G.stat}><Star size={10} /> {product._count.reviews}</span>}
          </div>
        </div>
        {product.url && (
          <a href={product.url} target="_blank" rel="noopener noreferrer" style={G.buyBtn}>
            Buy now <ExternalLink size={11} />
          </a>
        )}
      </div>
    </div>
  );
}

/* ── LIST CARD ─────────────────────────────────────────────────── */
function ProductCardList({ product }: { product: Product }) {
  const price = priceStr(product);
  return (
    <div style={L.card} className="vs-list-card">
      <div style={L.imageWrap}>
        {product.image ? (
          <Image src={product.image} alt={product.name} fill
            style={{ objectFit: 'cover' }} sizes="100px" />
        ) : (
          <div style={L.imageFallback}><Package size={18} color="#3a3a56" /></div>
        )}
        {product.isFeatured && <div style={L.featured}><Star size={9} fill="currentColor" /></div>}
      </div>
      <div style={L.body}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            {product.template && (
              <Link href={`/marketplace?templateId=${product.template.id}`} style={L.reqTag}>
                {product.template.name}
              </Link>
            )}
            <h3 style={L.name}>{product.name}</h3>
            {product.description && <p style={L.desc}>{product.description}</p>}
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' as const }}>
            <div style={L.price}>{price}</div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
              <span style={L.stat}><ShoppingCart size={10} /> {product._count.cartItems}</span>
              {product._count.reviews > 0 && <span style={L.stat}><Star size={10} /> {product._count.reviews}</span>}
            </div>
          </div>
        </div>
        {product.url && (
          <div style={{ marginTop: '0.65rem' }}>
            <a href={product.url} target="_blank" rel="noopener noreferrer" style={L.buyBtn}>
              Buy now <ExternalLink size={11} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────── */
function priceStr(p: Product) {
  const c = p.currency ? `${p.currency} ` : '';
  if (p.priceMin && p.priceMax) return `${c}${p.priceMin.toLocaleString()} – ${p.priceMax.toLocaleString()}`;
  if (p.price) return `${c}${p.price.toLocaleString()}`;
  return 'Contact for price';
}

/* ── CSS ───────────────────────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  a { text-decoration: none; color: inherit; }

  .vs-shell { display: grid; grid-template-columns: 260px 1fr; gap: 0; align-items: start; }
  .vs-sidebar { display: block; }
  .vs-mobile-header { display: none; }

  .vs-product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }

  .vs-card { transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s; }
  .vs-card:hover { transform: translateY(-2px); box-shadow: 0 10px 36px rgba(0,0,0,0.45); border-color: rgba(245,158,11,0.2) !important; }

  .vs-list-card { transition: border-color 0.15s, background 0.15s; }
  .vs-list-card:hover { border-color: rgba(245,158,11,0.18) !important; background: #161620 !important; }

  .vs-back:hover { color: #9494b0 !important; }

  @media (max-width: 860px) {
    .vs-shell { grid-template-columns: 1fr !important; }
    .vs-sidebar { display: none !important; }
    .vs-mobile-header { display: block !important; }
  }

  @media (max-width: 520px) {
    .vs-product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 0.65rem !important; }
  }
`;

/* ── Page-level styles ─────────────────────────────────────────── */
const S: Record<string, React.CSSProperties> = {
  page:           { minHeight: '100vh', background: '#08080f', fontFamily: "'Inter', sans-serif", color: '#f0f0f5' },
  topBar:         { padding: '1.1rem 1.5rem 0', maxWidth: 1140, margin: '0 auto' },
  backLink:       { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#55556e', transition: 'color 0.15s' },
  shell:          { maxWidth: 1140, margin: '0 auto', minHeight: 'calc(100vh - 60px)' },

  /* Sidebar */
  sidebar:        { position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '1.5rem 0' } as React.CSSProperties,
  sidebarInner:   { padding: '0 1.5rem' },
  vendorHead:     { display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' },
  logoWrap:       { position: 'relative', width: 56, height: 56, borderRadius: 13, overflow: 'hidden', background: '#18181f', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  logoFallback:   { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.06)' },
  vendorName:     { fontSize: '1rem', fontWeight: 700, color: '#f0f0f5', lineHeight: 1.3, letterSpacing: '-0.01em' },
  verifiedBadge:  { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: 100, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#34d399', fontSize: '0.66rem', fontWeight: 600 },
  divider:        { height: 1, background: 'rgba(255,255,255,0.06)', margin: '1rem 0' },
  statsRow:       { display: 'flex', alignItems: 'center', gap: '0' },
  stat:           { flex: 1, textAlign: 'center' as const },
  statVal:        { fontFamily: "'DM Mono', monospace", fontSize: '1.1rem', fontWeight: 700, color: '#f0f0f5' },
  statLbl:        { fontSize: '0.65rem', color: '#55556e', marginTop: '0.15rem', textTransform: 'uppercase' as const, letterSpacing: '0.07em' },
  statDivider:    { width: 1, height: 28, background: 'rgba(255,255,255,0.07)' },
  metaList:       { display: 'flex', flexDirection: 'column', gap: '0.55rem' },
  metaItem:       { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#9494b0' },
  websiteLink:    { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#818cf8', fontSize: '0.78rem' },
  sideLabel:      { fontSize: '0.62rem', fontWeight: 700, color: '#55556e', textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: '0.55rem' },
  aboutText:      { fontSize: '0.78rem', color: '#9494b0', lineHeight: 1.8, whiteSpace: 'pre-wrap' as const },
  socialsRow:     { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' as const },
  socialIcon:     { width: 30, height: 30, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9494b0', transition: 'all 0.15s' },

  /* Mobile header */
  mobileHeader:   { padding: '1.1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d14' },
  mobileVendorRow:{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '0.85rem' },
  mobileStatChip: { display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#9494b0' },
  accordionBtn:   { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderRadius: 9, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9494b0', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  accordionBody:  { marginTop: '0.65rem', padding: '0.85rem', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' },

  /* Main */
  main:           { padding: '1.5rem 1.75rem', minWidth: 0 },
  productsHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem' },
  productsTitle:  { fontSize: '1rem', fontWeight: 700, color: '#e2e2f0', letterSpacing: '-0.01em' },
  productsCount:  { fontSize: '0.72rem', color: '#55556e', marginTop: '0.15rem' },
  viewToggle:     { display: 'flex', gap: '0.2rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '0.2rem' },
  toggleBtn:      { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 6, background: 'transparent', border: 'none', color: '#55556e', cursor: 'pointer', transition: 'all 0.15s' },
  toggleBtnActive:{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24' },
  categoryHead:   { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem' },
  categoryLabel:  { fontSize: '0.72rem', fontWeight: 700, color: '#9494b0', textTransform: 'uppercase' as const, letterSpacing: '0.1em', whiteSpace: 'nowrap' as const },
  categoryLine:   { flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' },
  categoryCount:  { fontSize: '0.7rem', fontFamily: "'DM Mono', monospace", color: '#55556e', flexShrink: 0 },
  productGrid:    {},
  emptyState:     { textAlign: 'center' as const, padding: '4rem 2rem', color: '#55556e' },
};

/* ── Grid card styles ──────────────────────────────────────────── */
const G: Record<string, React.CSSProperties> = {
  card:        { background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', position: 'relative' as const },
  featured:    { position: 'absolute' as const, top: 8, right: 8, display: 'inline-flex', alignItems: 'center', gap: '0.2rem', padding: '0.18rem 0.5rem', borderRadius: 100, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.64rem', fontWeight: 700, zIndex: 1 },
  imageWrap:   { position: 'relative' as const, height: 150, background: 'rgba(255,255,255,0.02)' },
  imageFallback:{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  body:        { padding: '0.85rem' },
  reqTag:      { display: 'inline-flex', padding: '0.14rem 0.5rem', borderRadius: 100, fontSize: '0.65rem', fontWeight: 600, background: 'rgba(99,102,241,0.08)', color: '#818cf8', marginBottom: '0.4rem', border: '1px solid rgba(99,102,241,0.15)' },
  name:        { fontSize: '0.84rem', fontWeight: 600, color: '#f0f0f5', marginBottom: '0.3rem', lineHeight: 1.4 },
  desc:        { fontSize: '0.72rem', color: '#55556e', lineHeight: 1.6, marginBottom: '0.65rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const },
  footer:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' },
  price:       { fontFamily: "'DM Mono', monospace", fontSize: '0.84rem', fontWeight: 700, color: '#34d399' },
  stat:        { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', color: '#3a3a56' },
  buyBtn:      { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', width: '100%', padding: '0.5rem', borderRadius: 8, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.76rem', fontWeight: 700 },
};

/* ── List card styles ──────────────────────────────────────────── */
const L: Record<string, React.CSSProperties> = {
  card:         { display: 'flex', alignItems: 'flex-start', gap: '1rem', background: '#111118', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden', padding: '0' },
  imageWrap:    { position: 'relative' as const, width: 100, flexShrink: 0, alignSelf: 'stretch' as const, minHeight: 90, background: 'rgba(255,255,255,0.02)' },
  imageFallback:{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  featured:     { position: 'absolute' as const, top: 6, left: 6, width: 20, height: 20, borderRadius: 100, background: 'rgba(245,158,11,0.2)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  body:         { flex: 1, padding: '0.85rem 0.85rem 0.85rem 0', minWidth: 0 },
  reqTag:       { display: 'inline-flex', padding: '0.14rem 0.5rem', borderRadius: 100, fontSize: '0.65rem', fontWeight: 600, background: 'rgba(99,102,241,0.08)', color: '#818cf8', marginBottom: '0.35rem', border: '1px solid rgba(99,102,241,0.15)' },
  name:         { fontSize: '0.88rem', fontWeight: 600, color: '#f0f0f5', marginBottom: '0.25rem', lineHeight: 1.4 },
  desc:         { fontSize: '0.76rem', color: '#55556e', lineHeight: 1.6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const },
  price:        { fontFamily: "'DM Mono', monospace", fontSize: '0.9rem', fontWeight: 700, color: '#34d399' },
  stat:         { display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.66rem', color: '#3a3a56' },
  buyBtn:       { display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', borderRadius: 8, background: '#f59e0b', color: '#0a0a0f', fontSize: '0.76rem', fontWeight: 700 },
};