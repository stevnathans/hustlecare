// app/api/admin/businesses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

// GET - Fetch all businesses with counts
export async function GET() {
  try {
    // Verify user has permission to view businesses
    await requirePermission('businesses.view');
    
    const businesses = await prisma.business.findMany({
      include: {
        _count: {
          select: { 
            requirements: true,
            carts: true,
            searches: true
          }
        },
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(businesses);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    
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

// POST - Create new business
export async function POST(req: NextRequest) {
  try {
    // Verify user has permission to create businesses
    const user = await requirePermission('businesses.create');
    
    const body = await req.json();
    const { name, slug, description, image, published = true } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { slug }
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: 'A business with this slug already exists' },
        { status: 400 }
      );
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        name,
        slug,
        description,
        image,
        published,
        userId: user.id,
      },
      include: {
        _count: {
          select: { requirements: true }
        }
      }
    });

    // Log the action
    await createAuditLog({
      action: 'CREATE',
      entity: 'Business',
      entityId: business.id.toString(),
      changes: {
        created: {
          name: business.name,
          slug: business.slug,
          published: business.published
        }
      },
      req
    });

    return NextResponse.json(business, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create business' },
      { status: 500 }
    );
  }
}

// PATCH - Update existing business
export async function PATCH(req: NextRequest) {
  try {
    // Verify user has permission to update businesses
    await requirePermission('businesses.update');
    
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Get existing business for audit log
    const oldBusiness = await prisma.business.findUnique({
      where: { id: Number(id) }
    });

    if (!oldBusiness) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if slug is being changed and if it's already taken
    if (updateData.slug && updateData.slug !== oldBusiness.slug) {
      const slugExists = await prisma.business.findUnique({
        where: { slug: updateData.slug }
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'A business with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update the business
    const business = await prisma.business.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        _count: {
          select: { requirements: true }
        }
      }
    });

    // Determine what changed
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const key in updateData) {
      if (oldBusiness[key as keyof typeof oldBusiness] !== updateData[key]) {
        changes[key] = {
          old: oldBusiness[key as keyof typeof oldBusiness],
          new: updateData[key]
        };
      }
    }

    // Log the action
    await createAuditLog({
      action: 'UPDATE',
      entity: 'Business',
      entityId: id.toString(),
      changes,
      req
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error('Error updating business:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update business' },
      { status: 500 }
    );
  }
}

// DELETE - Delete business
export async function DELETE(req: NextRequest) {
  try {
    // Verify user has permission to delete businesses
    await requirePermission('businesses.delete');
    
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Get business details before deletion
    const business = await prisma.business.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: {
            requirements: true,
            carts: true
          }
        }
      }
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Check if business has dependencies
    if (business._count.requirements > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete business with ${business._count.requirements} requirements. Delete requirements first.` 
        },
        { status: 400 }
      );
    }

    if (business._count.carts > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete business with ${business._count.carts} active carts.` 
        },
        { status: 400 }
      );
    }

    // Delete the business
    await prisma.business.delete({
      where: { id: Number(id) }
    });

    // Log the action
    await createAuditLog({
      action: 'DELETE',
      entity: 'Business',
      entityId: id.toString(),
      changes: {
        deleted: {
          name: business.name,
          slug: business.slug
        }
      },
      req
    });

    return NextResponse.json(
      { message: 'Business deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting business:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete business' },
      { status: 500 }
    );
  }
}