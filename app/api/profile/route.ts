// app/api/profile/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

  const carts = user.carts.map((cart) => ({
    id: cart.id,
    name: `${cart.business.name} Plan`,
    business: cart.business.slug,
    totalCost: cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    productCount: cart.items.length,
    updatedAt: cart.updatedAt,
  }));

  return NextResponse.json({
    name: user.name,
    email: user.email,
    image: user.image ?? null,
    carts,
  });
}
