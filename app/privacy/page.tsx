// app/privacy/page.tsx
import { Metadata } from 'next';
import PrivacyPolicy from './PrivacyPolicy';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const pageUrl = `${siteUrl}/privacy`;

export const metadata: Metadata = {
  title: 'Privacy Policy | HustleCare',
  description:
    'Read the HustleCare Privacy Policy to understand how we collect, use, store, and protect your personal information when you use our platform.',
  keywords: 'HustleCare privacy policy, data protection, personal information, user privacy',
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'HustleCare',
    title: 'Privacy Policy | HustleCare',
    description: 'How HustleCare collects, uses, and protects your personal information.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy | HustleCare',
    description: 'How HustleCare collects, uses, and protects your personal information.',
    site: '@HustleCare',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: pageUrl },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy | HustleCare',
  description: 'How HustleCare collects, uses, stores, and protects your personal information.',
  url: pageUrl,
  dateModified: '2025-01-15',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Privacy Policy', item: pageUrl },
    ],
  },
};

export default function PrivacyPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PrivacyPolicy />
    </>
  );
}