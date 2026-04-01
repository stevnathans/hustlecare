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
    return `${count} Small Business Ideas to Start in Kenya (${year}) | HustleCare`;
  }
  return `Small Business Ideas to Start in Kenya (${year}) | HustleCare`;
}

function buildDescription(count: number): string {
  const countLabel = count > 0 ? `${count}` : "Hundreds of";
  return `Discover ${countLabel} verified small business ideas to start in Kenya today. Each idea includes startup costs in KES, licensing requirements, time-to-launch estimates, and local suppliers — everything you need to launch with confidence.`;
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
      "small business ideas Kenya",
      `business ideas Kenya ${new Date().getFullYear()}`,
      "profitable business ideas Kenya",
      "top businesses to start in Kenya",
      "business opportunities Kenya",
      "start a business in Kenya",
      "entrepreneurship Kenya",
      "startup ideas Nairobi",
      "business requirements checklist Kenya",
      "how to start a business Kenya",
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
          alt: `${count > 0 ? count : "Top"} small business ideas in Kenya on HustleCare`,
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
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: "Business Ideas in Kenya",
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
        ...(count > 0 && { numberOfItems: count }),
      },
      // FAQPage — mirrors FAQ_ITEMS in BusinessesContent.tsx
      // Keep both in sync if you update questions/answers.
      {
        "@type": "FAQPage",
        "@id": `${PAGE_URL}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "What are the most profitable small businesses to start in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Some of the most profitable businesses in Kenya include M-Pesa agencies, cereals shops, fresh produce delivery, salon & barbershops, poultry farming, boda boda logistics, and online retail. Profitability depends on your location, capital, and target market.",
            },
          },
          {
            "@type": "Question",
            name: "How much capital do I need to start a small business in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Starting capital varies widely. Micro-businesses (e.g., phone repair, food kiosk) can start with as little as KES 10,000–50,000. Medium ventures (e.g., mini supermarket, salon) typically need KES 100,000–500,000. Each business page on our platform lists estimated startup costs so you can plan accordingly.",
            },
          },
          {
            "@type": "Question",
            name: "Do I need to register my business with the government in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. In Kenya you must register with the Business Registration Service (BRS) under the Companies Act or Business Names Act. You'll also need a Single Business Permit (SBP) from your county government, and depending on your industry, sector-specific licences (e.g., KEBS, NEMA, PPB).",
            },
          },
          {
            "@type": "Question",
            name: "What government support is available for small businesses in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Key support programmes include: the Hustler Fund (low-interest mobile loans), Youth Enterprise Development Fund (YEDF), Women Enterprise Fund (WEF), and NG-CDF grants. Kenya Revenue Authority (KRA) also offers simplified tax regimes such as the Turnover Tax for businesses earning below KES 25 million per year.",
            },
          },
          {
            "@type": "Question",
            name: "How do I find suppliers for my new business in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Each business idea on our platform lists recommended suppliers and what you need to source. You can also find suppliers at Gikomba, Eastleigh, and Wakulima markets in Nairobi, or through directories like Kenya Association of Manufacturers (KAM) and the Kenya National Chamber of Commerce (KNCCI).",
            },
          },
          {
            "@type": "Question",
            name: "What are the best online businesses to start in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Popular online businesses in Kenya include social media marketing agencies, e-commerce stores (Jumia, Kilimall, or your own site), freelancing (Upwork, Fiverr), virtual assistance, YouTube content creation, and online tutoring. These require low capital and can be started from home.",
            },
          },
          {
            "@type": "Question",
            name: "How long does it take to launch a business in Kenya?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "A simple micro-business can launch in a few days once you have capital and stock. Formal registration takes 1–3 business days online via eCitizen. More complex ventures requiring premises, staff, and multiple licences may take 4–12 weeks. Each listing on our platform shows an estimated time-to-launch.",
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
        <BusinessesContent />
      </Suspense>
    </>
  );
}