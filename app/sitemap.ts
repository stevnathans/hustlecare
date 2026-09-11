// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getIndexableRequirementSlugs } from '@/lib/requirement-data';
import { DEFAULT_MARKET } from '@/lib/markets';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// Same condition used by generateStaticParams in
// app/us/businesses/[slug]/page.tsx and .../requirements/page.tsx, and by
// isUSMarketEligible() in lib/business-data.ts — a business only gets a US
// sitemap entry if it actually has at least one active, non-deprecated
// requirement visible in the US market. Keeps the sitemap from advertising
// near-empty US pages that the pages' own thin-content guards would 404.
const US_ELIGIBLE_WHERE = {
  requirements: {
    some: {
      isActive: true,
      template: {
        isDeprecated: false,
        OR: [{ restrictedToCountry: null }, { restrictedToCountry: 'US' as const }],
      },
    },
  },
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/businesses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/us/businesses`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    // New — the requirement entity index (Stage 2).
    {
      url: `${SITE_URL}/requirements`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/businesses/categories`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/faqs`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/cookie`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/gdpr`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];

  // ── Dynamic Kenya business pages ─────────────────────────────────────────────
  let businessPages: MetadataRoute.Sitemap = [];

  try {
    const businesses = await prisma.business.findMany({
      where: { published: true },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    businessPages = businesses.flatMap((business) => [
      {
        url: `${SITE_URL}/businesses/${business.slug}`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      },
      {
        url: `${SITE_URL}/businesses/${business.slug}/requirements`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.80,
      },
      {
        url: `${SITE_URL}/businesses/${business.slug}/how-to-start`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.80,
      },
    ]);
  } catch (error) {
    console.error('Sitemap: failed to fetch KE businesses from DB:', error);
  }

  // ── Dynamic US business pages ─────────────────────────────────────────────
  let usBusinessPages: MetadataRoute.Sitemap = [];

  try {
    const usBusinesses = await prisma.business.findMany({
      where: { published: true, ...US_ELIGIBLE_WHERE },
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    usBusinessPages = usBusinesses.flatMap((business) => [
      {
        url: `${SITE_URL}/us/businesses/${business.slug}`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
        alternates: {
          languages: {
            'en-KE': `${SITE_URL}/businesses/${business.slug}`,
            'en-US': `${SITE_URL}/us/businesses/${business.slug}`,
          },
        },
      },
      {
        url: `${SITE_URL}/us/businesses/${business.slug}/requirements`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.80,
        alternates: {
          languages: {
            'en-KE': `${SITE_URL}/businesses/${business.slug}/requirements`,
            'en-US': `${SITE_URL}/us/businesses/${business.slug}/requirements`,
          },
        },
      },
    ]);
  } catch (error) {
    console.error('Sitemap: failed to fetch US-eligible businesses from DB:', error);
  }

  // ── Dynamic requirement entity pages (Stage 2) ────────────────────────────
  // Filtered by getIndexableRequirementSlugs's anti-orphan rule — a
  // requirement only gets a sitemap entry if it has real content behind it
  // (an active business link or fee-schedule data), same bar the page's
  // own generateStaticParams and notFound() guard use.
  let requirementPages: MetadataRoute.Sitemap = [];

  try {
    const slugs = await getIndexableRequirementSlugs(DEFAULT_MARKET);
    requirementPages = slugs.map((slug) => ({
      url: `${SITE_URL}/requirements/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch requirement slugs from DB:', error);
  }

  // ── Dynamic category pages ──────────────────────────────────────────────────
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const categories = await prisma.businessCategory.findMany({
      select: {
        name: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    categoryPages = categories.map((cat) => ({
      url: `${SITE_URL}/businesses/categories/${cat.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`,
      lastModified: cat.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch categories from DB:', error);
  }

  return [
    ...staticPages,
    ...businessPages,
    ...usBusinessPages,
    ...requirementPages,
    ...categoryPages,
  ];
}