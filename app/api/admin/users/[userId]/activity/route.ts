/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/admin/users/[userId]/activity/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/admin-utils';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    await requirePermission('users.view');
    
    const { userId } = await params;

    // Fetch user with all activity
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        carts: {
          include: {
            business: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        comments: {
          include: {
            // Comments now belong to BusinessRequirement, not Requirement directly.
            // We go: Comment → BusinessRequirement → template (name) + business (name, slug)
            businessRequirement: {
              select: {
                template: {
                  select: {
                    name: true,
                  },
                },
                business: {
                  select: {
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        reviews: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        searches: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Shape comments so the response format stays the same as before —
    // callers expecting { name, business } on each comment still get it,
    // just sourced from businessRequirement.template and businessRequirement.business.
    const shapedComments = user.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      isApproved: comment.isApproved,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      businessRequirementId: comment.businessRequirementId,
      // Flattened for easy consumption by the UI
      requirementName: comment.businessRequirement.template.name,
      businessName: comment.businessRequirement.business.name,
      businessSlug: comment.businessRequirement.business.slug,
    }));

    // Remove sensitive data
    const { password, comments: _comments, ...rest } = user as typeof user & { password?: string };

    return NextResponse.json({
      ...rest,
      comments: shapedComments,
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}