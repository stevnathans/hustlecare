'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EnhancedBusinessCard from '@/components/business/EnhancedBusinessCard';
import {
  Store,
  ArrowRight,
  TrendingUp,
  Layers,
  Clock,
  Users,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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

// ── Sidebar sections ──────────────────────────────────────────────────────────

const TOC_ITEMS = [
  { label: 'Latest Business Ideas',  href: '#business-ideas' },
  { label: 'Why Start in Kenya?',    href: '#why-kenya' },
  { label: 'How to Use This Guide',  href: '#how-to-use' },
];

const POPULAR_CATEGORIES = [
  { name: 'Food & Beverage',    slug: 'food-beverage' },
  { name: 'Retail & Trade',     slug: 'retail-trade' },
  { name: 'Agriculture',        slug: 'agriculture' },
  { name: 'Technology',         slug: 'technology' },
  { name: 'Beauty & Wellness',  slug: 'beauty-wellness' },
  { name: 'Transport & Logistics', slug: 'transport-logistics' },
  { name: 'Education',          slug: 'education' },
  { name: 'Construction',       slug: 'construction' },
];

const QUICK_STATS = [
  { icon: TrendingUp, label: 'GDP growth',     value: '5.6%',  sub: 'Kenya 2024' },
  { icon: Users,      label: 'SME workforce',  value: '80%',   sub: 'of employment' },
  { icon: Store,      label: 'Registered SMEs',value: '7.4M+', sub: 'and growing' },
  { icon: Clock,      label: 'Days to register', value: '1–3', sub: 'via eCitizen' },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar() {
  return (
    <aside className="space-y-6 sticky top-24 self-start">

      {/* Table of contents */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-gray-900 text-sm">On This Page</h2>
        </div>
        <nav aria-label="Table of contents" className="px-5 py-3 space-y-1">
          {TOC_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 py-1.5 text-sm text-gray-600 hover:text-emerald-700 transition-colors group"
            >
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Quick stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Kenya Business Snapshot</h2>
        </div>
        <div className="grid grid-cols-2 gap-px bg-gray-100">
          {QUICK_STATS.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="bg-white px-4 py-3 flex flex-col gap-0.5">
              <Icon className="w-4 h-4 text-emerald-500 mb-1" />
              <span className="text-lg font-extrabold text-gray-900 leading-none">{value}</span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide leading-tight">{label}</span>
              <span className="text-[10px] text-gray-400">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Popular categories */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900 text-sm">Popular Categories</h2>
          <Link
            href="/categories"
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            All →
          </Link>
        </div>
        <ul className="divide-y divide-gray-50">
          {POPULAR_CATEGORIES.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/categories/${encodeURIComponent(cat.slug)}`}
                className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <span className="text-sm text-gray-700 group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 transition-colors" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Vendor CTA */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl p-5 text-white shadow-md">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
          <Store className="w-5 h-5 text-white" />
        </div>
        <h2 className="font-bold text-base mb-1 leading-snug">
          Are you a supplier or vendor?
        </h2>
        <p className="text-emerald-100 text-xs leading-relaxed mb-4">
          Get your products and services in front of thousands of Kenyan entrepreneurs actively looking to launch their businesses.
        </p>
        <Link
          href="/vendor/apply"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-sm"
        >
          Apply as a Vendor
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Browse all businesses */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-gray-900 text-sm mb-1">
          Looking for more?
        </h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Browse our full directory of verified business ideas with requirements, costs, and guides.
        </p>
        <Link
          href="/businesses"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
        >
          Full Directory
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </aside>
  );
}

// ── Summary table ─────────────────────────────────────────────────────────────

const SKILL_LABEL: Record<string, string> = {
  low:      'Beginner',
  moderate: 'Moderate',
  high:     'Expert',
};

const PROFIT_LABEL: Record<string, string> = {
  low:            'Low',
  low_to_medium:  'Low–Med',
  medium:         'Medium',
  medium_to_high: 'Med–High',
  high:           'High',
};

const PROFIT_COLOR: Record<string, string> = {
  low:            'bg-red-50 text-red-600',
  low_to_medium:  'bg-orange-50 text-orange-600',
  medium:         'bg-yellow-50 text-yellow-700',
  medium_to_high: 'bg-lime-50 text-lime-700',
  high:           'bg-emerald-50 text-emerald-700',
};

const SKILL_COLOR: Record<string, string> = {
  low:      'bg-emerald-50 text-emerald-700',
  moderate: 'bg-yellow-50 text-yellow-700',
  high:     'bg-red-50 text-red-600',
};

function formatCostShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

function formatDaysShort(days: number) {
  if (days < 7)  return `${days}d`;
  const w = Math.round(days / 7);
  if (w < 4)     return `${w}w`;
  return `${Math.round(days / 30)}mo`;
}

interface SummaryTableProps {
  businesses: Business[];
  loading: boolean;
}

function SummaryTable({ businesses, loading }: SummaryTableProps) {
  const [expanded, setExpanded] = useState(false);
  const INITIAL_ROWS = 7;
  const visible = expanded ? businesses : businesses.slice(0, INITIAL_ROWS);
  const hasMore = businesses.length > INITIAL_ROWS;

  return (
    <section
      aria-labelledby="summary-table-heading"
      className="bg-white border-b border-gray-100"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <h2
          id="summary-table-heading"
          className="text-xl font-bold text-gray-900 mb-5"
        >
          Summary of Small Business Ideas in Kenya
        </h2>

        {/* ── Desktop table ── */}
        <div className="hidden md:block rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-[260px]">Business</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Startup Cost</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Requirements</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Time to Launch</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Profit Potential</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Skill Level</th>
                <th className="px-4 py-3.5 w-[120px]" />
              </tr>
            </thead>
            <tbody>
              {loading
                ? [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-100 animate-pulse">
                      <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" /><div className="h-4 w-32 bg-gray-200 rounded" /></div></td>
                      {[...Array(6)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 w-16 bg-gray-100 rounded" /></td>)}
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
                      <tr
                        key={biz.id}
                        className={`border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/40'}`}
                      >
                        {/* Business name + thumbnail */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {biz.image ? (
                              <Image
                                src={biz.image}
                                alt={biz.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
                                <Store className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <Link
                              href={`/businesses/${biz.slug}`}
                              className="font-semibold text-gray-900 hover:text-emerald-700 transition-colors leading-snug"
                            >
                              {biz.name}
                            </Link>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-4">
                          {biz.category
                            ? <span className="text-gray-600">{biz.category}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Startup cost — fetched per-card by EnhancedBusinessCard; show placeholder here */}
                        <td className="px-4 py-4">
                          <CostCell slug={biz.slug} />
                        </td>

                        {/* Requirements count */}
                        <td className="px-4 py-4">
                          <span className="font-semibold text-gray-900">{reqCount}</span>
                          <span className="text-gray-400 ml-1">items</span>
                        </td>

                        {/* Time to launch */}
                        <td className="px-4 py-4">
                          {hasTime
                            ? <span className="text-gray-700 font-medium">{formatDaysShort(biz.timeToLaunchMin!)} – {formatDaysShort(biz.timeToLaunchMax!)}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Profit potential */}
                        <td className="px-4 py-4">
                          {profitCfg
                            ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${profitColor}`}>{profitCfg}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* Skill level */}
                        <td className="px-4 py-4">
                          {skillLabel
                            ? <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${skillColor}`}>{skillLabel}</span>
                            : <span className="text-gray-300">—</span>}
                        </td>

                        {/* CTA */}
                        <td className="px-4 py-4">
                          <Link
                            href={`/businesses/${biz.slug}/requirements`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap"
                          >
                            View
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>

          {/* See more / less toggle */}
          {!loading && hasMore && (
            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 flex items-center justify-center">
              <button
                onClick={() => setExpanded(e => !e)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                {expanded ? (
                  <><ChevronUp className="w-4 h-4" /> Show Less</>
                ) : (
                  <><ChevronDown className="w-4 h-4" /> See All {businesses.length} Businesses</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile card list ── */}
        <div className="md:hidden space-y-3">
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                    <div className="h-4 w-36 bg-gray-200 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[...Array(4)].map((_, j) => <div key={j} className="h-8 bg-gray-100 rounded" />)}
                  </div>
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
                    {/* Name row */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                      {biz.image ? (
                        <Image src={biz.image} alt={biz.name} width={36} height={36} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Store className="w-4 h-4 text-gray-400" /></div>
                      )}
                      <Link href={`/businesses/${biz.slug}`} className="font-bold text-gray-900 text-sm hover:text-emerald-700 transition-colors flex-1">
                        {biz.name}
                      </Link>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
                      <div className="px-4 py-2.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Startup Cost</p>
                        <CostCell slug={biz.slug} mobile />
                      </div>
                      <div className="px-4 py-2.5">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Requirements</p>
                        <p className="text-sm font-bold text-gray-900">{reqCount} <span className="text-gray-400 font-normal">items</span></p>
                      </div>
                      {hasTime && (
                        <div className="px-4 py-2.5">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Time to Launch</p>
                          <p className="text-sm font-semibold text-gray-700">{formatDaysShort(biz.timeToLaunchMin!)} – {formatDaysShort(biz.timeToLaunchMax!)}</p>
                        </div>
                      )}
                      {profitCfg && (
                        <div className="px-4 py-2.5">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Profit Potential</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${profitColor}`}>{profitCfg}</span>
                        </div>
                      )}
                      {skillLabel && (
                        <div className="px-4 py-2.5 col-span-2">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Skill Level</p>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${skillColor}`}>{skillLabel}</span>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                      <Link
                        href={`/businesses/${biz.slug}/requirements`}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
                      >
                        View Requirements <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}

          {/* Mobile see more */}
          {!loading && hasMore && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-emerald-300 hover:text-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              {expanded ? <><ChevronUp className="w-4 h-4" />Show Less</> : <><ChevronDown className="w-4 h-4" />See All {businesses.length} Businesses</>}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Cost cell — fetches from API per row ──────────────────────────────────────

interface CostCellProps { slug: string; mobile?: boolean; }

function CostCell({ slug, mobile }: CostCellProps) {
  const [cost, setCost]   = useState<{ low: number; high: number; hasPricing: boolean } | null>(null);
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

// ── Main component ────────────────────────────────────────────────────────────

export default function SmallBusinessIdeasContent() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);

  useEffect(() => {
    fetch('/api/small-business-ideas')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { setBusinesses(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Intro prose ───────────────────────────────────────────────── */}
      <section
  id="why-kenya"
  className="bg-white border-b border-gray-100"
  aria-label="About small businesses in Kenya"
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
    <div className="max-w-3xl">
      <p className="text-gray-600 text-base leading-relaxed mb-4">
        Kenya&apos;s small business sector plays a major role in creating jobs,
        supporting communities, and driving economic growth. Micro, Small, and
        Medium Enterprises (MSMEs) make up most of the businesses in the country,
        providing income opportunities for millions of Kenyans. According to
        <a
          href="https://www.centralbank.go.ke/uploads/banking_sector_reports/1809756600_2024%20Survey%20Report%20on%20MSME%20Access%20to%20Bank%20Credit.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline ml-1"
        >
          data from Kenya&apos;s MSME sector
        </a>
        , there are over 7 million MSMEs employing more than 14 million people,
        making them a key part of the economy. The sector also contributes
        significantly to Kenya&apos;s GDP and accounts for about 85% of non-farm
        employment, showing just how important small businesses are in everyday
        life.
      </p>

      <p className="text-gray-600 text-base leading-relaxed mb-4">
        From agribusiness and retail to digital services, manufacturing, and
        professional services, there are many small business ideas in Kenya with
        strong growth potential. The best opportunities often come from
        understanding customer needs, starting with available resources, and
        choosing a business that fits your skills and goals. According to
        <a
          href="https://new.knbs.or.ke/reports/2024-economic-survey/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline ml-1"
        >
          Kenya&apos;s economic reports
        </a>
        , entrepreneurship continues to be an important driver of economic
        activity and employment.
      </p>

      <p id="how-to-use" className="text-gray-600 text-base leading-relaxed">
        This guide explores practical and profitable small business ideas in
        Kenya to help you identify opportunities that match your budget,
        experience, and market demand. Click <strong>View Requirements</strong> on
        any card to see the complete checklist of documents, equipment, software,
        and licences needed. Use the startup cost estimates to plan your budget
        and compare ideas before starting your business.
      </p>
    </div>
  </div>
</section>

      {/* ── Summary table ─────────────────────────────────────────────── */}
      <SummaryTable businesses={businesses} loading={loading} />

      {/* ── Body: cards + sidebar ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* ── Card list (left / main) ── */}
          <main className="flex-1 min-w-0" aria-label="Latest small business ideas">

            <div
              id="business-ideas"
              className="flex items-center justify-between mb-6 scroll-mt-24"
            >
              <h2 className="text-xl font-bold text-gray-900">
                Latest Small Business Ideas in Kenya
              </h2>
              {!loading && businesses.length > 0 && (
                <span className="text-sm text-gray-400 font-medium">
                  {businesses.length} ideas
                </span>
              )}
            </div>

            {/* Loading skeletons */}
            {loading && (
              <div className="space-y-6" aria-busy="true" aria-label="Loading business ideas">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                    <div className="p-5 pb-3">
                      <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
                      <div className="h-3 w-24 bg-gray-100 rounded" />
                    </div>
                    <div className="px-5 pb-5 grid grid-cols-[192px_1fr] gap-5">
                      <div className="w-48 h-36 bg-gray-200 rounded-xl" />
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          {[...Array(4)].map((_, j) => (
                            <div key={j} className="h-16 bg-gray-100 rounded-xl" />
                          ))}
                        </div>
                        <div className="h-10 bg-gray-200 rounded-xl" />
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-1 border-t border-gray-100">
                      <div className="h-4 w-full bg-gray-100 rounded mb-1.5" />
                      <div className="h-4 w-3/4 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="bg-white rounded-2xl border border-red-100 p-10 text-center shadow-sm">
                <p className="text-gray-500 text-sm mb-4">
                  Could not load business ideas. Please try again.
                </p>
                <button
                  onClick={() => { setError(false); setLoading(true); fetch('/api/small-business-ideas').then(r => r.json()).then(d => { setBusinesses(d); setLoading(false); }).catch(() => { setError(true); setLoading(false); }); }}
                  className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Cards */}
            {!loading && !error && (
              <div className="space-y-6">
                {businesses.map((biz) => (
                  <EnhancedBusinessCard
                    key={biz.id}
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
                ))}
              </div>
            )}

            {/* Bottom CTA */}
            {!loading && !error && businesses.length > 0 && (
              <div className="mt-10 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 text-center shadow-md">
                <h2 className="text-xl font-bold text-white mb-2">
                  Ready to explore more business ideas?
                </h2>
                <p className="text-emerald-100 text-sm mb-5 max-w-md mx-auto">
                  Browse our full directory of verified Kenyan business ideas — each with requirements, cost estimates, and step-by-step guidance.
                </p>
                <Link
                  href="/businesses"
                  className="inline-flex items-center gap-2 px-7 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-sm text-sm"
                >
                  Browse All Business Ideas
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

          </main>

          {/* ── Sidebar (right) ── */}
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <Sidebar />
          </div>

        </div>
      </div>
    </div>
  );
}