// lib/services/catalog.ts
//
// Reads the service catalog (Service / ServicePackage) for the public pages.
// Every function returns null / [] on any problem (no tables yet, database
// unreachable during a build, nothing imported yet) so the pages quietly fall
// back to the content already written in their own files. A page can never
// break because of the catalog.

import { prisma } from '@/lib/prisma';

/** "KSh 5,999" */
export function formatKsh(n: number): string {
  return `KSh ${Math.round(n).toLocaleString('en-US')}`;
}

function daysLabel(min: number | null, max: number | null): string {
  if (min && max && min !== max) return `${min}–${max} days`;
  const one = max ?? min;
  return one ? `${one} days` : '';
}

// The noun used in each pricing button: "Start Starter Plan", "Start Starter Website".
const CTA_NOUN: Record<string, string> = {
  'business-plan-writing': 'Plan',
  'website-creation': 'Website',
};

/** Shape the pricing cards on the service pages already use. */
export interface PricingPlan {
  id: string; // the package key, e.g. "starter"
  name: string;
  tag: string;
  price: string; // "KSh 5,999"
  items: string[];
  delivery: string; // "7–10 days"
  cta: string;
  popular: boolean;
  priceAmount: number;
  depositPercent: number;
}

export async function getCatalogPlans(serviceSlug: string): Promise<PricingPlan[] | null> {
  try {
    const service = await prisma.service.findUnique({
      where: { slug: serviceSlug },
      include: {
        packages: { where: { isActive: true }, orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }] },
      },
    });
    if (!service || !service.isActive || service.packages.length === 0) return null;

    return service.packages.map((p) => ({
      id: p.key,
      name: p.name,
      tag: p.tag ?? '',
      price: formatKsh(p.price),
      items: p.features,
      delivery: daysLabel(p.turnaroundMinDays, p.turnaroundMaxDays),
      cta: `Start ${p.name} ${CTA_NOUN[serviceSlug] ?? 'Order'}`,
      popular: p.isPopular,
      priceAmount: p.price,
      depositPercent: p.depositPercent,
    }));
  } catch (error) {
    console.error('[services] could not load packages for', serviceSlug, error);
    return null;
  }
}

/** Shape the cards on /services already use (category in lower case). */
export interface CatalogService {
  emoji: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  category: 'planning' | 'legal' | 'branding' | 'digital';
}

export async function getCatalogServices(): Promise<CatalogService[] | null> {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { id: 'asc' }],
    });
    if (services.length === 0) return null;

    return services.map((s) => ({
      emoji: s.emoji,
      title: s.name,
      desc: s.shortDescription,
      href: `/services/${s.slug}`,
      cta: s.ctaLabel,
      category: s.category.toLowerCase() as CatalogService['category'],
    }));
  } catch (error) {
    console.error('[services] could not load the catalog', error);
    return null;
  }
}