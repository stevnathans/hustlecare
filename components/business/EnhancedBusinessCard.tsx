// components/business/EnhancedBusinessCard.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight, FiFileText } from "react-icons/fi";
import {
  DollarSign,
  Clock,
  TrendingUp,
  Wrench,
  ExternalLink,
} from "lucide-react";
import { isExcludedFromTotals } from "@/lib/necessity";

// ── Types ─────────────────────────────────────────────────────────────────────

type Requirement = {
  id: number;
  templateId?: number;
  name: string;
  description?: string | null;
  image?: string | null;
  category?: string | null;
  necessity: string;
};

interface CostData {
  low: number;
  medium: number;
  high: number;
  requirementsWithProducts: number;
  totalRequirements: number;
  hasPricing: boolean;
}

type EnhancedBusinessCardProps = {
  id: string | number;
  name: string;
  image?: string;
  slug: string;
  category?: string;
  description?: string | null;
  requirements: Requirement[];
  groupedRequirements?: Record<string, Requirement[]>;
  timeToLaunchMin?: number | null;
  timeToLaunchMax?: number | null;
  profitPotential?: string | null;
  skillLevel?: string | null;
  bestLocations?: string[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function formatDays(days: number) {
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  return `${Math.round(days / 30)} month${Math.round(days / 30) !== 1 ? "s" : ""}`;
}

const PROFIT_CONFIG: Record<string, { label: string; filled: number; color: string }> = {
  low: { label: "Low", filled: 1, color: "bg-red-400" },
  low_to_medium: { label: "Low – Medium", filled: 2, color: "bg-orange-400" },
  medium: { label: "Medium", filled: 3, color: "bg-yellow-400" },
  medium_to_high: { label: "Medium – High", filled: 4, color: "bg-lime-500" },
  high: { label: "High", filled: 5, color: "bg-emerald-500" },
};

const SKILL_CONFIG: Record<string, { label: string; filled: number; color: string }> = {
  low: { label: "Beginner-friendly", filled: 1, color: "bg-emerald-500" },
  moderate: { label: "Moderate", filled: 2, color: "bg-yellow-400" },
  high: { label: "Expert required", filled: 3, color: "bg-red-400" },
};

// Dot rating bar (used inline inside table cells)
function DotBar({
  filled,
  total,
  color,
}: {
  filled: number;
  total: number;
  color: string;
}) {
  return (
    <span className="inline-flex gap-0.5 ml-2 align-middle">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full inline-block ${i < filled ? color : "bg-gray-200"}`}
        />
      ))}
    </span>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

interface RowProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  skeleton?: boolean;
}

function Row({ icon, label, children, skeleton }: RowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="py-2.5 pr-3 w-1/2">
        <span className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          {icon}
          {label}
        </span>
      </td>
      <td className="py-2.5 text-right">
        {skeleton ? (
          <span className="inline-block h-4 w-24 bg-gray-200 rounded animate-pulse" />
        ) : (
          <span className="text-sm font-bold text-gray-900">{children}</span>
        )}
      </td>
    </tr>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function EnhancedBusinessCard({
  name,
  image,
  slug,
  description,
  groupedRequirements = {},
  timeToLaunchMin,
  timeToLaunchMax,
  profitPotential,
  skillLevel,
}: EnhancedBusinessCardProps) {
  const [cost, setCost] = useState<CostData | null>(null);
  const [costLoading, setCostLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/businesses/${slug}/cost`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setCost(data);
        setCostLoading(false);
      })
      .catch(() => setCostLoading(false));
  }, [slug]);

  // Excludes Stock (and any future excluded-from-totals categories) — see
  // lib/necessity.ts: EXCLUDED_FROM_TOTALS_CATEGORIES. Matches the same
  // exclusion applied in BusinessCards.tsx and the requirements detail page.
  const totalRequirements = useMemo(
    () =>
      Object.entries(groupedRequirements).reduce(
        (sum, [category, reqs]) =>
          isExcludedFromTotals(category) ? sum : sum + (reqs?.length ?? 0),
        0,
      ),
    [groupedRequirements],
  );

  const hasTime = timeToLaunchMin != null && timeToLaunchMax != null;
  const profitCfg = profitPotential ? PROFIT_CONFIG[profitPotential] : null;
  const skillCfg = skillLevel ? SKILL_CONFIG[skillLevel] : null;

  const overviewHref = `/businesses/${slug}`;
  const requirementsHref = `/businesses/${slug}/requirements`;

  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-3 border-b border-gray-100">
        <div>
          <Link href={overviewHref} className="group/title">
            <h3 className="text-xl font-extrabold text-gray-900 group-hover/title:text-emerald-700 transition-colors leading-snug">
              {name}
            </h3>
          </Link>
        </div>
        <Link
          href={overviewHref}
          className="flex-shrink-0 mt-0.5 text-gray-300 hover:text-emerald-600 transition-colors"
          aria-label={`View ${name} overview`}
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Body: image + table ── */}
      <div className="px-6 py-5 flex flex-col sm:flex-row gap-5">
        {/* Image */}
        <Link
          href={overviewHref}
          className="relative flex-shrink-0 block rounded-xl overflow-hidden w-full sm:w-56 h-44 sm:h-auto"
          tabIndex={-1}
          aria-hidden="true"
        >
          {image ? (
            <>
              <Image
                src={image}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, 224px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full min-h-[11rem] bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <FiFileText className="w-5 h-5 text-gray-500" />
              </div>
              <span className="text-gray-400 text-xs font-medium">
                No Image
              </span>
            </div>
          )}
        </Link>

        {/* Insights table */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <table className="w-full border-collapse">
            <tbody>
              {/* Requirements count — always shown */}
              <Row
                icon={
                  <FiFileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                }
                label="Requirements"
              >
                {totalRequirements} items
              </Row>

              {/* Startup cost */}
              <Row
                icon={
                  <DollarSign className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                }
                label="Startup Cost"
                skeleton={costLoading}
              >
                {!costLoading &&
                  (cost?.hasPricing ? (
                    <>
                      {formatKES(cost.low)}
                      <span className="text-gray-400 font-normal"> – </span>
                      {formatKES(cost.high)}
                    </>
                  ) : (
                    <span className="text-gray-400 font-normal text-sm">
                      Not available
                    </span>
                  ))}
              </Row>

              {/* Time to launch */}
              {hasTime && (
                <Row
                  icon={
                    <Clock className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
                  }
                  label="Time to Launch"
                >
                  {formatDays(timeToLaunchMin!)}
                  <span className="text-gray-400 font-normal"> – </span>
                  {formatDays(timeToLaunchMax!)}
                </Row>
              )}

              {/* Profit potential */}
              {profitCfg && (
                <Row
                  icon={
                    <TrendingUp className="w-3.5 h-3.5 text-lime-600 flex-shrink-0" />
                  }
                  label="Profit Potential"
                >
                  {profitCfg.label}
                  <DotBar
                    filled={profitCfg.filled}
                    total={5}
                    color={profitCfg.color}
                  />
                </Row>
              )}

              {/* Skill level */}
              {skillCfg && (
                <Row
                  icon={
                    <Wrench className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                  }
                  label="Skill Level"
                >
                  {skillCfg.label}
                  <DotBar
                    filled={skillCfg.filled}
                    total={3}
                    color={skillCfg.color}
                  />
                </Row>
              )}
            </tbody>
          </table>

          {/* CTA */}
          <Link
            href={requirementsHref}
            className="relative overflow-hidden flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold text-white transition-colors group/btn"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <FiFileText className="w-3.5 h-3.5 relative flex-shrink-0" />
            <span className="relative">View Requirements</span>
            <FiArrowRight className="w-3.5 h-3.5 relative group-hover/btn:translate-x-0.5 transition-transform flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* ── Description ── */}
      {description && (
        <div className="px-6 pb-5 pt-0 border-t border-gray-100">
          <p className="text-sm text-gray-500 leading-relaxed pt-4">
            {description}
          </p>
        </div>
      )}

      {/* Hover border glow */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/0 group-hover:ring-emerald-500/20 transition-all duration-300 pointer-events-none" />
    </div>
  );
}