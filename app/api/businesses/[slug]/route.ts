import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adjust this path if your prisma client is elsewhere

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Await params in Next.js 15+
  const { slug } = await params;

  try {
    const business = await prisma.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        image: true,
      },
    });

    if (!business) {
      return NextResponse.json({ message: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}