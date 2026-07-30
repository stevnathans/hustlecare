import type { Metadata } from "next";
import PitchDeckClient from "./PitchDeckClient";

// ── SEO Metadata ──────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: "Pitch Deck Creation for Startups | Hustlecare",
  description:
    "Get a professionally designed, investor-ready pitch deck for your startup. Hustlecare builds decks with a clear narrative, custom design, and financial visuals.",
  keywords: [
    "pitch deck creation service",
    "startup pitch deck",
    "investor pitch deck design",
    "fundraising pitch deck",
    "pitch deck for investors",
  ],
  alternates: {
    canonical: "https://www.hustlecare.net/services/pitch-deck",
  },
  openGraph: {
    title: "Pitch Deck Creation for Startups | Hustlecare",
    description:
      "Get a professionally designed, investor-ready pitch deck for your startup. Hustlecare builds decks with a clear narrative, custom design, and financial visuals.",
    url: "https://www.hustlecare.net/services/pitch-deck",
    siteName: "Hustlecare",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pitch Deck Creation for Startups | Hustlecare",
    description:
      "Get a professionally designed, investor-ready pitch deck for your startup. Hustlecare builds decks with a clear narrative, custom design, and financial visuals.",
  },
};

// ── Page (Server Component) ───────────────────────────────────────────────────
export default function PitchDeckPage() {
  return <PitchDeckClient />;
}