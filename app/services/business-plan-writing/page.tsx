import type { Metadata } from "next";
import BusinessPlanWritingClient from "./BusinessPlanWritingClient";
import { getCatalogPlans } from "@/lib/services/catalog";

// Package names, prices and features come from the database
// (admin → Services). Cached for a few minutes; saving in admin refreshes it.
export const revalidate = 300;

// ── SEO Metadata ─────────────────────────────────────────────────────────────
// Canonical and og:url are relative so they resolve against metadataBase in
// the root layout (https://hustlecare.net) — the same address as the sitemap.
export const metadata: Metadata = {
  title: "Business Plan Writing Service for Startups | Hustlecare",
  description:
    "Get a professional business plan for your startup. Includes market research, financial projections, and investor-ready documents. Built for entrepreneurs launching new businesses.",
  keywords: [
    "business plan writing service",
    "startup business plan",
    "professional business plan",
    "business plan for investors",
    "small business business plan",
  ],
  alternates: {
    canonical: "/services/business-plan-writing",
  },
  openGraph: {
    title: "Business Plan Writing Service for Startups | Hustlecare",
    description:
      "Get a professional business plan for your startup. Includes market research, financial projections, and investor-ready documents.",
    url: "/services/business-plan-writing",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Plan Writing Service for Startups | Hustlecare",
    description:
      "Get a professional business plan for your startup. Includes market research, financial projections, and investor-ready documents.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default async function BusinessPlanWritingPage() {
  const catalogPlans = await getCatalogPlans("business-plan-writing");
  return <BusinessPlanWritingClient catalogPlans={catalogPlans} />;
}