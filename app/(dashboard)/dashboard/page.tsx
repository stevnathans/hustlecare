// app/(dashboard)/dashboard/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/Dashboard/DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/signin");
  }

  // Get basic user info
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  // Get user's carts with business and items data (same as the API endpoint)
  const carts = await prisma.cart.findMany({
    where: { userId: user.id },
    include: {
      business: {
        select: { id: true, name: true, image: true, slug: true },
      },
      items: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          requirementName: true,
          createdAt: true,
          product: {
            select: {
              name: true,
              price: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  // Calculate stats
  const totalBusinesses = carts.length;
  const totalItems = carts.reduce((sum, cart) => sum + cart.items.length, 0);
  const totalCost = carts.reduce((sum, cart) => sum + (cart.totalCost ?? 0), 0);

  // Get recent activity from all cart items
  const recentActivity = carts
    .flatMap(cart => 
      cart.items.map(item => ({
        id: item.id,
        businessName: cart.business.name,
        itemName: item.product?.name || item.requirementName || 'Unknown Item',
        price: item.unitPrice || item.product?.price || 0,
        createdAt: item.createdAt.toISOString(),
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        image: user.image,
        createdAt: user.createdAt.toISOString(),
      }}
      stats={{
        totalBusinesses,
        totalItems,
        totalCost,
      }}
      recentActivity={recentActivity}
    />
  );
}