// app/community/page.tsx
import type { Metadata } from "next";
import CommunityPageClient from "./CommunityPageClient";

export const metadata: Metadata = {
  title: "Community Templates | Hustlecare",
  description:
    "Browse business requirement lists shared by like-minded entrepreneurs. Copy any template to your account and customise it to launch your business faster.",
  keywords: [
    "Kenya business requirement templates",
    "startup requirements Kenya",
    "business launch checklist",
    "entrepreneur community Kenya",
    "business setup guide",
  ],
  openGraph: {
    title: "Community Templates | Hustlecare",
    description:
      "Browse business requirement lists shared by like-minded entrepreneurs. Copy any template and customise it to fit your business.",
    url: "https://hustlecare.net/community",
    siteName: "Hustlecare",
    type: "website",
    images: [
      {
        url: "https://hustlecare.net/og/community.png",
        width: 1200,
        height: 630,
        alt: "Hustlecare Business Requirement Templates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Community Templates | Hustlecare",
    description:
      "Browse business requirement lists shared by like-minded entrepreneurs. Copy and customise any template.",
    images: ["https://hustlecare.net/og/community.png"],
  },
  alternates: {
    canonical: "https://hustlecare.net/community",
  },
};

export default function CommunityPage() {
  return <CommunityPageClient />;
}