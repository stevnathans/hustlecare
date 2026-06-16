// lib/admin-utils.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export const ROLES = {
  USER: 'user',
  AUTHOR: 'author',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  ADMIN: 'admin'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const PERMISSIONS = {
  'businesses.view': ['author', 'editor', 'admin'],
  'businesses.create': ['author', 'editor', 'admin'],
  'businesses.update': ['editor', 'admin'],
  'businesses.delete': ['admin'],
  'products.view': ['author', 'editor', 'admin'],
  'products.create': ['author', 'editor', 'admin'],
  'products.update': ['editor', 'admin'],
  'products.delete': ['admin'],
  'requirements.view': ['author', 'editor', 'admin'],
  'requirements.create': ['author', 'editor', 'admin'],
  'requirements.update': ['editor', 'admin'],
  'requirements.delete': ['admin'],
  'vendors.view': ['author', 'editor', 'admin'],
  'vendors.create': ['editor', 'admin'],
  'vendors.update': ['editor', 'admin'],
  'vendors.delete': ['admin'],
  'users.view': ['admin'],
  'users.update': ['admin'],
  'users.delete': ['admin'],
  'comments.moderate': ['reviewer', 'editor', 'admin'],
  'reviews.moderate': ['reviewer', 'editor', 'admin'],
  'audit.view': ['admin'],
  'settings.manage': ['admin'],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasRole(userRole: string, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole as Role);
}

export function hasPermission(userRole: string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] || [];
  return (allowedRoles as readonly string[]).includes(userRole);
}

// FIX: canAccessAdmin now only allows true admins, consistent with the fix
// applied in proxy.ts. Previously author/editor/reviewer were included,
// meaning this helper and proxy.ts disagreed on who is an "admin".
// Having two different definitions of the same concept is a logic gap
// that causes subtle authorization bugs.
export function canAccessAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}

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

export async function requirePermission(permission: Permission) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!user.isActive) {
    throw new Error('Unauthorized');
  }

  // FIX: Permission error no longer reveals which permission is required.
  // Previously "Forbidden - Requires permission: users.delete" told an
  // attacker exactly what permission gates exist and what they need to escalate.
  if (!hasPermission(user.role, permission)) {
    throw new Error('Forbidden');
  }

  return user;
}

export async function requireRole(roles: Role[]) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!user.isActive) {
    throw new Error('Unauthorized');
  }

  // FIX: Same as above — don't reveal which roles are required.
  if (!hasRole(user.role, roles)) {
    throw new Error('Forbidden');
  }

  return user;
}

// FIX: x-forwarded-for header can be spoofed by clients. Take only the
// last IP in the chain (added by your trusted infrastructure) rather than
// the first (which can be set to anything by the client).
// Only use the first if you fully control and trust your proxy chain.
function getIpAddress(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    // Last IP is added by your infrastructure and is trustworthy
    return ips[ips.length - 1] || 'unknown';
  }
  return realIp || 'unknown';
}

function getUserAgent(req: NextRequest): string {
  return req.headers.get('user-agent') || 'unknown';
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT' | 'APPROVE' | 'REJECT';
export type AuditEntity = 'Business' | 'Product' | 'Requirement' | 'Vendor' | 'User' | 'Comment' | 'Review';

interface AuditLogData {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  changes?: Record<string, unknown>;
  req?: NextRequest;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      console.warn('Audit log attempted without authenticated user');
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
    console.error('Failed to create audit log:', (error as Error).message);
    return null;
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  entity?: AuditEntity;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  // FIX: Cap the maximum number of records returnable in one call.
  // Previously a caller could pass limit: 999999 and dump the entire
  // audit log table in one query.
  const MAX_LIMIT = 100;
  const limit = Math.min(filters?.limit || 50, MAX_LIMIT);

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
      take: limit,
      skip: filters?.offset || 0,
    }),
    prisma.auditLog.count({ where })
  ]);

  return { logs, total };
}

export async function updateLastLogin(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() }
    });
  } catch (error) {
    console.error('Failed to update last login:', (error as Error).message);
  }
}

export function isAdmin(role: string): boolean {
  return role === ROLES.ADMIN;
}

export function isEditor(role: string): boolean {
  return hasRole(role, [ROLES.EDITOR, ROLES.ADMIN]);
}

export function isReviewer(role: string): boolean {
  return hasRole(role, [ROLES.REVIEWER, ROLES.EDITOR, ROLES.ADMIN]);
}

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