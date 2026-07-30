import type { Metadata } from "next";
import BusinessNameDomainClient from "./BusinessNameDomainClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Business Name & Domain Finder for Startups | Hustlecare",
  description:
    "Find the perfect business name with domain and social handle availability checked. Hustlecare helps entrepreneurs pick a name they can actually build a brand on.",
  keywords: [
    "business name generator",
    "startup business name ideas",
    "domain name availability check",
    "business name and domain finder",
    "brand name for startup",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services/business-name-domain",
  },
  openGraph: {
    title: "Business Name & Domain Finder for Startups | Hustlecare",
    description:
      "Find the perfect business name with domain and social handle availability checked. Hustlecare helps entrepreneurs pick a name they can actually build a brand on.",
    url: "https://www.hustlecare.net/services/business-name-domain",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Name & Domain Finder for Startups | Hustlecare",
    description:
      "Find the perfect business name with domain and social handle availability checked. Hustlecare helps entrepreneurs pick a name they can actually build a brand on.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function BusinessNameDomainPage() {
  return <BusinessNameDomainClient />;
}