import type { Metadata } from "next";
import ServicesClient from "./ServicesClient";
import { getCatalogServices } from "@/lib/services/catalog";

// The service list comes from the database (admin → Services) and is cached
// for a few minutes. Saving in admin refreshes it immediately.
export const revalidate = 300;

// ── SEO Metadata ─────────────────────────────────────────────────────────────
// Canonical and og:url are relative so they resolve against metadataBase in
// the root layout (https://hustlecare.net) — the same address as the sitemap.
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
    canonical: "/services",
  },
  openGraph: {
    title: "Startup Services for Entrepreneurs | Hustlecare",
    description:
      "Explore startup services for entrepreneurs including business plans, business registration, website creation, logo design, and more.",
    url: "/services",
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
export default async function ServicesPage() {
  const catalogServices = await getCatalogServices();
  return <ServicesClient catalogServices={catalogServices} />;
}