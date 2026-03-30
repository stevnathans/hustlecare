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
      changeFrequency: 'daily',   // new businesses are added periodically
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
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
      changeFrequency: 'weekly',  // products and requirements update periodically
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: failed to fetch businesses from DB:', error);
    // Return static pages only — don't let a DB error break the whole sitemap
  }

  return [...staticPages, ...businessPages];
}