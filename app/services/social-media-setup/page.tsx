import type { Metadata } from "next";
import SocialMediaSetupClient from "./SocialMediaSetupClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Social Media Setup for Small Businesses & Startups | Hustlecare",
  description:
    "Get your business set up on the right social media platforms. Hustlecare creates and optimises professional social media profiles for startups and small businesses.",
  keywords: [
    "social media setup for small business",
    "business social media profiles",
    "social media for startups",
    "social media account setup service",
    "small business social media management",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services/social-media-setup",
  },
  openGraph: {
    title: "Social Media Setup for Small Businesses & Startups | Hustlecare",
    description:
      "Get your business set up on the right social media platforms. Hustlecare creates and optimises professional social media profiles for startups and small businesses.",
    url: "https://www.hustlecare.net/services/social-media-setup",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Media Setup for Small Businesses & Startups | Hustlecare",
    description:
      "Get your business set up on the right social media platforms. Hustlecare creates and optimises professional social media profiles for startups and small businesses.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function SocialMediaSetupPage() {
  return <SocialMediaSetupClient />;
}