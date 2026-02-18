// app/api/profile/lists/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true, // Added: Need user ID for share status lookup
      name: true,
      email: true,
      image: true,
      carts: {
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          updatedAt: true,
          items: true,
          business: {
            select: {
              id: true, // Added: Need business ID for share status lookup
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Map carts and fetch share status for each
  const cartsWithShareStatus = await Promise.all(
    user.carts.map(async (cart) => {
      // Check if this business is shared
      const sharedBusiness = await prisma.sharedBusiness.findFirst({
        where: {
          userId: user.id,
          businessId: cart.business.id,
        },
        select: {
          isActive: true,
          viewCount: true,
          copyCount: true,
        },
      });

      return {
        businessId: cart.business.id.toString(),
        businessName: cart.business.name,
        businessSlug: cart.business.slug,
        totalCost: cart.items.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        ),
        totalItems: cart.items.length,
        updatedAt: cart.updatedAt.toISOString(),
        // Share status fields
        isShared: sharedBusiness?.isActive || false,
        viewCount: sharedBusiness?.viewCount || 0,
        copyCount: sharedBusiness?.copyCount || 0,
      };
    })
  );

  return NextResponse.json({
    lists: cartsWithShareStatus,
  });
}