import type { Metadata } from "next";
import WebsiteCreationClient from "./WebsiteCreationClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
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
    canonical: "https://www.hustlecare.com/services/website-creation",
  },
  openGraph: {
    title: "Website Creation for Small Businesses | Hustlecare",
    description:
      "Launch a professional website for your business. Hustlecare builds fast, modern websites designed for startups and small businesses.",
    url: "https://www.hustlecare.com/services/website-creation",
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
export default function WebsiteCreationPage() {
  return <WebsiteCreationClient />;
}