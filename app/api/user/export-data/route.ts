// app/api/user/export-data/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const userData = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        carts: {
          include: {
            business: {
              select: { name: true, slug: true },
            },
            items: {
              include: {
                product: {
                  select: { name: true, description: true, price: true },
                },
              },
            },
          },
        },
        reviews: {
          include: {
            product: {
              select: { name: true, description: true },
            },
          },
        },
        // Comments belong to BusinessRequirement, not Requirement.
        // We navigate: Comment → businessRequirement → template (name)
        //                                            → business (name, slug)
        comments: {
          include: {
            businessRequirement: {
              include: {
                template: {
                  select: { name: true, description: true },
                },
                business: {
                  select: { name: true, slug: true },
                },
              },
            },
          },
        },
        searches: {
          include: {
            business: {
              select: { name: true, slug: true },
            },
          },
        },
      },
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const exportData = {
      profile: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      },
      statistics: {
        totalCarts: userData.carts.length,
        totalReviews: userData.reviews.length,
        totalComments: userData.comments.length,
        totalSearches: userData.searches.length,
      },
      carts: userData.carts.map((cart) => ({
        id: cart.id,
        name: cart.name,
        business: cart.business.name,
        totalCost: cart.totalCost,
        itemCount: cart.items.length,
        items: cart.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          category: item.category,
          requirementName: item.requirementName,
        })),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
      })),
      reviews: userData.reviews.map((review) => ({
        id: review.id,
        productName: review.product.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
      // Requirement name and business now come from businessRequirement.template
      // and businessRequirement.business respectively.
      comments: userData.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        requirement: comment.businessRequirement.template.name,
        business: comment.businessRequirement.business.name,
        createdAt: comment.createdAt,
      })),
      searchHistory: userData.searches.map((search) => ({
        id: search.id,
        keyword: search.keyword,
        location: search.location,
        resultCount: search.resultCount,
        businessClicked: search.business?.name || null,
        createdAt: search.createdAt,
      })),
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const response = new NextResponse(jsonString);

    response.headers.set('Content-Type', 'application/json');
    response.headers.set(
      'Content-Disposition',
      `attachment; filename="user-data-${userData.email}-${new Date().toISOString().split('T')[0]}.json"`
    );

    return response;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}