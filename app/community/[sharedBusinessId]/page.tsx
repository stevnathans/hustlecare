import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import SharedBusinessPreviewClient from "./SharedBusinessPreviewClient";

interface Props {
  params: Promise<{ sharedBusinessId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sharedBusinessId } = await params;
  const id = parseInt(sharedBusinessId, 10);

  if (isNaN(id)) {
    return { title: "Template Not Found | Hustlecare" };
  }

  const sharedBusiness = await prisma.sharedBusiness.findUnique({
    where: { id, isActive: true },
    select: {
      name: true,
      description: true,
      createdAt: true,
      business: { select: { name: true, image: true } },
      user: { select: { name: true } },
    },
  });

  if (!sharedBusiness) {
    return { title: "Template Not Found | Hustlecare" };
  }

  const title = ` ${sharedBusiness.business.name} Requirements | Hustlecare`;
  const description =
    sharedBusiness.description ||
    `A ${sharedBusiness.business.name} requirement list shared by ${
      sharedBusiness.user.name || "a Hustlecare user"
    }. Copy it to your account and customise it for your own business.`;
  const url = `https://hustlecare.net/community/${sharedBusinessId}`;
  const image = sharedBusiness.business.image || "https://hustlecare.net/og/community.png";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Hustlecare",
      type: "article",
      publishedTime: sharedBusiness.createdAt.toISOString(),
      images: [{ url: image, width: 1200, height: 630, alt: sharedBusiness.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    alternates: { canonical: url },
  };
}

export default async function SharedBusinessPreviewPage({ params }: Props) {
  const { sharedBusinessId } = await params;
  return <SharedBusinessPreviewClient sharedBusinessId={sharedBusinessId} />;
}