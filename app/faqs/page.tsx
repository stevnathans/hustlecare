// app/faq/page.tsx
import { Metadata } from 'next';
import FaqContent from './FaqContent';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';
const pageUrl = `${siteUrl}/faq`;

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | HustleCare',
  description:
    'Find answers to common questions about HustleCare — how it works, business requirements, the cost calculator, marketplace, and user accounts.',
  keywords:
    'HustleCare FAQ, frequently asked questions, how to use HustleCare, business requirements help, cost calculator questions',
  openGraph: {
    type: 'website',
    url: pageUrl,
    siteName: 'HustleCare',
    title: 'Frequently Asked Questions | HustleCare',
    description:
      'Find answers about HustleCare — requirements, cost calculator, marketplace, and accounts.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Frequently Asked Questions | HustleCare',
    description: 'Everything you need to know about using HustleCare to kickstart your business.',
    site: '@HustleCare',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: pageUrl },
};

// FAQPage schema enables Google's expandable Q&A rich results in search
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'What is Hustlecare?', acceptedAnswer: { '@type': 'Answer', text: 'Hustlecare is a platform that helps aspiring business owners figure out everything they need to start a business — requirements, estimated costs, and where to get what they need.' } },
    { '@type': 'Question', name: 'How do I use Hustlecare?', acceptedAnswer: { '@type': 'Answer', text: 'Just search for a business idea. Hustlecare will show you a list of startup requirements, estimated costs, and related products you can buy.' } },
    { '@type': 'Question', name: 'Do I need an account to use Hustlecare?', acceptedAnswer: { '@type': 'Answer', text: "No. You can search, browse, and even estimate costs without signing up. However, you'll need an account to save your progress, download lists, or use the marketplace fully." } },
    { '@type': 'Question', name: 'Is it free to use?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, Hustlecare is free to use for planning and research. Some future features may require a subscription, but the core tools are free.' } },
    { '@type': 'Question', name: 'Where do the business requirements come from?', acceptedAnswer: { '@type': 'Answer', text: 'Our team researches and compiles requirement lists based on industry standards and common startup needs.' } },
    { '@type': 'Question', name: 'What is the cost calculator?', acceptedAnswer: { '@type': 'Answer', text: "It's a tool that lets you estimate how much it will cost to start a business based on selected products and services." } },
    { '@type': 'Question', name: 'Can I download the requirement list?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. After selecting a business, you can export the requirement list along with estimated costs as a PDF or spreadsheet.' } },
    { '@type': 'Question', name: 'Where do the products come from?', acceptedAnswer: { '@type': 'Answer', text: 'We partner with sellers and suppliers who provide tools, equipment, and services that match the business requirements.' } },
  ],
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'FAQ', item: pageUrl },
    ],
  },
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <FaqContent />
    </>
  );
}