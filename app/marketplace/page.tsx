// app/marketplace/page.tsx
import { Metadata } from 'next';
import MarketplaceContent from './MarketplaceContent';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

export const metadata: Metadata = {
  title: 'Marketplace — Startup Equipment, Legal & Software | HustleCare',
  description: 'Browse vetted products and services from verified vendors to launch your business in Kenya — equipment, legal, software, and more.',
  alternates: { canonical: `${SITE_URL}/marketplace` },
};

export default function MarketplacePage() {
  return <MarketplaceContent />;
}