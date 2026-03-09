import type { Metadata } from "next";
import LogoDesignClient from "./LogoDesignClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Professional Logo Design for Startups | Hustlecare",
  description:
    "Get a professional logo designed for your business. Build a strong brand identity with custom logo design created for startups and small businesses.",
  keywords: [
    "logo design for startups",
    "professional logo design",
    "business logo design service",
    "logo design for small business",
    "custom logo design",
  ],
  alternates: {
    canonical: "https://www.hustlecare.com/services/logo-design",
  },
  openGraph: {
    title: "Professional Logo Design for Startups | Hustlecare",
    description:
      "Get a professional logo designed for your business. Build a strong brand identity with custom logo design created for startups and small businesses.",
    url: "https://www.hustlecare.com/services/logo-design",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Logo Design for Startups | Hustlecare",
    description:
      "Get a professional logo designed for your business. Build a strong brand identity with custom logo design created for startups and small businesses.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function LogoDesignPage() {
  return <LogoDesignClient />;
}