// app/business/[slug]/not-found.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Business Not Found',
  description: 'The business you are looking for could not be found.',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-4">Business Not Found</h1>
      <p className="text-gray-600 mb-4">
        The business you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="space-x-4">
        <Link
          href="/" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Return to Home
        </Link>
        <Link 
          href="/businesses" 
          className="inline-block bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 transition-colors"
        >
          Browse All Businesses
        </Link>
      </div>
    </div>
  );
}