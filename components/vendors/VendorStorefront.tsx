'use client';
// components/vendors/VendorStorefront.tsx
import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
  slug: string;
  name: string;
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

  // Claim-related fields
  userId: string | null;
  claimStatus: 'NONE' | 'PENDING' | 'REJECTED';
  claimRequestedById: string | null;
  claimRejectionReason: string | null;
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Back */}
      <div className="mx-auto max-w-[1140px] px-6 pt-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-emerald-600"
        >
          <ArrowLeft size={13} /> Marketplace
        </Link>
      </div>

      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-start lg:grid-cols-[260px_1fr]">
        {/* ── LEFT SIDEBAR (desktop only) ── */}
        <aside className="hidden max-h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-100 py-6 lg:sticky lg:top-16 lg:block">
          <div className="px-6">
            {/* Logo + name */}
            <div className="mb-5 flex items-center gap-3.5">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                {vendor.logo ? (
                  <Image src={vendor.logo} alt={vendor.name} fill style={{ objectFit: 'cover' }} sizes="56px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                    <Package size={22} className="text-emerald-500" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-base font-bold leading-snug tracking-tight text-gray-900">{vendor.name}</h1>
                {vendor.isVerified && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.66rem] font-semibold text-emerald-600">
                    <CheckCircle2 size={11} /> Verified
                  </span>
                )}
              </div>
            </div>

            <div className="my-4 h-px bg-gray-100" />

            {/* Stats */}
            <div className="flex items-center">
              <div className="flex-1 text-center">
                <div className="font-mono text-lg font-bold text-gray-900">{activeProducts}</div>
                <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-gray-400">Products</div>
              </div>
              <div className="h-7 w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <div className="font-mono text-lg font-bold text-gray-900">{totalReviews}</div>
                <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-gray-400">Reviews</div>
              </div>
              <div className="h-7 w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <div className="font-mono text-lg font-bold text-gray-900">{memberSince}</div>
                <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-gray-400">Since</div>
              </div>
            </div>

            <div className="my-4 h-px bg-gray-100" />

            {/* Contact info */}
            <div className="flex flex-col gap-2.5">
              {vendor.location && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={13} className="flex-shrink-0 text-gray-400" />
                  <span>{vendor.location}</span>
                </div>
              )}
              {vendor.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone size={13} className="flex-shrink-0 text-gray-400" />
                  <span>{vendor.phone}</span>
                </div>
              )}
              {vendor.website && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Globe size={13} className="flex-shrink-0 text-gray-400" />
                  <a
                    href={vendor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    {vendor.website.replace(/^https?:\/\//, '')}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            {/* About */}
            {vendor.description && (
              <>
                <div className="my-4 h-px bg-gray-100" />
                <div>
                  <div className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-gray-400">About</div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500">{vendor.description}</p>
                </div>
              </>
            )}

            {/* Socials */}
            {hasSocials && (
              <>
                <div className="my-4 h-px bg-gray-100" />
                <div>
                  <div className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-gray-400">Find us on</div>
                  <div className="flex flex-wrap gap-2">
                    {vendor.twitterUrl && <SocialIcon href={vendor.twitterUrl} label="Twitter / X"><Twitter size={14} /></SocialIcon>}
                    {vendor.instagramUrl && <SocialIcon href={vendor.instagramUrl} label="Instagram"><Instagram size={14} /></SocialIcon>}
                    {vendor.facebookUrl && <SocialIcon href={vendor.facebookUrl} label="Facebook"><Facebook size={14} /></SocialIcon>}
                    {vendor.linkedinUrl && <SocialIcon href={vendor.linkedinUrl} label="LinkedIn"><Linkedin size={14} /></SocialIcon>}
                  </div>
                </div>
              </>
            )}

            {/* Claim CTA — sidebar, right after socials */}
            <div className="my-4 h-px bg-gray-100" />
            <ClaimVendorCard vendor={vendor} />
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="min-w-0 px-5 py-6 sm:px-7">
          {/* Mobile vendor header */}
          <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:hidden">
            <div className="mb-3 flex items-center gap-3.5">
              <div className="relative h-13 w-13 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {vendor.logo ? (
                  <Image src={vendor.logo} alt={vendor.name} fill style={{ objectFit: 'cover' }} sizes="52px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-50">
                    <Package size={18} className="text-emerald-500" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-gray-900">{vendor.name}</h1>
                  {vendor.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.62rem] font-semibold text-emerald-600">
                      <CheckCircle2 size={10} /> Verified
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-3">
                  <span className="text-xs text-gray-500"><strong className="text-gray-700">{activeProducts}</strong> products</span>
                  <span className="text-xs text-gray-500"><strong className="text-gray-700">{totalReviews}</strong> reviews</span>
                  {vendor.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={10} /> {vendor.location}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* About accordion */}
            {vendor.description && (
              <button
                type="button"
                onClick={() => setAboutOpen(o => !o)}
                aria-expanded={aboutOpen}
                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-600"
              >
                <span>About {vendor.name}</span>
                {aboutOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
            {aboutOpen && vendor.description && (
              <div className="mt-2.5 rounded-lg border border-gray-200 bg-white p-3.5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-500">{vendor.description}</p>
                {hasSocials && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {vendor.twitterUrl && <SocialIcon href={vendor.twitterUrl} label="Twitter / X"><Twitter size={14} /></SocialIcon>}
                    {vendor.instagramUrl && <SocialIcon href={vendor.instagramUrl} label="Instagram"><Instagram size={14} /></SocialIcon>}
                    {vendor.facebookUrl && <SocialIcon href={vendor.facebookUrl} label="Facebook"><Facebook size={14} /></SocialIcon>}
                    {vendor.linkedinUrl && <SocialIcon href={vendor.linkedinUrl} label="LinkedIn"><Linkedin size={14} /></SocialIcon>}
                  </div>
                )}
              </div>
            )}

            {/* Claim CTA — mobile, below the header card */}
            <div className="mt-3">
              <ClaimVendorCard vendor={vendor} />
            </div>
          </div>

          {/* Products header + view toggle */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-gray-900">Products</h2>
              <p className="mt-0.5 text-xs text-gray-400">{activeProducts} listing{activeProducts !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List view"
                aria-pressed={viewMode === 'list'}
                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {vendor.products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
              <Package size={28} className="mx-auto mb-2.5 text-gray-300" />
              <p className="text-sm text-gray-400">No products listed yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {Object.entries(productsByCategory).map(([category, products]) => (
                <section key={category}>
                  <div className="mb-3.5 flex items-center gap-3">
                    <span className="whitespace-nowrap text-xs font-bold uppercase tracking-widest text-gray-500">
                      {category}
                    </span>
                    <div className="h-px flex-1 bg-gray-100" />
                    <span className="flex-shrink-0 font-mono text-xs text-gray-400">{products.length}</span>
                  </div>

                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-3">
                      {products.map(p => <ProductCardGrid key={p.id} product={p} />)}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
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

/* ── Claim CTA ─────────────────────────────────────────────────── */
function ClaimVendorCard({ vendor }: { vendor: Vendor }) {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (vendor.userId) return null; // already owned/claimed — nothing to show

  const userId = (session?.user as { id?: string } | undefined)?.id;
  const isMyPendingClaim = vendor.claimStatus === 'PENDING' && vendor.claimRequestedById === userId;
  const isMyRejectedClaim = vendor.claimStatus === 'REJECTED' && vendor.claimRequestedById === userId;
  const claimedByOtherPending = vendor.claimStatus === 'PENDING' && vendor.claimRequestedById !== userId;

  async function submitClaim() {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit claim.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted || isMyPendingClaim) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
        <p className="text-sm font-semibold text-emerald-700">Claim submitted</p>
        <p className="mt-0.5 text-xs leading-relaxed text-emerald-600">
          Our team is reviewing your request. We&rsquo;ll notify you once it&rsquo;s decided.
        </p>
      </div>
    );
  }

  if (claimedByOtherPending) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-3">
        <p className="text-xs leading-relaxed text-gray-500">A claim request for this business is currently under review.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 text-[0.62rem] font-bold uppercase tracking-widest text-gray-400">Is this you?</div>
      <p className="mb-3 text-xs leading-relaxed text-gray-500">
        This profile was set up by Hustlecare on this vendor&rsquo;s behalf. Claim it to manage your own products and storefront.
      </p>

      {isMyRejectedClaim && vendor.claimRejectionReason && (
        <p className="mb-3 text-xs text-red-500">Your last request wasn&rsquo;t approved: {vendor.claimRejectionReason}</p>
      )}
      {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

      {status === 'unauthenticated' ? (
        <Link
          href={`/signin?callbackUrl=/vendors/${vendor.slug}`}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Sign in to claim
        </Link>
      ) : open ? (
        <div>
          <textarea
            className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            rows={3}
            placeholder="Tell us how you're connected to this business (optional, speeds up review)…"
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={submitClaim}
              disabled={submitting}
              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit claim'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
        >
          Claim this business
        </button>
      )}
    </div>
  );
}

function SocialIcon({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-600"
    >
      {children}
    </a>
  );
}

/* ── GRID CARD ─────────────────────────────────────────────────── */
function ProductCardGrid({ product }: { product: Product }) {
  const price = priceStr(product);
  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg">
      {product.isFeatured && (
        <div className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[0.64rem] font-bold text-amber-700">
          <Star size={9} fill="currentColor" /> Featured
        </div>
      )}
      <div className="relative h-36 bg-gray-50 sm:h-40">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 50vw, 280px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={20} className="text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        {product.template && (
          <Link
            href={`/marketplace?templateId=${product.template.id}`}
            className="mb-1.5 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-semibold text-indigo-600"
          >
            {product.template.name}
          </Link>
        )}
        <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">{product.name}</h3>
        {product.description && (
          <p className="mb-2.5 text-xs leading-relaxed text-gray-400" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.description}
          </p>
        )}
        <div className="mb-2.5 flex items-center justify-between">
          <span className="font-mono text-sm font-bold text-emerald-600">{price}</span>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1 text-[0.65rem] text-gray-300">
              <ShoppingCart size={10} /> {product._count.cartItems}
            </span>
            {product._count.reviews > 0 && (
              <span className="inline-flex items-center gap-1 text-[0.65rem] text-gray-300">
                <Star size={10} /> {product._count.reviews}
              </span>
            )}
          </div>
        </div>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
          >
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
    <div className="flex items-stretch gap-4 overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors hover:border-emerald-200 hover:bg-gray-50/60">
      <div className="relative min-h-[90px] w-24 flex-shrink-0 bg-gray-50 sm:w-25">
        {product.image ? (
          <Image src={product.image} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="100px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package size={18} className="text-gray-300" />
          </div>
        )}
        {product.isFeatured && (
          <div className="absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <Star size={9} fill="currentColor" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1 py-3 pr-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {product.template && (
              <Link
                href={`/marketplace?templateId=${product.template.id}`}
                className="mb-1 inline-flex rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[0.65rem] font-semibold text-indigo-600"
              >
                {product.template.name}
              </Link>
            )}
            <h3 className="mb-1 text-sm font-semibold leading-snug text-gray-900">{product.name}</h3>
            {product.description && (
              <p className="text-xs leading-relaxed text-gray-400" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {product.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="font-mono text-sm font-bold text-emerald-600">{price}</div>
            <div className="mt-1.5 flex justify-end gap-2">
              <span className="inline-flex items-center gap-1 text-[0.66rem] text-gray-300">
                <ShoppingCart size={10} /> {product._count.cartItems}
              </span>
              {product._count.reviews > 0 && (
                <span className="inline-flex items-center gap-1 text-[0.66rem] text-gray-300">
                  <Star size={10} /> {product._count.reviews}
                </span>
              )}
            </div>
          </div>
        </div>
        {product.url && (
          <div className="mt-2.5">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
            >
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