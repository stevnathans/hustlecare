// app/contact/page.tsx
import { Metadata } from 'next';
import ContactSection from './ContactSection';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const pageUrl = `${siteUrl}/contact`;

export const metadata: Metadata = {
  title: 'Contact Us | HustleCare',
  description:
    'Have a question or want to work together? Get in touch with the HustleCare team. We respond to all inquiries within 24 hours during business days.',
  keywords: 'contact HustleCare, business support, get in touch, HustleCare help',
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'HustleCare',
    title: 'Contact Us | HustleCare',
    description: 'Get in touch with the HustleCare team. We respond within 24 hours.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Contact Us | HustleCare',
    description: 'Get in touch with the HustleCare team. We respond within 24 hours.',
    site: '@HustleCare',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: { canonical: pageUrl },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact HustleCare',
  url: pageUrl,
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Contact', item: pageUrl },
    ],
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ContactSection />
    </>
  );
}