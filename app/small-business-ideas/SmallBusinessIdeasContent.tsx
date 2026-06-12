'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EnhancedBusinessCard from '@/components/business/EnhancedBusinessCard';
import {
  Store,
  ArrowRight,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Requirement {
  id: number;
  templateId?: number;
  name: string;
  category: string | null;
  necessity: string;
  image: string | null;
}

interface Business {
  id: number;
  name: string;
  slug: string;
  image?: string;
  description?: string | null;
  category?: string | null;
  timeToLaunchMin?: number | null;
  timeToLaunchMax?: number | null;
  profitPotential?: string | null;
  skillLevel?: string | null;
  bestLocations?: string[];
  groupedRequirements: Record<string, Requirement[]>;
}

interface Category {
  id: number;
  name: string;
  slug?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatCostShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function formatDaysShort(days: number) {
  if (days < 7) return `${days}d`;
  const w = Math.round(days / 7);
  if (w < 4) return `${w}w`;
  return `${Math.round(days / 30)}mo`;
}

// ── Popular services (from ServicesClient) ────────────────────────────────────

const POPULAR_SERVICES = [
  { emoji: '📋', title: 'Business Plan Writing',   href: '/services/business-plan-writing' },
  { emoji: '⚖️', title: 'Business Registration',   href: '/services/business-registration' },
  { emoji: '🎨', title: 'Logo Design',              href: '/services/logo-design' },
  { emoji: '🌐', title: 'Website Creation',         href: '/services/website-creation' },
  { emoji: '📊', title: 'Financial Projections',    href: '/services/financial-projections' },
  { emoji: '🚀', title: 'Pitch Deck Creation',      href: '/services/pitch-deck' },
];

// ── Insight display config ────────────────────────────────────────────────────

const SKILL_LABEL: Record<string, string> = { low: 'Beginner', moderate: 'Moderate', high: 'Expert' };
const PROFIT_LABEL: Record<string, string> = {
  low: 'Low', low_to_medium: 'Low–Med', medium: 'Medium', medium_to_high: 'Med–High', high: 'High',
};
const PROFIT_COLOR: Record<string, string> = {
  low: 'bg-red-50 text-red-600', low_to_medium: 'bg-orange-50 text-orange-600',
  medium: 'bg-yellow-50 text-yellow-700', medium_to_high: 'bg-lime-50 text-lime-700', high: 'bg-emerald-50 text-emerald-700',
};
const SKILL_COLOR: Record<string, string> = {
  low: 'bg-emerald-50 text-emerald-700', moderate: 'bg-yellow-50 text-yellow-700', high: 'bg-red-50 text-red-600',
};

// ── Cost cell ─────────────────────────────────────────────────────────────────

interface CostCellProps { slug: string; mobile?: boolean; }

function CostCell({ slug, mobile }: CostCellProps) {
  const [cost, setCost] = useState<{ low: number; high: number; hasPricing: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/businesses/${slug}/cost`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setCost(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <span className="inline-block h-4 w-20 bg-gray-200 rounded animate-pulse" />;
  if (!cost?.hasPricing) return <span className="text-gray-300">—</span>;
  const text = `KES ${formatCostShort(cost.low)} – ${formatCostShort(cost.high)}`;
  return mobile
    ? <p className="text-sm font-bold text-gray-900">{text}</p>
    : <span className="font-semibold text-gray-900">{text}</span>;
}

// ── Summary table ─────────────────────────────────────────────────────────────

interface SummaryTableProps { businesses: Business[]; loading: boolean; }

function SummaryTable({ businesses, loading }: SummaryTableProps) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_ROWS = 7;
  const visible = expanded ? businesses : businesses.slice(0, INITIAL_ROWS);
  const hasMore = businesses.length > INITIAL_ROWS;

  return (
    <section aria-labelledby="summary-table-heading" className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <h2 id="summary-table-heading" className="text-xl font-bold text-gray-900 mb-5">
          Summary of Small Business Ideas in Kenya
        </h2>

        {/* ── Desktop table ── */}
        <div className="hidden md:block rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-[280px]">Business</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Startup Cost</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Requirements</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Time to Launch</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Profit Potential</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Skill Level</th>
                <th className="px-4 py-3.5 w-[110px]" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 animate-pulse">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" /><div className="h-4 w-36 bg-gray-200 rounded" /></div></td>
                      {[...Array(5)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>)}
                      <td className="px-4 py-4"><div className="h-8 w-20 bg-gray-200 rounded-lg" /></td>
                    </tr>
                  ))
                : visible.map((biz, idx) => {
                    const reqCount = Object.values(biz.groupedRequirements).reduce((s, r) => s + r.length, 0);
                    const profitCfg = biz.profitPotential ? PROFIT_LABEL[biz.profitPotential] : null;
                    const profitColor = biz.profitPotential ? PROFIT_COLOR[biz.profitPotential] : '';
                    const skillLabel = biz.skillLevel ? SKILL_LABEL[biz.skillLevel] : null;
                    const skillColor = biz.skillLevel ? SKILL_COLOR[biz.skillLevel] : '';
                    const hasTime = biz.timeToLaunchMin != null && biz.timeToLaunchMax != null;
                    return (
                      <tr key={biz.id} className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${idx % 2 !== 0 ? 'bg-gray-50/40' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {biz.image
                              ? <Image src={biz.image} alt={biz.name} width={40} height={40} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                              : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100"><Store className="w-4 h-4 text-gray-400" /></div>
                            }
                            <Link href={`/businesses/${biz.slug}`} className="font-semibold text-gray-900 hover:text-emerald-700 transition-colors leading-snug">
                              {biz.name}
                            </Link>
                          </div>
                        </td>
                        <td className="px-4 py-4"><CostCell slug={biz.slug} /></td>
                        <td className="px-4 py-4"><span className="font-semibold text-gray-900">{reqCount}</span><span className="text-gray-400 ml-1">items</span></td>
                        <td className="px-4 py-4">
                          {hasTime
                            ? <span className="text-gray-700 font-medium">{formatDaysShort(biz.timeToLaunchMin!)} – {formatDaysShort(biz.timeToLaunchMax!)}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {profitCfg
                            ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${profitColor}`}>{profitCfg}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          {skillLabel
                            ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${skillColor}`}>{skillLabel}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-4 py-4">
                          <Link href={`/businesses/${biz.slug}/requirements`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap">
                            View <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
          {!loading && hasMore && (
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-center">
              <button onClick={() => setExpanded(e => !e)} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors">
                {expanded ? <><ChevronUp className="w-4 h-4" />Show Less</> : <><ChevronDown className="w-4 h-4" />See All {businesses.length} Businesses</>}
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden space-y-3">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" /><div className="h-4 w-36 bg-gray-200 rounded" /></div>
                  <div className="grid grid-cols-2 gap-2">{[...Array(4)].map((_, j) => <div key={j} className="h-8 bg-gray-100 rounded" />)}</div>
                </div>
              ))
            : visible.map((biz) => {
                const reqCount = Object.values(biz.groupedRequirements).reduce((s, r) => s + r.length, 0);
                const profitCfg = biz.profitPotential ? PROFIT_LABEL[biz.profitPotential] : null;
                const profitColor = biz.profitPotential ? PROFIT_COLOR[biz.profitPotential] : '';
                const skillLabel = biz.skillLevel ? SKILL_LABEL[biz.skillLevel] : null;
                const skillColor = biz.skillLevel ? SKILL_COLOR[biz.skillLevel] : '';
                const hasTime = biz.timeToLaunchMin != null && biz.timeToLaunchMax != null;
                return (
                  <div key={biz.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      {biz.image
                        ? <Image src={biz.image} alt={biz.name} width={36} height={36} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                        : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Store className="w-4 h-4 text-gray-400" /></div>
                      }
                      <Link href={`/businesses/${biz.slug}`} className="font-bold text-gray-900 text-sm hover:text-emerald-700 transition-colors flex-1">{biz.name}</Link>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
                      <div className="px-4 py-2.5"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Startup Cost</p><CostCell slug={biz.slug} mobile /></div>
                      <div className="px-4 py-2.5"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Requirements</p><p className="text-sm font-bold text-gray-900">{reqCount} <span className="text-gray-400 font-normal">items</span></p></div>
                      {hasTime && <div className="px-4 py-2.5"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Time to Launch</p><p className="text-sm font-semibold text-gray-700">{formatDaysShort(biz.timeToLaunchMin!)} – {formatDaysShort(biz.timeToLaunchMax!)}</p></div>}
                      {profitCfg && <div className="px-4 py-2.5"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Profit Potential</p><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${profitColor}`}>{profitCfg}</span></div>}
                      {skillLabel && <div className="px-4 py-2.5 col-span-2"><p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Skill Level</p><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${skillColor}`}>{skillLabel}</span></div>}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <Link href={`/businesses/${biz.slug}/requirements`} className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors">
                        View Requirements <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
          {!loading && hasMore && (
            <button onClick={() => setExpanded(e => !e)} className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2">
              {expanded ? <><ChevronUp className="w-4 h-4" />Show Less</> : <><ChevronDown className="w-4 h-4" />See All {businesses.length} Businesses</>}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  businesses: Business[];
  loading: boolean;
  categories: Category[];
  categoriesLoading: boolean;
}

function Sidebar({ businesses, loading, categories, categoriesLoading }: SidebarProps) {
  const TOC_INITIAL = 10;
  const [tocExpanded, setTocExpanded] = useState(false);
  const visibleBusinesses = tocExpanded ? businesses : businesses.slice(0, TOC_INITIAL);
  const hasMOreBusinesses = businesses.length > TOC_INITIAL;

  return (
    <aside className="space-y-6">

      {/* ── TOC: business list ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <h2 className="font-bold text-gray-900 text-sm">On This Page</h2>
        </div>

        {loading ? (
          <div className="px-5 py-3 space-y-2">
            {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${65 + (i % 3) * 10}%` }} />)}
          </div>
        ) : (
          <>
            <nav aria-label="Business ideas on this page" className="px-2 py-2">
              {/* Static anchors first */}
              <a href="#why-kenya" className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-emerald-700 transition-colors rounded-lg hover:bg-gray-50">
                About This Guide
              </a>
              <a href="#business-ideas" className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-emerald-700 transition-colors rounded-lg hover:bg-gray-50 mb-1">
                All Business Ideas
              </a>
              {/* Per-business links */}
              {visibleBusinesses.map((biz) => (
                <a
                  key={biz.id}
                  href={`#biz-${biz.slug}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors group"
                >
                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-emerald-500 flex-shrink-0 transition-colors" />
                  <span className="text-sm text-gray-600 group-hover:text-emerald-700 transition-colors leading-snug line-clamp-1">{biz.name}</span>
                </a>
              ))}
            </nav>
            {hasMOreBusinesses && (
              <div className="px-5 pb-3">
                <button
                  onClick={() => setTocExpanded(e => !e)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  {tocExpanded
                    ? <><ChevronUp className="w-3.5 h-3.5" />Show less</>
                    : <><ChevronDown className="w-3.5 h-3.5" />{businesses.length - TOC_INITIAL} more businesses</>}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Popular services ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <h2 className="font-bold text-gray-900 text-sm">Popular Services</h2>
          </div>
          <Link href="/services" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">
            All →
          </Link>
        </div>
        <ul className="divide-y divide-gray-50">
          {POPULAR_SERVICES.map((svc) => (
            <li key={svc.href}>
              <Link href={svc.href} className="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-base leading-none flex-shrink-0">{svc.emoji}</span>
                <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors flex-1 leading-snug">{svc.title}</span>
                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Popular categories (from DB) ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Popular Categories</h2>
          <Link href="/categories" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">All →</Link>
        </div>
        {categoriesLoading ? (
          <div className="px-5 py-3 space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {categories.map((cat) => {
              const slug = cat.slug || toSlug(cat.name);
              return (
                <li key={cat.id}>
                  <Link href={`/categories/${slug}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors group">
                    <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">{cat.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Vendor CTA ── */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl p-5 text-white shadow-md">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
          <Store className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-bold text-base mb-1 leading-snug">Are you a supplier or vendor?</h2>
        <p className="text-emerald-100 text-xs leading-relaxed mb-4">
          Get your products in front of thousands of Kenyan entrepreneurs actively launching businesses.
        </p>
        <Link href="/vendor/apply" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-sm">
          Apply as a Vendor <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Full directory ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 text-sm mb-1">Looking for more?</h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Browse our full directory of verified business ideas with requirements, costs, and guides.</p>
        <Link href="/businesses" className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors">
          Full Directory <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </aside>
  );
}

// ── Mobile sticky business picker ────────────────────────────────────────────

interface MobilePickerProps { businesses: Business[]; }

function MobileBusinessPicker({ businesses }: MobilePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (businesses.length === 0) return null;

  return (
    <div ref={ref} className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-2xl">
      {/* Dropdown list */}
      {open && (
        <div className="max-h-64 overflow-y-auto border-b border-gray-100 divide-y divide-gray-50">
          {businesses.map((biz) => (
            <a
              key={biz.id}
              href={`#biz-${biz.slug}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors"
            >
              {biz.image
                ? <Image src={biz.image} alt={biz.name} width={28} height={28} className="w-7 h-7 rounded-md object-cover flex-shrink-0 border border-gray-100" />
                : <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0"><Store className="w-3.5 h-3.5 text-gray-400" /></div>
              }
              <span className="text-sm font-medium text-gray-800 flex-1 leading-snug">{biz.name}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-white"
        aria-expanded={open}
        aria-label="Jump to a business idea"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Layers className="w-4 h-4 text-emerald-600" />
          Jump to a business idea
        </span>
        {open
          ? <ChevronDown className="w-4 h-4 text-gray-500" />
          : <ChevronUp className="w-4 h-4 text-gray-500" />
        }
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SmallBusinessIdeasContent() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);

  // Derive unique categories from the fetched businesses
  const categories: Category[] = (() => {
    const seen = new Map<string, Category>();
    businesses.forEach((b, i) => {
      if (b.category && !seen.has(b.category)) {
        seen.set(b.category, { id: i, name: b.category });
      }
    });
    return Array.from(seen.values());
  })();
  const categoriesLoading = loading;

  useEffect(() => {
    fetch('/api/small-business-ideas')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setBusinesses(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">

      {/* ── Intro prose ── */}
      <section id="why-kenya" className="bg-white border-b border-gray-100" aria-label="About small businesses in Kenya">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
          <div className="max-w-3xl">
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Kenya&apos;s entrepreneurial landscape is one of the most dynamic in Sub-Saharan Africa. With mobile money infrastructure that enables instant transactions, a growing urban middle class, and a government actively simplifying business registration through <strong>eCitizen</strong>, the barriers to entry have never been lower.
            </p>
            <p className="text-gray-600 text-base leading-relaxed mb-4">
              Whether you have <strong>KES 10,000 or KES 500,000</strong> in starting capital, there is a viable business model built for your budget. Below you will find the most recently verified business ideas on HustleCare — each with full requirements checklists, estimated startup costs in KES, time-to-launch estimates, and location guidance.
            </p>
            <p id="how-to-use" className="text-gray-600 text-base leading-relaxed">
              <strong>How to use this guide:</strong> Click <em>View Requirements</em> on any card to see the complete checklist of documents, equipment, and licences needed. Use the startup cost range to plan your budget, and check the skill level indicator to find ideas that match your background.
            </p>
          </div>
        </div>
      </section>

      {/* ── Summary table ── */}
      <SummaryTable businesses={businesses} loading={loading} />

      {/* ── Body: cards + sidebar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── Card list ── */}
          <main className="flex-1 min-w-0" aria-label="Latest small business ideas">
            <div id="business-ideas" className="flex items-center justify-between mb-6 scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900">Latest Small Business Ideas in Kenya</h2>
              {!loading && businesses.length > 0 && (
                <span className="text-sm text-gray-400 font-medium">{businesses.length} ideas</span>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-6" aria-busy="true">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="p-5 pb-3"><div className="h-6 w-48 bg-gray-200 rounded mb-2" /><div className="h-3 w-24 bg-gray-100 rounded" /></div>
                    <div className="px-5 pb-5 grid grid-cols-[192px_1fr] gap-5">
                      <div className="w-48 h-36 bg-gray-200 rounded-xl" />
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">{[...Array(4)].map((_, j) => <div key={j} className="h-16 bg-gray-100 rounded-xl" />)}</div>
                        <div className="h-10 bg-gray-200 rounded-xl" />
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-1 border-t border-gray-100"><div className="h-4 w-full bg-gray-100 rounded mb-1.5" /><div className="h-4 w-3/4 bg-gray-100 rounded" /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="bg-white rounded-2xl border border-red-100 p-10 text-center shadow-sm">
                <p className="text-gray-500 text-sm mb-4">Could not load business ideas. Please try again.</p>
                <button
                  onClick={() => { setError(false); setLoading(true); fetch('/api/small-business-ideas').then(r => r.json()).then(d => { setBusinesses(d); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Cards — each has an id anchor for the TOC/picker */}
            {!loading && !error && (
              <div className="space-y-6">
                {businesses.map((biz) => (
                  <div key={biz.id} id={`biz-${biz.slug}`} className="scroll-mt-6">
                    <EnhancedBusinessCard
                      id={biz.id}
                      name={biz.name}
                      slug={biz.slug}
                      image={biz.image}
                      description={biz.description}
                      category={biz.category ?? undefined}
                      groupedRequirements={biz.groupedRequirements}
                      timeToLaunchMin={biz.timeToLaunchMin}
                      timeToLaunchMax={biz.timeToLaunchMax}
                      profitPotential={biz.profitPotential}
                      skillLevel={biz.skillLevel}
                      bestLocations={biz.bestLocations ?? []}
                      requirements={[]}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            {!loading && !error && businesses.length > 0 && (
              <div className="mt-10 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 text-center shadow-md">
                <h2 className="text-xl font-bold text-white mb-2">Ready to explore more business ideas?</h2>
                <p className="text-emerald-100 text-sm mb-5 max-w-md mx-auto">
                  Browse our full directory of verified Kenyan business ideas — each with requirements, cost estimates, and step-by-step guidance.
                </p>
                <Link href="/businesses" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-sm text-sm">
                  Browse All Business Ideas <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </main>

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0 lg:sticky lg:top-6 lg:self-start">
            <Sidebar
              businesses={businesses}
              loading={loading}
              categories={categories}
              categoriesLoading={categoriesLoading}
            />
          </div>

        </div>
      </div>

      {/* ── Mobile sticky business picker ── */}
      <MobileBusinessPicker businesses={businesses} />

    </div>
  );
}