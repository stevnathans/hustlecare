// app/our-story/page.tsx
import { Metadata } from 'next';
import OurStory from './OurStory';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const pageUrl = `${siteUrl}/our-story`;

export const metadata: Metadata = {
  title: 'Our Story | HustleCare',
  description:
    'Discover why we built HustleCare, the real-world problems we are solving for Kenyan entrepreneurs, and our mission to simplify the journey of starting a business.',
  keywords: 'HustleCare story, about hustlecare, Kenyan startups, business setup Kenya, entrepreneurs',
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'HustleCare',
    title: 'Our Story | HustleCare',
    description: 'The journey behind HustleCare and how we are empowering the next generation of business owners.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Our Story | HustleCare',
    description: 'The journey behind HustleCare and how we are empowering the next generation of business owners.',
    site: '@HustleCare',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: pageUrl },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Our Story | HustleCare',
  description: 'The narrative, mission, and vision driving the development of HustleCare for local business people.',
  url: pageUrl,
  dateModified: '2026-06-13',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Our Story', item: pageUrl },
    ],
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <OurStory />
    </>
  );
}