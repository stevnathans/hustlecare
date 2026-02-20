/* eslint-disable @typescript-eslint/no-unused-vars */
// app/businesses/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import BusinessesContent from "./BusinessesContent";
import { prisma } from "@/lib/prisma";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getBusinessCount(): Promise<number> {
  try {
    return await prisma.business.count();
  } catch {
    // If the DB call fails, fall back gracefully — no count shown
    return 0;
  }
}

function buildTitle(count: number): string {
  const year = new Date().getFullYear();
  if (count > 0) {
    return `${count} Best Business Opportunities to Start in ${year} | HustleCare`;
  }
  return `Best Business Opportunities to Start in ${year} | HustleCare`;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const count = await getBusinessCount();
  const title = buildTitle(count);
  const description =
    "Discover 100+ verified business opportunities with complete setup guides. Get step-by-step requirements, cost estimates, and launch timelines to start your dream business.";
  const url = "https://hustlecare.net/businesses";
  const ogImage = "https://hustlecare.net/images/og/business-opportunities-og.jpg";

  return {
    title,
    description,
    keywords:
      "business opportunities, start a business, entrepreneurship, small business ideas, business requirements",

    authors: [{ name: "HustleCare" }],
    creator: "HustleCare",
    publisher: "HustleCare",

    openGraph: {
      type: "website",
      url,
      siteName: "HustleCare",
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "Business opportunities on HustleCare" }],
      locale: "en_US",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      site: "@HustleCare",
      creator: "@HustleCare",
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    alternates: {
      canonical: url,
    },
  };
}

// ── Structured Data ───────────────────────────────────────────────────────────

async function getStructuredData() {
  const count = await getBusinessCount();
  const year = new Date().getFullYear();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: buildTitle(count),
    description:
      "Discover verified business opportunities with complete setup guides, cost estimates, and launch timelines.",
    url: "https://hustlecare.net/businesses",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://hustlecare.net/" },
        { "@type": "ListItem", position: 2, name: "Business Opportunities", item: "https://hustlecare.net/businesses" },
      ],
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function BusinessesPage() {
  const structuredData = await getStructuredData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-lg">Loading businesses...</p>
            </div>
          </div>
        }
      >
        <BusinessesContent />
      </Suspense>
    </>
  );
}