// app/us/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hustlecare | Everything You Need To Start Any Business in the US",
  description:
    "Hustlecare provides you with complete requirements you need to start any business in the US while helping you calculate startup costs in real time.",
  keywords: ["start business USA", "business requirements", "startup costs", "Hustlecare"],
  alternates: {
    canonical: "https://hustlecare.net/us",
  },
  openGraph: {
    type: "website",
    url: "https://hustlecare.net/us",
    title: "Hustlecare – Start Your Business in the US",
    description:
      "Discover business ideas, explore requirements, and calculate startup costs with Hustlecare.",
    images: [
      {
        // NOTE: reusing the Kenya OG image as a placeholder — swap this for
        // a US-specific image asset once one exists (og-image-us.jpg or
        // similar). Metadata will still render correctly with the Kenya
        // image in the meantime, just not ideal for social shares.
        url: "https://hustlecare.net/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Hustlecare – Start Your Business in the US",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hustlecare – Start Your Business in the US",
    description:
      "Everything you need to launch your business in the US: Ideas, requirements, costs, and tools.",
    images: ["https://hustlecare.net/og-image.jpg"],
    creator: "@hustlecare",
  },
};

export default function USLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}