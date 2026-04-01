// app/businesses/[slug]/HubPageContent.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  DollarSign,
  BookOpen,
  Star,
  CheckCircle2,
  Circle,
  ChevronRight,
  Layers,
  Tag,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PreviewRequirement {
  id: number;
  name: string;
  category: string | null;
  necessity: string;
  image: string | null;
}

interface CategoryBreakdown {
  name: string;
  count: number;
  requiredCount: number;
}

interface HubPageContentProps {
  slug: string;
  name: string;
  description: string | null | undefined;
  image: string | null | undefined;
  category: string | undefined;
  requirementCount: number;
  categoryBreakdown: CategoryBreakdown[];
  previewRequirements: PreviewRequirement[];
}

// ── Sub-page definitions ──────────────────────────────────────────────────────

function getSubPages(slug: string) {
  return [
    {
      href: `/businesses/${slug}/requirements`,
      icon: FileText,
      label: 'Requirements Checklist',
      description: 'Full list of everything you need — documents, equipment, licences, and more.',
      badge: null,
      color: 'emerald',
      available: true,
    },
    {
      href: `/businesses/${slug}/costs`,
      icon: DollarSign,
      label: 'Startup Cost Calculator',
      description: 'Detailed cost breakdown per requirement with low / medium / high estimates in KES.',
      badge: 'Coming soon',
      color: 'blue',
      available: false,
    },
    {
      href: `/businesses/${slug}/how-to-start`,
      icon: BookOpen,
      label: 'How to Start Guide',
      description: 'Step-by-step walkthrough — registration, sourcing, hiring, and first customers.',
      badge: 'Coming soon',
      color: 'violet',
      available: false,
    },
    {
      href: `/businesses/${slug}/success-stories`,
      icon: Star,
      label: 'Success Stories',
      description: 'Real Kenyan entrepreneurs share how they built their business from scratch.',
      badge: 'Coming soon',
      color: 'amber',
      available: false,
    },
  ];
}

// ── Color map ─────────────────────────────────────────────────────────────────

const COLOR = {
  emerald: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    icon: 'text-emerald-600',
    text: 'text-emerald-700',
    hover: 'hover:border-emerald-400 hover:bg-emerald-50/80',
    arrow: 'text-emerald-500',
  },
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    icon: 'text-blue-600',
    text: 'text-blue-700',
    hover: 'hover:border-blue-300',
    arrow: 'text-blue-400',
  },
  violet: {
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
    icon: 'text-violet-600',
    text: 'text-violet-700',
    hover: 'hover:border-violet-300',
    arrow: 'text-violet-400',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    icon: 'text-amber-600',
    text: 'text-amber-700',
    hover: 'hover:border-amber-300',
    arrow: 'text-amber-400',
  },
} as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function HubPageContent({
  slug,
  name,
  description,
  image,
  category,
  requirementCount,
  categoryBreakdown,
  previewRequirements,
}: HubPageContentProps) {
  const subPages = getSubPages(slug);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/businesses" className="inline-flex items-center gap-1 hover:text-emerald-600 transition-colors group">
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              All businesses
            </Link>
            {category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/businesses?category=${encodeURIComponent(category)}`}
                  className="hover:text-emerald-600 transition-colors"
                >
                  {category}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-600 font-medium">{name}</span>
          </nav>

          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Business image */}
            <div className="flex-shrink-0">
              {image ? (
                <Image
                  src={image}
                  alt={`${name} business`}
                  width={200}
                  height={200}
                  className="w-36 h-36 md:w-44 md:h-44 rounded-2xl object-cover shadow-md"
                />
              ) : (
                <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center shadow-md">
                  <FileText className="w-12 h-12 text-emerald-400" />
                </div>
              )}
            </div>

            {/* Business meta */}
            <div className="flex-1 min-w-0">
              {category && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-xs font-semibold text-emerald-700 mb-3">
                  <Tag className="w-3 h-3" />
                  {category}
                </div>
              )}

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-3">
                How to Start a {name} Business in Kenya
              </h1>

              <p className="text-gray-500 text-base leading-relaxed max-w-2xl mb-5">
                {description ||
                  `Everything you need to launch a ${name} business in Kenya — from licences and equipment to cost estimates and step-by-step guidance.`}
              </p>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-gray-800">{requirementCount}</span>
                  <span className="text-gray-500">requirements</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <Layers className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-gray-800">{categoryBreakdown.length}</span>
                  <span className="text-gray-500">categories</span>
                </div>
                {/* CTA */}
                <Link
                  href={`/businesses/${slug}/requirements`}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                >
                  View Full Checklist
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* ── Explore this business ── */}
        <section aria-labelledby="explore-heading">
          <h2 id="explore-heading" className="text-xl font-bold text-gray-900 mb-5">
            Explore this business
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subPages.map((page) => {
              const colors = COLOR[page.color as keyof typeof COLOR];
              const Icon = page.icon;

              if (!page.available) {
                return (
                  <div
                    key={page.href}
                    className={`relative flex items-start gap-4 p-5 bg-white border ${colors.border} rounded-2xl opacity-60 cursor-not-allowed`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-700 text-sm">{page.label}</span>
                        {page.badge && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                            {page.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 leading-snug">{page.description}</p>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`group relative flex items-start gap-4 p-5 bg-white border-2 ${colors.border} ${colors.hover} rounded-2xl transition-all duration-150 shadow-sm hover:shadow-md`}
                >
                  <div className={`w-10 h-10 rounded-xl ${colors.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className={`w-5 h-5 ${colors.icon}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-semibold ${colors.text} text-sm`}>{page.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{page.description}</p>
                  </div>
                  <ArrowRight className={`w-4 h-4 ${colors.arrow} flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform`} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Two-column: requirements preview + category breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Requirements preview — wider column */}
          <section aria-labelledby="preview-heading" className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 id="preview-heading" className="font-bold text-gray-900 text-base">
                  Sample Requirements
                </h2>
                <Link
                  href={`/businesses/${slug}/requirements`}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                >
                  View all {requirementCount}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <ul className="divide-y divide-gray-50">
                {previewRequirements.map((req) => (
                  <li key={req.id} className="flex items-center gap-4 px-6 py-4">
                    {req.necessity === 'Required' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{req.name}</p>
                      {req.category && (
                        <p className="text-xs text-gray-400 mt-0.5">{req.category}</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        req.necessity === 'Required'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {req.necessity}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Link
                  href={`/businesses/${slug}/requirements`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  View Full Requirements Checklist
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* Category breakdown — narrower column */}
          <section aria-labelledby="categories-heading" className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 id="categories-heading" className="font-bold text-gray-900 text-base">
                  Requirements by Type
                </h2>
              </div>
              <ul className="divide-y divide-gray-50 px-2 py-2">
                {categoryBreakdown.map((cat) => {
                  const pct = Math.round((cat.requiredCount / cat.count) * 100);
                  return (
                    <li key={cat.name} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                        <span className="text-xs text-gray-400">
                          {cat.count} item{cat.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {/* Required vs optional bar */}
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {cat.requiredCount} required · {cat.count - cat.requiredCount} optional
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        {/* ── Bottom CTA ── */}
        <section className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Ready to start your {name} business?
          </h2>
          <p className="text-emerald-100 mb-6 max-w-lg mx-auto text-sm">
            View the full requirements checklist, calculate your startup costs, and get everything in order before you launch.
          </p>
          <Link
            href={`/businesses/${slug}/requirements`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
          >
            View All {requirementCount} Requirements
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </div>
    </div>
  );
}