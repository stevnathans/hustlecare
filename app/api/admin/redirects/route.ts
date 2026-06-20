// app/api/admin/redirects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';

function handleAuthError(error: unknown): NextResponse | null {
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
  }
  return null;
}

function parseId(value: unknown): number | null {
  const n = parseInt(String(value), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isValidSourcePath(path: string): boolean {
  return /^\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*$/.test(path) && path.length <= 500;
}

function isValidDestination(dest: string): boolean {
  if (dest.startsWith('/')) return dest.length <= 500;
  try {
    const url = new URL(dest);
    return ['http:', 'https:'].includes(url.protocol) && dest.length <= 500;
  } catch {
    return false;
  }
}

// FIX: Replaced prisma.redirectCache (required a new DB table) with a simple
// module-level timestamp. When any mutation happens, we update this value.
// proxy.ts reads it and re-fetches from DB only when it has changed.
// No schema changes needed.
export let redirectCacheInvalidatedAt: number = Date.now();

function invalidateRedirectCache() {
  redirectCacheInvalidatedAt = Date.now();
}

export async function GET() {
  try {
    await requirePermission('settings.manage');
    const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(redirects);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('GET redirects:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to fetch redirects' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // FIX: Removed `const user =` — requirePermission's return value is not
    // needed here since we don't use the user object in this handler.
    await requirePermission('settings.manage');
    const { source, destination, permanent } = await req.json();

    if (!source || !destination) {
      return NextResponse.json({ error: 'source and destination are required' }, { status: 400 });
    }
    if (!isValidSourcePath(source)) {
      return NextResponse.json(
        { error: 'Source must be a valid relative path starting with /' },
        { status: 400 }
      );
    }
    if (!isValidDestination(destination)) {
      return NextResponse.json(
        { error: 'Destination must be a relative path or a valid http/https URL' },
        { status: 400 }
      );
    }
    if (source === destination) {
      return NextResponse.json({ error: 'Source and destination cannot be the same' }, { status: 400 });
    }

    const existing = await prisma.redirect.findUnique({ where: { source } });
    if (existing) {
      return NextResponse.json({ error: 'A redirect with this source already exists' }, { status: 409 });
    }

    const redirect = await prisma.redirect.create({
      data: { source, destination, permanent: Boolean(permanent ?? true) },
    });

    await createAuditLog({
      action: 'CREATE', entity: 'Business', entityId: redirect.id.toString(),
      changes: { source, destination, permanent: redirect.permanent },
      req,
    });

    invalidateRedirectCache();

    return NextResponse.json(redirect, { status: 201 });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('POST redirects:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to create redirect' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requirePermission('settings.manage');
    const { id, source, destination, permanent } = await req.json();

    const redirectId = parseId(id);
    if (!redirectId) {
      return NextResponse.json({ error: 'Valid redirect ID is required' }, { status: 400 });
    }
    if (source && !isValidSourcePath(source)) {
      return NextResponse.json(
        { error: 'Source must be a valid relative path starting with /' },
        { status: 400 }
      );
    }
    if (destination && !isValidDestination(destination)) {
      return NextResponse.json(
        { error: 'Destination must be a relative path or a valid http/https URL' },
        { status: 400 }
      );
    }
    if (source && destination && source === destination) {
      return NextResponse.json({ error: 'Source and destination cannot be the same' }, { status: 400 });
    }

    const existing = await prisma.redirect.findUnique({ where: { id: redirectId } });
    if (!existing) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    const redirect = await prisma.redirect.update({
      where: { id: redirectId },
      data: {
        ...(source      !== undefined && { source }),
        ...(destination !== undefined && { destination }),
        ...(permanent   !== undefined && { permanent: Boolean(permanent) }),
      },
    });

    await createAuditLog({
      action: 'UPDATE', entity: 'Business', entityId: redirectId.toString(),
      changes: { source, destination, permanent },
      req,
    });

    invalidateRedirectCache();

    return NextResponse.json(redirect);
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('PATCH redirects:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to update redirect' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requirePermission('settings.manage');
    const { id } = await req.json();

    const redirectId = parseId(id);
    if (!redirectId) {
      return NextResponse.json({ error: 'Valid redirect ID is required' }, { status: 400 });
    }

    const existing = await prisma.redirect.findUnique({ where: { id: redirectId } });
    if (!existing) {
      return NextResponse.json({ error: 'Redirect not found' }, { status: 404 });
    }

    await prisma.redirect.delete({ where: { id: redirectId } });

    await createAuditLog({
      action: 'DELETE', entity: 'Business', entityId: redirectId.toString(),
      changes: { source: existing.source, destination: existing.destination },
      req,
    });

    invalidateRedirectCache();

    return NextResponse.json({ success: true });
  } catch (error) {
    const authResponse = handleAuthError(error);
    if (authResponse) return authResponse;
    console.error('DELETE redirects:', (error as Error).message);
    return NextResponse.json({ error: 'Failed to delete redirect' }, { status: 500 });
  }
}