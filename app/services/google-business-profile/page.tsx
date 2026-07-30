import type { Metadata } from "next";
import GoogleBusinessProfileClient from "./GoogleBusinessProfileClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Google Business Profile Setup for Startups | Hustlecare",
  description:
    "Get your business listed and optimised on Google. Hustlecare sets up your Google Business Profile with accurate details, photos, and local SEO basics so customers can find you.",
  keywords: [
    "google business profile setup",
    "google my business setup service",
    "local seo for small business",
    "get listed on google maps",
    "google business listing optimization",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services/google-business-profile",
  },
  openGraph: {
    title: "Google Business Profile Setup for Startups | Hustlecare",
    description:
      "Get your business listed and optimised on Google. Hustlecare sets up your Google Business Profile with accurate details, photos, and local SEO basics so customers can find you.",
    url: "https://www.hustlecare.net/services/google-business-profile",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Google Business Profile Setup for Startups | Hustlecare",
    description:
      "Get your business listed and optimised on Google. Hustlecare sets up your Google Business Profile with accurate details, photos, and local SEO basics so customers can find you.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function GoogleBusinessProfilePage() {
  return <GoogleBusinessProfileClient />;
}