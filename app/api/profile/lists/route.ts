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
      id: true,
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
              id: true,
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

  const cartsWithShareStatus = await Promise.all(
    user.carts.map(async (cart) => {
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

      // If this list originated from copying someone else's shared list,
      // surface who it was copied from and when. A user may have copied,
      // removed, and re-copied (possibly from a different author) over
      // time, so we take the most recent copy event for this business.
      const latestCopy = await prisma.businessCopyActivity.findFirst({
        where: {
          copiedByUserId: user.id,
          sharedBusiness: {
            businessId: cart.business.id,
          },
        },
        orderBy: { copiedAt: "desc" },
        select: {
          copiedAt: true,
          sharedBusiness: {
            select: {
              user: {
                select: { name: true },
              },
            },
          },
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
        isShared: sharedBusiness?.isActive || false,
        viewCount: sharedBusiness?.viewCount || 0,
        copyCount: sharedBusiness?.copyCount || 0,
        copiedFrom: latestCopy
          ? {
              authorName: latestCopy.sharedBusiness.user.name || "Anonymous",
              copiedAt: latestCopy.copiedAt.toISOString(),
            }
          : null,
      };
    })
  );

  return NextResponse.json({
    lists: cartsWithShareStatus,
  });
}