// app/sitemap.ts
import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

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
      url: `${SITE_URL}/services`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/categories`,
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

  // ── Dynamic business pages ──────────────────────────────────────────────────
  // Each business produces:
  //   /businesses/[slug]              — hub / overview         priority 0.85
  //   /businesses/[slug]/requirements — requirements checklist priority 0.80
  //
  // Add more sub-pages here as you build them out, e.g.:
  //   /businesses/[slug]/how-to-start
  //   /businesses/[slug]/costs
  //   /businesses/[slug]/success-stories
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
      // Hub page — slightly higher priority than sub-pages
      {
        url: `${SITE_URL}/businesses/${business.slug}`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.85,
      },
      // Requirements sub-page
      {
        url: `${SITE_URL}/businesses/${business.slug}/requirements`,
        lastModified: business.updatedAt,
        changeFrequency: 'weekly' as const,
        priority: 0.80,
      },
    ]);
  } catch (error) {
    console.error('Sitemap: failed to fetch businesses from DB:', error);
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
      url: `${SITE_URL}/categories/${cat.name
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

  return [...staticPages, ...businessPages, ...categoryPages];
}