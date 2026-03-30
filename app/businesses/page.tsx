// app/businesses/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import BusinessesContent from "./BusinessesContent";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hustlecare.net";
const PAGE_URL = `${SITE_URL}/businesses`;
const OG_IMAGE = `${SITE_URL}/images/business-ideas-hustlecare.jpg`;

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getBusinessCount(): Promise<number> {
  try {
    return await prisma.business.count();
  } catch {
    return 0;
  }
}

function buildTitle(count: number): string {
  const year = new Date().getFullYear();
  if (count > 0) {
    return `${count} Profitable Business Ideas to Start in ${year} | HustleCare`;
  }
  return `Profitable Business Ideas to Start in ${year} | HustleCare`;
}

function buildDescription(count: number): string {
  const countLabel = count > 0 ? `${count}+` : "100+";
  return `Discover ${countLabel} verified profitable business ideas with complete setup guides, full list of requirements, startup cost estimates, and expert resources to launch your dream business in Kenya.`;
}

// ── SEO Metadata ──────────────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const count = await getBusinessCount();
  const title = buildTitle(count);
  const description = buildDescription(count);

  return {
    title,
    description,
    keywords: [
      "business opportunities Kenya",
      "start a business in Kenya",
      "best business ideas in Kenya",
      "profitable business ideas in Kenya",
      "entrepreneurship Kenya",
      "small business ideas Kenya",
      "business requirements checklist",
      "startup cost calculator",
      "how to start a business",
    ].join(", "),

    authors: [{ name: "HustleCare" }],
    creator: "HustleCare",
    publisher: "HustleCare",

    openGraph: {
      type: "website",
      url: PAGE_URL,
      siteName: "HustleCare",
      title,
      description,
      locale: "en_KE",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${count > 0 ? count : "100+"}  profitable business ideas on HustleCare`,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
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
      canonical: PAGE_URL,
    },

    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function BusinessesPage() {
  // Single DB call shared by both metadata and structured data
  const count = await getBusinessCount();
  const title = buildTitle(count);
  const description = buildDescription(count);

  // ── Structured Data ─────────────────────────────────────────────────────────
  // Using @graph so all nodes are linked and Google understands their
  // relationships — consistent with the business detail page pattern.
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Business Ideas", item: PAGE_URL },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${PAGE_URL}#page`,
        name: title,
        description,
        url: PAGE_URL,
        inLanguage: "en-KE",
        breadcrumb: { "@id": `${PAGE_URL}#breadcrumb` },
        author: {
          "@type": "Organization",
          name: "HustleCare",
          url: SITE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: "HustleCare",
          url: SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${SITE_URL}/images/logo.png`,
          },
        },
        // numberOfItems tells Google how many businesses the page lists
        ...(count > 0 && { numberOfItems: count }),
      },
    ],
  };

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