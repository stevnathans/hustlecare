// app/businesses/[slug]/BusinessInsights.tsx
'use client';

import {
  DollarSign,
  Clock,
  TrendingUp,
  Wrench,
  MapPin,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BusinessInsightsProps {
  name: string;
  costMin: number | null;
  costMax: number | null;
  timeToLaunchMin: number | null;
  timeToLaunchMax: number | null;
  profitPotential: string | null;
  skillLevel: string | null;
  bestLocations: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatKES(n: number) {
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

function formatDays(days: number) {
  if (days < 7) return `${days}d`;
  const weeks = Math.round(days / 7);
  if (weeks < 4) return `${weeks}w`;
  return `${Math.round(days / 30)}mo`;
}

// ── Profit / skill level display config ──────────────────────────────────────

const PROFIT_CONFIG: Record<string, { label: string; filled: number; color: string }> = {
  low:            { label: 'Low',            filled: 1, color: 'bg-red-400' },
  low_to_medium:  { label: 'Low–Medium',     filled: 2, color: 'bg-orange-400' },
  medium:         { label: 'Medium',         filled: 3, color: 'bg-yellow-400' },
  medium_to_high: { label: 'Medium–High',    filled: 4, color: 'bg-lime-500' },
  high:           { label: 'High',           filled: 5, color: 'bg-emerald-500' },
};

const SKILL_CONFIG: Record<string, { label: string; filled: number; color: string }> = {
  low:      { label: 'Beginner-friendly', filled: 1, color: 'bg-emerald-500' },
  moderate: { label: 'Moderate',          filled: 2, color: 'bg-yellow-400' },
  high:     { label: 'Expert required',   filled: 3, color: 'bg-red-400' },
};

function DotBar({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${i < filled ? color : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BusinessInsights({
  name,
  costMin,
  costMax,
  timeToLaunchMin,
  timeToLaunchMax,
  profitPotential,
  skillLevel,
  bestLocations,
}: BusinessInsightsProps) {
  const hasCost = costMin !== null && costMax !== null;
  const hasTime = timeToLaunchMin !== null && timeToLaunchMax !== null;
  const profitCfg = profitPotential ? PROFIT_CONFIG[profitPotential] : null;
  const skillCfg = skillLevel ? SKILL_CONFIG[skillLevel] : null;
  const hasLocations = bestLocations.length > 0;

  // Nothing to render
  if (!hasCost && !hasTime && !profitCfg && !skillCfg && !hasLocations) return null;

  return (
    <section aria-labelledby="insights-heading" className="bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2
          id="insights-heading"
          className="text-xl font-bold text-gray-900 mb-5 tracking-wide"
        >
          {name} Business at a Glance
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">

          {/* Cost range */}
          {hasCost && (
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Startup Cost</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {formatKES(costMin!)}
                <span className="text-gray-400 font-normal"> – </span>
                {formatKES(costMax!)}
              </p>
            </div>
          )}

          {/* Time to launch */}
          {hasTime && (
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Time to Launch</p>
              <p className="text-sm font-bold text-gray-900 leading-tight">
                {formatDays(timeToLaunchMin!)}
                <span className="text-gray-400 font-normal"> – </span>
                {formatDays(timeToLaunchMax!)}
              </p>
            </div>
          )}

          {/* Profit potential */}
          {profitCfg && (
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-lime-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-lime-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Profit Potential</p>
              <p className="text-sm font-bold text-gray-900">{profitCfg.label}</p>
              <DotBar filled={profitCfg.filled} total={5} color={profitCfg.color} />
            </div>
          )}

          {/* Skill level */}
          {skillCfg && (
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-violet-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Skill Level</p>
              <p className="text-sm font-bold text-gray-900">{skillCfg.label}</p>
              <DotBar filled={skillCfg.filled} total={3} color={skillCfg.color} />
            </div>
          )}

          {/* Best locations */}
          {hasLocations && (
            <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 col-span-2 sm:col-span-1">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xs text-gray-500 font-medium">Best Locations</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {bestLocations.map((loc) => (
                  <span
                    key={loc}
                    className="text-xs px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-medium"
                  >
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}