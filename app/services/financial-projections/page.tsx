import type { Metadata } from "next";
import FinancialProjectionsClient from "./FinancialProjectionsClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Financial Projections for Startups & Small Businesses | Hustlecare",
  description:
    "Get professional financial projections for your startup. Understand your startup costs, revenue potential, and profitability before you launch. Built for entrepreneurs.",
  keywords: [
    "financial projections for startups",
    "startup financial projections",
    "small business financial planning",
    "startup cost estimates",
    "revenue projections for new business",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services/financial-projections",
  },
  openGraph: {
    title: "Financial Projections for Startups & Small Businesses | Hustlecare",
    description:
      "Get professional financial projections for your startup. Understand your startup costs, revenue potential, and profitability before you launch.",
    url: "https://www.hustlecare.net/services/financial-projections",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Financial Projections for Startups & Small Businesses | Hustlecare",
    description:
      "Get professional financial projections for your startup. Understand your startup costs, revenue potential, and profitability before you launch.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function FinancialProjectionsPage() {
  return <FinancialProjectionsClient />;
}