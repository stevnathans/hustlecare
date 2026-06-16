// app/community/[sharedBusinessId]/page.tsx
import type { Metadata } from "next";
import SharedBusinessPreviewClient from "./SharedBusinessPreviewClient";

interface Props {
  params: { sharedBusinessId: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hustlecare.net";

  try {
    const res = await fetch(
      `${baseUrl}/api/community/${params.sharedBusinessId}`,
      // Revalidate every hour so metadata stays fresh without hammering the DB
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) throw new Error("Not found");

    const data = await res.json();

    const title = `${data.name} — Community Template | Hustlecare`;
    const description =
      data.description ??
      `Explore this ${data.business?.name ?? "business"} requirement list shared by ${data.author?.name ?? "an entrepreneur"} on Hustlecare. Copy it to your account and customise it.`;

    const ogImage = `${baseUrl}/og/community.png`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/community/${params.sharedBusinessId}`,
        siteName: "Hustlecare",
        type: "article",
        publishedTime: data.sharedAt,
        authors: data.author?.name ? [data.author.name] : undefined,
        images: [{ url: ogImage, width: 1200, height: 630, alt: data.name }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
      alternates: {
        canonical: `${baseUrl}/community/${params.sharedBusinessId}`,
      },
    };
  } catch {
    return {
      title: "Business Template | Hustlecare",
      description:
        "Browse and copy business requirement lists shared by entrepreneurs on Hustlecare.",
    };
  }
}

export default function SharedBusinessPreviewPage({ params }: Props) {
  return <SharedBusinessPreviewClient sharedBusinessId={params.sharedBusinessId} />;
}