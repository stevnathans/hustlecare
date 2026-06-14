// app/vendor/apply/layout.tsx
// Provides static SEO metadata for the vendor application page.
// The page itself is a client component so metadata must live here.
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Vendor | Hustlecare Marketplace',
  description:
    'Apply to sell your products on Hustlecare and reach thousands of entrepreneurs starting their businesses across Kenya and East Africa.',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    url: 'https://www.hustlecare.com/vendor/apply',
    title: 'Become a Vendor | Hustlecare Marketplace',
    description:
      'Apply to sell your products on Hustlecare and reach thousands of entrepreneurs starting their businesses across Kenya and East Africa.',
    siteName: 'Hustlecare',
  },
  twitter: {
    card: 'summary',
    title: 'Become a Vendor | Hustlecare Marketplace',
    description:
      'Apply to sell your products on Hustlecare and reach thousands of entrepreneurs starting their businesses across Kenya and East Africa.',
  },
  alternates: {
    canonical: 'https://www.hustlecare.com/vendor/apply',
  },
};

export default function VendorApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}