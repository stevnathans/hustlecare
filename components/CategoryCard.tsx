'use client';
import Link from 'next/link';
import {
  ShoppingBag, Utensils, Laptop, Scissors, Truck, Wrench,
  Heart, GraduationCap, Home, Leaf, Zap, Camera, Music,
  Package, Briefcase, DollarSign, Users, Globe, ArrowRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CategoryCardData {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  _count?: { businesses: number };
  businesses?: { id: number; name: string; slug: string }[];
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  retail:        ShoppingBag,
  food:          Utensils,
  restaurant:    Utensils,
  tech:          Laptop,
  technology:    Laptop,
  beauty:        Scissors,
  salon:         Scissors,
  logistics:     Truck,
  transport:     Truck,
  repair:        Wrench,
  health:        Heart,
  healthcare:    Heart,
  education:     GraduationCap,
  real:          Home,
  property:      Home,
  agriculture:   Leaf,
  farm:          Leaf,
  energy:        Zap,
  media:         Camera,
  photography:   Camera,
  music:         Music,
  events:        Music,
  manufacturing: Package,
  consulting:    Briefcase,
  finance:       DollarSign,
  community:     Users,
  online:        Globe,
};

export function getCategoryIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return Icon;
  }
  return Briefcase;
}

// ── Colour palettes for card headers ─────────────────────────────────────────

const HEADER_PALETTES = [
  { bg: 'bg-emerald-600', iconBg: 'bg-emerald-500', dot: 'bg-emerald-400', ring: 'ring-emerald-500' },
  { bg: 'bg-blue-600',    iconBg: 'bg-blue-500',    dot: 'bg-blue-400',    ring: 'ring-blue-500'    },
  { bg: 'bg-violet-600',  iconBg: 'bg-violet-500',  dot: 'bg-violet-400',  ring: 'ring-violet-500'  },
  { bg: 'bg-amber-500',   iconBg: 'bg-amber-400',   dot: 'bg-amber-300',   ring: 'ring-amber-400'   },
  { bg: 'bg-rose-600',    iconBg: 'bg-rose-500',    dot: 'bg-rose-400',    ring: 'ring-rose-500'    },
  { bg: 'bg-teal-600',    iconBg: 'bg-teal-500',    dot: 'bg-teal-400',    ring: 'ring-teal-500'    },
  { bg: 'bg-orange-500',  iconBg: 'bg-orange-400',  dot: 'bg-orange-300',  ring: 'ring-orange-400'  },
  { bg: 'bg-indigo-600',  iconBg: 'bg-indigo-500',  dot: 'bg-indigo-400',  ring: 'ring-indigo-500'  },
  { bg: 'bg-pink-600',    iconBg: 'bg-pink-500',    dot: 'bg-pink-400',    ring: 'ring-pink-500'    },
  { bg: 'bg-cyan-600',    iconBg: 'bg-cyan-500',    dot: 'bg-cyan-400',    ring: 'ring-cyan-500'    },
];

// ── CategoryCard ──────────────────────────────────────────────────────────────

interface CategoryCardProps {
  category: CategoryCardData;
  accentIndex: number;
}

export default function CategoryCard({ category, accentIndex }: CategoryCardProps) {
  const palette = HEADER_PALETTES[accentIndex % HEADER_PALETTES.length];
  const Icon = getCategoryIcon(category.name);
  const count = category._count?.businesses ?? 0;
  const businesses = category.businesses ?? [];

  const categoryHref = category.slug
    ? `/categories/${category.slug}`
    : `/categories/${category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

  return (
    <div className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 border border-gray-100 h-full">

      {/* ── Coloured header ── */}
      <Link href={categoryHref} className="block">
        <div className={`${palette.bg} px-5 pt-5 pb-4 relative overflow-hidden`}>
          {/* Subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
            aria-hidden="true"
          />

          <div className="relative flex items-start justify-between gap-3">
            {/* Icon */}
            <div className={`${palette.iconBg} w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>

            {/* Count pill */}
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex-shrink-0">
              <span className="text-white text-xs font-semibold tabular-nums">
                {count > 0 ? `${count} ${count === 1 ? 'business' : 'businesses'}` : 'No listings'}
              </span>
            </div>
          </div>

          {/* Category name */}
          <h3 className="relative mt-3 text-white font-bold text-lg leading-snug group-hover:underline underline-offset-2 decoration-white/60">
            {category.name}
          </h3>

          {/* Description if present */}
          {category.description && (
            <p className="relative mt-1 text-white/70 text-xs leading-relaxed line-clamp-2">
              {category.description}
            </p>
          )}
        </div>
      </Link>

      {/* ── Business list ── */}
      <div className="flex-1 flex flex-col px-5 pt-3 pb-4">
        {businesses.length > 0 ? (
          <ul className="flex flex-col divide-y divide-gray-50 flex-1">
            {businesses.slice(0, 5).map((biz) => (
              <li key={biz.id}>
                <Link
                  href={`/businesses/${biz.slug}`}
                  className="flex items-center gap-2.5 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group/biz"
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${palette.dot}`} />
                  <span className="truncate group-hover/biz:underline underline-offset-2">
                    {biz.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-300 italic py-3 flex-1">
            No businesses listed yet
          </p>
        )}

        {/* Footer */}
        {count > 0 && (
          <Link
            href={categoryHref}
            className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between group/footer"
          >
            <span className="text-xs font-semibold text-gray-400 group-hover/footer:text-gray-700 transition-colors">
              See all {count}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover/footer:text-gray-700 group-hover/footer:translate-x-0.5 transition-all" />
          </Link>
        )}
      </div>
    </div>
  );
}