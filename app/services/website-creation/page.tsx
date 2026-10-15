import type { Metadata } from "next";
import WebsiteCreationClient from "./WebsiteCreationClient";
import { getCatalogPlans } from "@/lib/services/catalog";

// Package names, prices and features come from the database
// (admin → Services). Cached for a few minutes; saving in admin refreshes it.
export const revalidate = 300;

// ── SEO Metadata ──────────────────────────────────────────────────────────────
// Canonical and og:url are relative so they resolve against metadataBase in
// the root layout (https://hustlecare.net) — the same address as the sitemap.
export const metadata: Metadata = {
  title: "Website Creation for Small Businesses | Hustlecare",
  description:
    "Launch a professional website for your business. Hustlecare builds fast, modern websites designed for startups and small businesses.",
  keywords: [
    "small business website creation",
    "startup website design",
    "professional business website",
    "website design for startups",
    "small business website service",
  ],
  alternates: {
    canonical: "/services/website-creation",
  },
  openGraph: {
    title: "Website Creation for Small Businesses | Hustlecare",
    description:
      "Launch a professional website for your business. Hustlecare builds fast, modern websites designed for startups and small businesses.",
    url: "/services/website-creation",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Website Creation for Small Businesses | Hustlecare",
    description:
      "Launch a professional website for your business. Hustlecare builds fast, modern websites designed for startups and small businesses.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default async function WebsiteCreationPage() {
  const catalogPlans = await getCatalogPlans("website-creation");
  return <WebsiteCreationClient catalogPlans={catalogPlans} />;
}