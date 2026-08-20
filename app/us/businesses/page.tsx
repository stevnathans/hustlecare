// app/us/businesses/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import USBusinessesContent from "./BusinessesContent";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // regenerate at most every 5 minutes

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hustlecare.net";
const PAGE_URL = `${SITE_URL}/us/businesses`;
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
    return `${count} Small Business Ideas to Start in the US (${year}) | HustleCare`;
  }
  return `Small Business Ideas to Start in the US (${year}) | HustleCare`;
}

function buildDescription(count: number): string {
  const countLabel = count > 0 ? `${count}` : "Hundreds of";
  return `Discover ${countLabel} small business ideas to start in the US today. Each idea includes startup costs in USD, equipment and software checklists, and time-to-launch estimates — everything you need to launch with confidence.`;
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
      "small business ideas US",
      `business ideas United States ${new Date().getFullYear()}`,
      "profitable business ideas US",
      "top businesses to start in the US",
      "business opportunities United States",
      "start a business in the US",
      "entrepreneurship US",
      "startup ideas US",
      "business requirements checklist US",
      "how to start a business in the US",
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
      locale: "en_US",
      images: [
        {
          url: OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${count > 0 ? count : "Top"} small business ideas in the US on HustleCare`,
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

export default async function USBusinessesPage() {
  const count = await getBusinessCount();
  const title = buildTitle(count);
  const description = buildDescription(count);

  // ── Structured Data ─────────────────────────────────────────────────────────
  // FAQPage entries here must stay in sync with FAQ_ITEMS in BusinessesContent.tsx
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${PAGE_URL}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/us` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Business Ideas in the US",
            item: PAGE_URL,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${PAGE_URL}#page`,
        name: title,
        description,
        url: PAGE_URL,
        inLanguage: "en-US",
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
        ...(count > 0 && { numberOfItems: count }),
      },
      // FAQPage — mirrors FAQ_ITEMS in BusinessesContent.tsx
      // Keep both in sync if you update questions/answers.
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        "mainEntityOfPage": { "@id": `${PAGE_URL}#page` },
        mainEntity: [
          {
            "@type": "Question",
            name: "How much does it cost to start a small business in the US?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Startup costs vary widely by business type and state. A service-based business run from home can start with a modest amount of equipment and software, while a business needing a physical location, inventory, or specialized equipment will cost more. Each business page on our platform lists estimated startup costs based on the specific equipment and software you'll need.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need to register my business in the US?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Most businesses need to register with their state (as an LLC, corporation, or under a business name) and obtain an Employer Identification Number (EIN) from the IRS if they plan to hire employees or open a business bank account. Requirements vary by state and business type — check with your state's Secretary of State office for specifics.",
            },
          },
          {
            "@type": "Question",
            name: "What equipment and software do I need to start a business in the US?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "This depends heavily on your business type. Common needs include point-of-sale systems, accounting software, industry-specific equipment, and a website or online storefront. Each business idea on our platform lists a complete checklist of the equipment and software typically needed.",
            },
          },
          {
            "@type": "Question",
            name: "How long does it take to launch a business in the US?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A simple service-based business can often launch within a few weeks once you've registered and sourced your equipment. Businesses requiring a physical location, licensing, or specialized equipment can take longer. Each listing on our platform shows an estimated time-to-launch where available.",
            },
          },
          {
            "@type": "Question",
            name: "What are the best online businesses to start in the US?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Popular online businesses in the US include e-commerce stores, freelancing and consulting, content creation, virtual assistance, and software-as-a-service products. These typically require lower upfront capital and can often be started from home.",
            },
          },
        ],
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
        <USBusinessesContent />
      </Suspense>
    </>
  );
}