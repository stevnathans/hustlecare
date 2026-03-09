import type { Metadata } from "next";
import BusinessPlanWritingClient from "./BusinessPlanWritingClient";

// ── SEO Metadata ─────────────────────────────────────────────────────────────
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
    canonical: "https://www.hustlecare.com/services/business-plan-writing",
  },
  openGraph: {
    title: "Business Plan Writing Service for Startups | Hustlecare",
    description:
      "Get a professional business plan for your startup. Includes market research, financial projections, and investor-ready documents.",
    url: "https://www.hustlecare.com/services/business-plan-writing",
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
export default function BusinessPlanWritingPage() {
  return <BusinessPlanWritingClient />;
}