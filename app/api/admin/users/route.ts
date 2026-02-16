/* eslint-disable @typescript-eslint/no-unused-vars */
// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import bcrypt from 'bcrypt';

// GET - Fetch all users with their activity counts
export async function GET() {
  try {
    await requirePermission('users.view');
    
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            businesses: true,
            carts: true,
            comments: true,
            reviews: true,
            searches: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    
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

// POST - Create new user
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requirePermission('users.update');
    const body = await req.json();
    const { name, email, phone, role = 'user', isActive = true } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        isActive,
        password: hashedPassword,
        emailVerified: new Date(), // Auto-verify admin-created users
      },
      include: {
        _count: {
          select: {
            businesses: true,
            carts: true,
            comments: true,
            reviews: true,
            searches: true,
          }
        }
      }
    });

    // Log the action
    await createAuditLog({
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      changes: {
        created: {
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      },
      req
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      tempPassword // Include temp password in response (should be shown to admin once)
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('users.update');
    const body = await req.json();
    const { userId, name, phone, role, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get old user data for audit log
    const oldUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!oldUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      name?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        _count: {
          select: {
            businesses: true,
            carts: true,
            comments: true,
            reviews: true,
            searches: true,
          }
        }
      }
    });

    // Determine what changed
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    if (name && name !== oldUser.name) {
      changes.name = { old: oldUser.name, new: name };
    }
    if (phone !== oldUser.phone) {
      changes.phone = { old: oldUser.phone, new: phone };
    }
    if (role && role !== oldUser.role) {
      changes.role = { old: oldUser.role, new: role };
    }
    if (isActive !== undefined && isActive !== oldUser.isActive) {
      changes.isActive = { old: oldUser.isActive, new: isActive };
    }

    // Log the action
    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      changes,
      req
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('users.delete');
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user details before deletion
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            businesses: true,
            carts: true,
            comments: true,
            reviews: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has dependencies
    const hasActivity = 
      user._count.businesses > 0 ||
      user._count.carts > 0 ||
      user._count.comments > 0 ||
      user._count.reviews > 0;

    if (hasActivity) {
      return NextResponse.json(
        { 
          error: 'Cannot delete user with existing activity. Consider deactivating instead.',
          details: {
            businesses: user._count.businesses,
            carts: user._count.carts,
            comments: user._count.comments,
            reviews: user._count.reviews
          }
        },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId }
    });

    // Log the action
    await createAuditLog({
      action: 'DELETE',
      entity: 'User',
      entityId: userId,
      changes: {
        deleted: {
          email: user.email,
          role: user.role
        }
      },
      req
    });

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}