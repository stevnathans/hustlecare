'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import {prisma} from '@/lib/prisma';

/**
 * Get the current user session
 * @returns The current user session or null if not authenticated
 */
export async function getCurrentUser() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return null;
    }
    
    // Get user from database with additional information
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
      },
    });
    
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if the current user is authenticated
 * @returns Boolean indicating if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getServerSession(authOptions);
  return !!session?.user;
}

/**
 * Check if current user has access to a specific cart
 * @param cartId The cart ID to check access for
 * @returns Boolean indicating if user has access
 */
export async function hasCartAccess(cartId: string): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return false;
    }
    
    const cart = await prisma.cart.findUnique({
      where: {
        id: cartId,
      },
    });
    
    return !!cart && cart.userId === session.user.id;
  } catch (error) {
    console.error('Error checking cart access:', error);
    return false;
  }
}

/**
 * Get the business for the current page from the URL
 * This helps determine which business-specific cart to show
 */
export async function getCurrentBusinessFromUrl(businessId: number): Promise<{
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
} | null> {
  try {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        image: true,
      },
    });
    
    return business;
  } catch (error) {
    console.error('Error getting current business:', error);
    return null;
  }
}