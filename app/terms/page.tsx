// app/terms/page.tsx
import { Metadata } from 'next';
import TermsOfService from './TermsOfService';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const pageUrl = `${siteUrl}/terms`;

export const metadata: Metadata = {
  title: 'Terms of Service | HustleCare',
  description:
    'Read the HustleCare Terms of Service to understand the rules and guidelines governing your use of our platform, tools, and services.',
  keywords: 'HustleCare terms of service, terms and conditions, user agreement, platform rules',
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'HustleCare',
    title: 'Terms of Service | HustleCare',
    description: 'Rules and guidelines governing your use of the HustleCare platform and services.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service | HustleCare',
    description: 'Rules and guidelines governing your use of the HustleCare platform.',
    site: '@HustleCare',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: pageUrl },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Terms of Service | HustleCare',
  description: 'Rules and guidelines governing use of the HustleCare platform and services.',
  url: pageUrl,
  dateModified: '2025-01-15',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Terms of Service', item: pageUrl },
    ],
  },
};

export default function TermsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <TermsOfService />
    </>
  );
}