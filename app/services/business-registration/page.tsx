import type { Metadata } from "next";
import BusinessRegistrationClient from "./BusinessRegistrationClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Business Registration Service for Startups | Hustlecare",
  description:
    "Register your business quickly and legally. Hustlecare helps entrepreneurs register their businesses and handle startup compliance requirements.",
  keywords: [
    "business registration service",
    "register a new business",
    "startup business registration",
    "company registration service",
    "small business registration",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services/business-registration",
  },
  openGraph: {
    title: "Business Registration Service for Startups | Hustlecare",
    description:
      "Register your business quickly and legally. Hustlecare helps entrepreneurs register their businesses and handle startup compliance requirements.",
    url: "https://www.hustlecare.net/services/business-registration",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Registration Service for Startups | Hustlecare",
    description:
      "Register your business quickly and legally. Hustlecare helps entrepreneurs register their businesses and handle startup compliance requirements.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function BusinessRegistrationPage() {
  return <BusinessRegistrationClient />;
}