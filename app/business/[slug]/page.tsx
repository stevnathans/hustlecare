import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BusinessPageContent from './BusinessPageContent';

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Server-side function to fetch business data for metadata
async function fetchBusinessForMetadata(slug: string) {
  try {
    // Replace with your actual API endpoint or database query
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/${slug}`, {
      cache: 'force-cache', // Cache for better performance
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching business for metadata:', error);
    return null;
  }
}

// Server-side function to fetch all business slugs
async function fetchAllBusinessSlugs() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/businesses/slugs`, {
      cache: 'force-cache',
      next: { revalidate: 86400 }, // Revalidate daily
    });
    
    if (!response.ok) {
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching business slugs:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const business = await fetchBusinessForMetadata(slug);
    
    if (!business) {
      return {
        title: 'Business Not Found',
        description: 'The requested business could not be found.',
        robots: { index: false, follow: false },
      };
    }

    const title = `${business.name} Business in Kenya - Complete Requirements & Cost Calculations`;
    const description = business.description || 
      `Explore ${business.name} business requirements, pricing, and use our cost calculator to estimate your investment. Get detailed insights and planning tools.`;
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://yoursite.com';
    const pageUrl = `${siteUrl}/business/${slug}`;
    
    return {
      title,
      description,
      keywords: [
        business.name,
        'business requirements',
        'cost calculator',
        'business planning',
        'investment calculator',
        business.category || 'business',
        ...(business.tags || [])
      ].join(', '),
      
      authors: [{ name: 'Your Company Name' }],
      creator: 'Your Company Name',
      publisher: 'Your Company Name',
      
      // Open Graph metadata
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: 'Your Site Name',
        type: 'website',
        locale: 'en_US',
        images: [
          {
            url: business.image || `${siteUrl}/images/default-business.jpg`,
            width: 1200,
            height: 630,
            alt: `${business.name} business overview`,
          },
        ],
      },
      
      // Twitter Card metadata
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [business.image || `${siteUrl}/images/default-business.jpg`],
        creator: '@yourhandle',
        site: '@yourhandle',
      },
      
      // Additional SEO metadata
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      
      // Canonical URL
      alternates: {
        canonical: pageUrl,
      },
      
      // Additional metadata
      category: business.category || 'Business',
      classification: 'Business Directory',
      
      // Verification and other meta tags
      verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        // Add other verification codes as needed
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Business Page - Error',
      description: 'Business requirements and cost calculator',
      robots: { index: false, follow: false },
    };
  }
}

// Generate static params for better SEO and performance
export async function generateStaticParams() {
  try {
    const businesses = await fetchAllBusinessSlugs();
    
    return businesses.map((business: { slug: string }) => ({
      slug: business.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Main page component (Server Component)
export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  
  // Pre-fetch business data for faster client-side rendering
  let initialBusinessData = null;
  try {
    initialBusinessData = await fetchBusinessForMetadata(slug);
    if (!initialBusinessData) {
      notFound();
    }
  } catch (error) {
    console.error('Error pre-fetching business data:', error);
    notFound();
  }

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": initialBusinessData.name,
    "description": initialBusinessData.description || `${initialBusinessData.name} business requirements and cost calculator`,
    "url": `${process.env.NEXT_PUBLIC_SITE_URL}/business/${slug}`,
    "image": initialBusinessData.image || "/images/default-business.jpg",
    "aggregateRating": initialBusinessData.rating ? {
      "@type": "AggregateRating",
      "ratingValue": initialBusinessData.rating,
      "reviewCount": initialBusinessData.reviewCount || 1
    } : undefined,
    "address": initialBusinessData.address ? {
      "@type": "PostalAddress",
      "streetAddress": initialBusinessData.address.street,
      "addressLocality": initialBusinessData.address.city,
      "addressRegion": initialBusinessData.address.state,
      "postalCode": initialBusinessData.address.zip,
      "addressCountry": initialBusinessData.address.country || "US"
    } : undefined,
    "telephone": initialBusinessData.phone,
    "email": initialBusinessData.email,
    "openingHours": initialBusinessData.hours,
    "sameAs": initialBusinessData.socialLinks || [],
    "priceRange": initialBusinessData.priceRange,
    "paymentAccepted": initialBusinessData.paymentMethods || ["Cash", "Credit Card"],
    "currenciesAccepted": "USD"
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
      
      {/* Client Component */}
      <BusinessPageContent 
        params={params} 
        initialData={initialBusinessData}
      />
    </>
  );
}