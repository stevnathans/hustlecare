// lib/admin-utils.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Role definitions
export const ROLES = {
  USER: 'user',
  AUTHOR: 'author',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  ADMIN: 'admin'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Permission definitions
export const PERMISSIONS = {
  // Business permissions
  'businesses.view': ['author', 'editor', 'admin'],
  'businesses.create': ['author', 'editor', 'admin'],
  'businesses.update': ['editor', 'admin'],
  'businesses.delete': ['admin'],
  
  // Product permissions
  'products.view': ['author', 'editor', 'admin'],
  'products.create': ['author', 'editor', 'admin'],
  'products.update': ['editor', 'admin'],
  'products.delete': ['admin'],
  
  // Requirement permissions
  'requirements.view': ['author', 'editor', 'admin'],
  'requirements.create': ['author', 'editor', 'admin'],
  'requirements.update': ['editor', 'admin'],
  'requirements.delete': ['admin'],
  
  // Vendor permissions
  'vendors.view': ['author', 'editor', 'admin'],
  'vendors.create': ['editor', 'admin'],
  'vendors.update': ['editor', 'admin'],
  'vendors.delete': ['admin'],
  
  // User management permissions
  'users.view': ['admin'],
  'users.update': ['admin'],
  'users.delete': ['admin'],
  
  // Moderation permissions
  'comments.moderate': ['reviewer', 'editor', 'admin'],
  'reviews.moderate': ['reviewer', 'editor', 'admin'],
  
  // System permissions
  'audit.view': ['admin'],
  'settings.manage': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Check if user has required role
export function hasRole(userRole: string, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole as Role);
}

// Check if user has required permission
export function hasPermission(userRole: string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] || [];
  return allowedRoles.includes(userRole)
}

// Check if user can access admin area
export function canAccessAdmin(role: string): boolean {
  return hasRole(role, [ROLES.AUTHOR, ROLES.EDITOR, ROLES.REVIEWER, ROLES.ADMIN]);
}

// Get current user session with role
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      image: true,
      isActive: true,
    }
  });
  
  return user;
}

// Verify user has permission (throws error if not)
export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized - Not authenticated');
  }
  
  if (!user.isActive) {
    throw new Error('Unauthorized - Account is inactive');
  }
  
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden - Requires permission: ${permission}`);
  }
  
  return user;
}

// Verify user has role (throws error if not)
export async function requireRole(roles: Role[]) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Unauthorized - Not authenticated');
  }
  
  if (!user.isActive) {
    throw new Error('Unauthorized - Account is inactive');
  }
  
  if (!hasRole(user.role, roles)) {
    throw new Error(`Forbidden - Requires one of roles: ${roles.join(', ')}`);
  }
  
  return user;
}

// Extract IP address from request
function getIpAddress(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

// Extract user agent from request
function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

// Audit log types
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'APPROVE' | 'REJECT';
export type AuditEntity = 'Business' | 'Product' | 'Requirement' | 'Vendor' | 'User' | 'Comment' | 'Review';

interface AuditLogData {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes?: Record<string, unknown>;
  req?: NextRequest;
}

// Create audit log entry
export async function createAuditLog(data: AuditLogData) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.warn('Attempted to create audit log without authenticated user');
      return null;
    }
    
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : undefined,
        ipAddress: data.req ? getIpAddress(data.req) : null,
        userAgent: data.req ? getUserAgent(data.req) : null,
      }
    });
    
    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

// Get audit logs with filters
export async function getAuditLogs(filters?: {
  userId?: string;
  entity?: AuditEntity;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: Record<string, unknown> = {};
  
  if (filters?.userId) where.userId = filters.userId;
  if (filters?.entity) where.entity = filters.entity;
  if (filters?.action) where.action = filters.action;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) (where.createdAt as Record<string, unknown>).gte = filters.startDate;
    if (filters.endDate) (where.createdAt as Record<string, unknown>).lte = filters.endDate;
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            image: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
      skip: filters?.offset || 0,
    }),
    prisma.auditLog.count({ where })
  ]);
  
  return { logs, total };
}

// Update user's last login timestamp
export async function updateLastLogin(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to update last login:', error);
  }
}

// Check if user is admin
export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}

// Check if user is editor or above
export function isEditor(role: string): boolean {
  return hasRole(role, [ROLES.EDITOR, ROLES.ADMIN]);
}

// Check if user is reviewer or above
export function isReviewer(role: string): boolean {
  return hasRole(role, [ROLES.REVIEWER, ROLES.EDITOR, ROLES.ADMIN]);
}

// Get role display name
export function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    user: 'User',
    author: 'Author',
    editor: 'Editor',
    reviewer: 'Reviewer',
    admin: 'Administrator'
  };
  return displayNames[role] || role;
}

// Get role badge color
export function getRoleBadgeColor(role: string): string {
  const colors: Record<string, string> = {
    user: 'bg-gray-100 text-gray-800',
    author: 'bg-blue-100 text-blue-800',
    editor: 'bg-purple-100 text-purple-800',
    reviewer: 'bg-green-100 text-green-800',
    admin: 'bg-red-100 text-red-800'
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
}