// app/business/[slug]/not-found.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Business Not Found | HustleCare',
  description:
    'The business you are looking for could not be found. Browse our full list of businesses with startup guides and cost calculators.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      {/* Structured data: tell Google this is a well-formed error page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Business Not Found',
            description:
              'The requested business page could not be found on HustleCare.',
            url: 'https://hustlecare.net/business',
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: 'https://hustlecare.net',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Businesses',
                  item: 'https://hustlecare.net/businesses',
                },
              ],
            },
          }),
        }}
      />

      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        {/* Visible h1 — describes the page for both users and crawlers */}
        <h1 className="text-4xl font-bold mb-4 text-slate-900">
          Business Not Found
        </h1>
        <p className="text-gray-600 mb-2">
          The business you&apos;re looking for doesn&apos;t exist or has been
          moved.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Try browsing all available businesses or return to the homepage to
          find what you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/businesses"
            className="inline-block bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition-colors"
          >
            Browse All Businesses
          </Link>
          <Link
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </>
  );
}