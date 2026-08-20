import { Metadata } from 'next';
import { Suspense } from 'react';
import MarketplaceContent from '../../marketplace/MarketplaceContent';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://hustlecare.net';

export const metadata: Metadata = {
  title: 'Verified Products To Start Your Business | HustleCare Marketplace',
  description:
    'Browse vetted products and services from verified vendors to launch your business in the US — equipment, software, and more.',
  alternates: {
    canonical: `${SITE_URL}/us/marketplace`,
  },
};

export default function USMarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketplaceContent market="US" />
    </Suspense>
  );
}