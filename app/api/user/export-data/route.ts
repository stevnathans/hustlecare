// app/api/user/export-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get comprehensive user data
    const userData = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        carts: {
          include: {
            business: {
              select: { name: true, slug: true }
            },
            items: {
              include: {
                product: {
                  select: { name: true, description: true, price: true }
                }
              }
            }
          }
        },
        reviews: {
          include: {
            product: {
              select: { name: true, description: true }
            }
          }
        },
        comments: {
          include: {
            requirement: {
              select: { name: true, description: true },
              include: {
                business: {
                  select: { name: true, slug: true }
                }
              }
            }
          }
        },
        searches: {
          include: {
            business: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive information
    const exportData = {
      profile: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      },
      statistics: {
        totalCarts: userData.carts.length,
        totalReviews: userData.reviews.length,
        totalComments: userData.comments.length,
        totalSearches: userData.searches.length
      },
      carts: userData.carts.map(cart => ({
        id: cart.id,
        name: cart.name,
        business: cart.business.name,
        totalCost: cart.totalCost,
        itemCount: cart.items.length,
        items: cart.items.map(item => ({
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          category: item.category,
          requirementName: item.requirementName
        })),
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt
      })),
      reviews: userData.reviews.map(review => ({
        id: review.id,
        productName: review.product.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })),
      comments: userData.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        requirement: comment.requirement.name,
        business: comment.requirement.business.name,
        createdAt: comment.createdAt
      })),
      searchHistory: userData.searches.map(search => ({
        id: search.id,
        keyword: search.keyword,
        location: search.location,
        resultCount: search.resultCount,
        businessClicked: search.business?.name || null,
        createdAt: search.createdAt
      }))
    };

    // Create response with proper headers for file download
    const jsonString = JSON.stringify(exportData, null, 2);
    const response = new NextResponse(jsonString);
    
    response.headers.set('Content-Type', 'application/json');
    response.headers.set('Content-Disposition', `attachment; filename="user-data-${userData.email}-${new Date().toISOString().split('T')[0]}.json"`);
    
    return response;

  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}