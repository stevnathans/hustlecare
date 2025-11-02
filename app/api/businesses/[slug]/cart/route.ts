import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; 

// Define a type for the params to expect slug (matching the file path [slug])
interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    // 1. Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    // 2. Get and validate slug from the URL (await params in Next.js 15+)
    const { slug } = await params;
    const businessId = parseInt(slug, 10);

    if (isNaN(businessId)) {
      return NextResponse.json({ error: 'Invalid business ID format' }, { status: 400 });
    }

    // 3. Find an existing cart or create a new one
    let cart = await prisma.cart.findFirst({
      where: {
        userId: userId,
        businessId: businessId,
      },
      include: {
        items: { // 'items' is the relation field in your Cart model for CartItem[]
          include: {
            product: true, // 'product' is the relation field in your CartItem model for Product
          },
          orderBy: {
            createdAt: 'asc', // Optional: order items consistently
          },
        },
      },
    });

    if (!cart) {
      // If no cart exists for this user and business, create one
      // You might want to fetch the business name to include in the cart name
      const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { name: true }
      });

      cart = await prisma.cart.create({
        data: {
          userId: userId,
          businessId: businessId,
          name: business ? `Cart for ${business.name}` : `Cart for Business ID: ${businessId}`, // Example name
          // totalCost will be 0 or null by default if not set
        },
        include: {
          // also include items, which will be empty initially
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    // 4. Return the cart
    return NextResponse.json(cart, { status: 200 });

  } catch (error) {
    console.error('Error fetching or creating cart:', error);
    // It's good to log the actual error on the server
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}