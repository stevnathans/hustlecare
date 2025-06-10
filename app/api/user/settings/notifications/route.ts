// app/api/user/settings/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { emailNotifications, pushNotifications, marketingEmails } = await req.json();

    // Validate input
    if (
      typeof emailNotifications !== 'boolean' ||
      typeof pushNotifications !== 'boolean' ||
      typeof marketingEmails !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid notification settings format' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user notification preferences
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailNotifications,
        pushNotifications,
        marketingEmails
      }
    });
    
    return NextResponse.json(
      { 
        message: 'Notification settings saved successfully',
        settings: {
          emailNotifications,
          pushNotifications,
          marketingEmails
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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

    // Get user notification preferences
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true,
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user's notification settings
    const userSettings = {
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
      marketingEmails: user.marketingEmails
    };

    return NextResponse.json({
      settings: userSettings
    });

  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}