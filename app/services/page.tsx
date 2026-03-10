import type { Metadata } from "next";
import ServicesClient from "./ServicesClient";

// ── SEO Metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Startup Services for Entrepreneurs | Hustlecare",
  description:
    "Explore startup services for entrepreneurs including business plans, business registration, website creation, logo design, and more. Launch your business with Hustlecare.",
  keywords: [
    "startup services",
    "services for starting a business",
    "business startup services",
    "entrepreneur services",
    "startup support services",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services",
  },
  openGraph: {
    title: "Startup Services for Entrepreneurs | Hustlecare",
    description:
      "Explore startup services for entrepreneurs including business plans, business registration, website creation, logo design, and more.",
    url: "https://www.hustlecare.net/services",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Startup Services for Entrepreneurs | Hustlecare",
    description:
      "Explore startup services for entrepreneurs including business plans, business registration, website creation, logo design, and more.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function ServicesPage() {
  return <ServicesClient />;
}