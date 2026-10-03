// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { getIndexableRequirementSlugs } from '@/lib/requirement-data';
import { fetchBusinessWithRequirements, groupRequirementsByCategory } from '@/lib/business-data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

// Same threshold used by the [category] page routes and the "View all"
// link on the main requirements pages — must stay in sync with those.
const CATEGORY_PAGE_THRESHOLD = 3;

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
    {
      url: `${SITE_URL}/requirements`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    // New (Stage 4) — the US requirement index, mirroring the KE one.
    {
      url: `${SITE_URL}/us/requirements`,
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

  // ── Dynamic requirement entity pages (Stage 2, extended in Stage 4) ───────
  // Filtered by getIndexableRequirementSlugs's anti-orphan rule — a
  // requirement only gets a sitemap entry if it has real content behind
  // it, the same bar the page's own generateStaticParams and notFound()
  // guard use. Stage 4 adds the US variant plus hreflang in both
  // directions — computed from two slug lists rather than an N+1 check
  // per slug, mirroring the eligibility-where-clause pattern already used
  // for business pages above.
  let requirementPages: MetadataRoute.Sitemap = [];
  let usRequirementPages: MetadataRoute.Sitemap = [];

  try {
    const [keSlugs, usSlugs] = await Promise.all([
      getIndexableRequirementSlugs('KE'),
      getIndexableRequirementSlugs('US'),
    ]);
    const usEligibleSet = new Set(usSlugs);

    requirementPages = keSlugs.map((slug) => ({
      url: `${SITE_URL}/requirements/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      ...(usEligibleSet.has(slug) && {
        alternates: {
          languages: {
            'en-KE': `${SITE_URL}/requirements/${slug}`,
            'en-US': `${SITE_URL}/us/requirements/${slug}`,
          },
        },
      }),
    }));

    usRequirementPages = usSlugs.map((slug) => ({
      url: `${SITE_URL}/us/requirements/${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
      alternates: {
        languages: {
          'en-KE': `${SITE_URL}/requirements/${slug}`,
          'en-US': `${SITE_URL}/us/requirements/${slug}`,
        },
      },
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch requirement slugs from DB:', error);
  }

  // ── Dynamic category-scoped checklist pages (Stage 4.5) ───────────────────
  // One entry per business × RequirementCategory pair that clears
  // CATEGORY_PAGE_THRESHOLD, for each market independently — a business's
  // category composition can differ by market (different requirements are
  // visible per market), so KE and US are computed separately rather than
  // assumed to mirror each other. Mirrors exactly the generateStaticParams
  // logic in the two [category] page routes; kept in sync manually since
  // sitemap generation and static-param generation run at different times
  // and via different Next.js entry points.
  let categoryChecklistPages: MetadataRoute.Sitemap = [];

  try {
    const [keBusinesses, usBusinesses] = await Promise.all([
      prisma.business.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.business.findMany({ where: { published: true, ...US_ELIGIBLE_WHERE }, select: { slug: true, updatedAt: true } }),
    ]);

    const keEntries: MetadataRoute.Sitemap = [];
    for (const { slug, updatedAt } of keBusinesses) {
      const business = await fetchBusinessWithRequirements(slug, 'KE');
      if (!business) continue;
      const groups = groupRequirementsByCategory(business.requirements ?? []);
      for (const group of Object.values(groups)) {
        if (group.slug && group.items.length >= CATEGORY_PAGE_THRESHOLD) {
          keEntries.push({
            url: `${SITE_URL}/businesses/${slug}/requirements/${group.slug}`,
            lastModified: updatedAt,
            changeFrequency: 'weekly',
            priority: 0.65,
          });
        }
      }
    }

    const usEntries: MetadataRoute.Sitemap = [];
    for (const { slug, updatedAt } of usBusinesses) {
      const business = await fetchBusinessWithRequirements(slug, 'US');
      if (!business) continue;
      const groups = groupRequirementsByCategory(business.requirements ?? []);
      for (const group of Object.values(groups)) {
        if (group.slug && group.items.length >= CATEGORY_PAGE_THRESHOLD) {
          usEntries.push({
            url: `${SITE_URL}/us/businesses/${slug}/requirements/${group.slug}`,
            lastModified: updatedAt,
            changeFrequency: 'weekly',
            priority: 0.65,
          });
        }
      }
    }

    categoryChecklistPages = [...keEntries, ...usEntries];
  } catch (error) {
    console.error('Sitemap: failed to build category checklist entries:', error);
  }

  // ── Dynamic category pages (BusinessCategory — the consumer browsing
  // taxonomy, e.g. /businesses/categories/retail) ──────────────────────────
  // Unrelated to the RequirementCategory checklist pages above — see the
  // SEO architecture doc, Section 16, on why these two taxonomies don't
  // conflict.
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
    ...usRequirementPages,
    ...categoryChecklistPages,
    ...categoryPages,
  ];
}