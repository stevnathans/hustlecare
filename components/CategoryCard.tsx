'use client';
import Link from 'next/link';
import {
  ShoppingBag, Cpu, Utensils, Heart, BookOpen, Home, Car, Plane,
  Music, Camera, Dumbbell, Leaf, Briefcase, Palette, Coffee, Globe,
  Scissors, Wrench, GraduationCap, Baby, PawPrint, Landmark, Shirt,
  Microscope, Hammer, Truck, Wifi, Package, Building2, ArrowUpRight,
} from 'lucide-react';

export type CategoryCardData = {
  id: number;
  name: string;
  slug?: string;
  createdAt: string;
  _count?: { businesses: number };
};

const CATEGORY_THEMES: { keywords: string[]; icon: React.ElementType }[] = [
  { keywords: ['retail', 'shop', 'store', 'market', 'commerce'],        icon: ShoppingBag   },
  { keywords: ['tech', 'software', 'digital', 'it', 'computer', 'ai'], icon: Cpu           },
  { keywords: ['food', 'restaurant', 'cafe', 'catering', 'beverage'],   icon: Utensils      },
  { keywords: ['health', 'medical', 'pharma', 'clinic', 'wellness'],    icon: Heart         },
  { keywords: ['education', 'school', 'training', 'course', 'tutor'],   icon: GraduationCap },
  { keywords: ['real estate', 'property', 'housing', 'home', 'rent'],   icon: Home          },
  { keywords: ['auto', 'car', 'vehicle', 'transport', 'motor'],         icon: Car           },
  { keywords: ['travel', 'tourism', 'hotel', 'hospitality'],            icon: Plane         },
  { keywords: ['music', 'audio', 'recording', 'entertainment'],         icon: Music         },
  { keywords: ['photo', 'media', 'studio', 'video', 'film'],            icon: Camera        },
  { keywords: ['fitness', 'gym', 'sport', 'yoga', 'exercise'],          icon: Dumbbell      },
  { keywords: ['farm', 'agri', 'garden', 'nature', 'organic', 'green'], icon: Leaf          },
  { keywords: ['consult', 'finance', 'legal', 'law', 'account'],        icon: Briefcase     },
  { keywords: ['art', 'design', 'creative', 'craft', 'gallery'],        icon: Palette       },
  { keywords: ['coffee', 'bakery', 'bar', 'lounge', 'snack'],           icon: Coffee        },
  { keywords: ['import', 'export', 'global', 'international', 'trade'], icon: Globe         },
  { keywords: ['salon', 'beauty', 'hair', 'spa', 'barber'],             icon: Scissors      },
  { keywords: ['repair', 'maintenance', 'service', 'mechanic'],         icon: Wrench        },
  { keywords: ['publish', 'book', 'library', 'news'],                   icon: BookOpen      },
  { keywords: ['child', 'baby', 'kid', 'toy', 'nursery'],               icon: Baby          },
  { keywords: ['pet', 'animal', 'vet', 'kennel'],                       icon: PawPrint      },
  { keywords: ['bank', 'insurance', 'invest', 'financial'],             icon: Landmark      },
  { keywords: ['fashion', 'cloth', 'apparel', 'textile', 'wear'],       icon: Shirt         },
  { keywords: ['research', 'lab', 'science', 'biotech'],                icon: Microscope    },
  { keywords: ['construct', 'build', 'engineer', 'architect'],          icon: Hammer        },
  { keywords: ['logistics', 'delivery', 'freight', 'courier'],          icon: Truck         },
  { keywords: ['telecom', 'internet', 'network', 'isp'],                icon: Wifi          },
  { keywords: ['wholesale', 'supply', 'manufacturer', 'product'],       icon: Package       },
];

export function getCategoryIcon(name: string): React.ElementType {
  const lower = name.toLowerCase();
  const match = CATEGORY_THEMES.find(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  );
  return match?.icon ?? Building2;
}

export type CategoryCardProps = {
  category: CategoryCardData;
  href?: string;
};

export default function CategoryCard({ category, href }: CategoryCardProps) {
  const count = category._count?.businesses ?? 0;
  const Icon = getCategoryIcon(category.name);

  const inner = (
    <div className="
      group w-full aspect-square p-5
      bg-gradient-to-br from-emerald-50 to-white
      rounded-2xl shadow-md
      hover:shadow-xl hover:scale-[1.02]
      transition-all duration-300 ease-out
      flex flex-col items-center justify-between
    ">
      {/* Icon */}
      <div className="
        w-14 h-14 rounded-full
        bg-emerald-50 text-emerald-600
        group-hover:bg-emerald-100 group-hover:text-emerald-700
        flex items-center justify-center
        transition-colors duration-200
      ">
        <Icon className="w-7 h-7" strokeWidth={1.75} />
      </div>

      {/* Category name */}
      <span className="font-medium text-gray-800 text-base text-center w-full truncate px-1">
        {category.name}
      </span>

      {/* Count + arrow badge */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full">
        <span>{count.toLocaleString()}</span>
        <ArrowUpRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block h-full">{inner}</Link>;
  return inner;
}