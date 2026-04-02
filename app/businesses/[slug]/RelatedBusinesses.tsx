// app/businesses/[slug]/RelatedBusinesses.tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowRight } from 'lucide-react';
import BusinessCard from '@/components/business/BusinessCards';

interface Props {
  categoryId: number;
  currentSlug: string;
  categoryName: string;
}

export default async function RelatedBusinesses({
  categoryId,
  currentSlug,
  categoryName,
}: Props) {
  const related = await prisma.business.findMany({
    where: {
      categoryId,
      published: true,
      slug: { not: currentSlug },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      requirements: {
        where: { isActive: true, template: { isDeprecated: false } },
        select: {
          template: {
            select: { name: true, category: true, necessity: true },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
    take: 6,
  });

  if (related.length === 0) return null;

  // Shape each business into what BusinessCard expects:
  // groupedRequirements: Record<categoryName, Requirement[]>
  const shaped = related.map((biz) => {
    const groupedRequirements = biz.requirements.reduce<
      Record<string, { id: number; name: string; category: string | null; necessity: string; image: null }[]>
    >((acc, link, idx) => {
      const cat = link.template.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        id: idx,
        name: link.template.name,
        category: link.template.category,
        necessity: link.template.necessity,
        image: null,
      });
      return acc;
    }, {});

    return {
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      image: biz.image ?? undefined,
      category: categoryName,
      groupedRequirements,
      sortedCategories: Object.keys(groupedRequirements),
      requirements: [],
    };
  });

  return (
    <section aria-labelledby="related-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 id="related-heading" className="text-xl font-bold text-gray-900">
            More {categoryName} Businesses
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Other businesses in the same category you might want to explore
          </p>
        </div>
        <Link
          href={`/businesses?category=${encodeURIComponent(categoryName)}`}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0"
        >
          View all
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Cards — same grid as the main /businesses page */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {shaped.map((biz) => (
          <BusinessCard
            key={biz.id}
            id={biz.id}
            name={biz.name}
            slug={biz.slug}
            image={biz.image}
            category={biz.category}
            groupedRequirements={biz.groupedRequirements}
            sortedCategories={biz.sortedCategories}
            requirements={[]}
          />
        ))}
      </div>

      {/* Mobile "view all" */}
      <div className="mt-5 sm:hidden text-center">
        <Link
          href={`/businesses?category=${encodeURIComponent(categoryName)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View all {categoryName} businesses
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </section>
  );
}