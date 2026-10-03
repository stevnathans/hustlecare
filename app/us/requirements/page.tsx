// app/us/requirements/page.tsx
//
// US market's requirement index/browse page — the entity page's own
// breadcrumb (app/us/requirements/[slug]/page.tsx) links here as its
// parent, so this page has to exist before that link is added, the same
// lesson Stage 0 already applied to the how-to-start card (never ship a
// breadcrumb/nav link to a route that isn't live yet). Otherwise
// identical in structure to app/requirements/page.tsx.

import { Metadata } from 'next';
import Link from 'next/link';
import { getIndexableRequirements } from '@/lib/requirement-data';

export const revalidate = 300;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const PAGE_URL = `${SITE_URL}/us/requirements`;

export async function generateMetadata(): Promise<Metadata> {
  const requirements = await getIndexableRequirements('US');
  const count = requirements.length;

  const title = `${count > 0 ? `${count} ` : ''}Business Requirements & Equipment Explained | HustleCare`;
  const description = `Browse ${count > 0 ? count : 'every'} business requirement in our database — equipment, software, and documents — with costs and which businesses in the US need each one.`;

  return {
    title,
    description,
    authors: [{ name: 'HustleCare' }],
    openGraph: {
      type: 'website',
      url: PAGE_URL,
      siteName: 'HustleCare',
      title,
      description,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@HustleCare',
      creator: '@HustleCare',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-snippet': -1 },
    },
    alternates: {
      canonical: PAGE_URL,
      languages: {
        'en-US': PAGE_URL,
        'en-KE': `${SITE_URL}/requirements`,
      },
    },
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
  };
}

export default async function USRequirementsIndexPage() {
  const requirements = await getIndexableRequirements('US');

  const grouped = requirements.reduce<Record<string, typeof requirements>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        '@id': `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/us` },
          { '@type': 'ListItem', position: 2, name: 'Requirements', item: PAGE_URL },
        ],
      },
      {
        '@type': 'CollectionPage',
        '@id': `${PAGE_URL}#page`,
        name: 'Business Requirements & Equipment',
        url: PAGE_URL,
        inLanguage: 'en-US',
        breadcrumb: { '@id': `${PAGE_URL}#breadcrumb` },
        ...(requirements.length > 0 && { numberOfItems: requirements.length }),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
            Business Requirements &amp; Equipment
          </h1>
          <p className="text-gray-600 max-w-2xl">
            {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} explained — what each one is,
            what it costs, and which types of businesses in the US need it.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {categories.length === 0 ? (
          <p className="text-gray-500">No requirements are published yet.</p>
        ) : (
          categories.map((category) => (
            <section key={category} aria-labelledby={`cat-${category}`}>
              <h2 id={`cat-${category}`} className="text-lg font-bold text-gray-900 mb-4">
                {category}
              </h2>
              <div className="flex flex-wrap gap-2">
                {grouped[category].map((r) => (
                  <Link
                    key={r.slug}
                    href={`/us/requirements/${r.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}