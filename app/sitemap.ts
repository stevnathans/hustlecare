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
    // Legal pages — low priority, rarely change, but should be crawlable
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
  let businessPages: MetadataRoute.Sitemap = [];

  try {
    const businesses = await prisma.business.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    businessPages = businesses.map((business) => ({
      url: `${SITE_URL}/business/${business.slug}`,
      lastModified: business.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch businesses from DB:', error);
  }

  // ── Dynamic category pages ──────────────────────────────────────────────────
  // If you have individual /categories/[slug] pages, fetch and include them.
  // Remove this block if categories don't have their own dedicated pages yet.
  let categoryPages: MetadataRoute.Sitemap = [];

  try {
    const categories = await prisma.business.findMany({
      select: { category: { select: { name: true } } },
      distinct: ['categoryId'],
      where: { categoryId: { not: null } },
    });

    categoryPages = categories
      .filter((c) => c.category)
      .map((c) => ({
        url: `${SITE_URL}/categories/${c.category!.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
  } catch (error) {
    console.error('Sitemap: failed to fetch categories from DB:', error);
  }

  return [...staticPages, ...businessPages, ...categoryPages];
}