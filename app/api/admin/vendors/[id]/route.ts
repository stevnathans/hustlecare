// app/api/admin/vendors/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { toTitleCase, generateUniqueVendorSlug } from '@/lib/vendor-utils';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requirePermission('vendors.update');
    const { id } = await params;
    const vendorId = parseInt(id);

    const existing = await prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!existing) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 });

    const body = await request.json();

    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'Vendor name cannot be empty.' }, { status: 400 });
    }

    let slug = existing.slug;
    if (body.slug !== undefined && body.slug.trim() && body.slug.trim() !== existing.slug) {
      slug = await generateUniqueVendorSlug(body.slug.trim(), body.slug.trim());
    }

    const name = body.name?.trim() ? toTitleCase(body.name.trim()) : existing.name;

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name,
        slug,
        website: body.website !== undefined ? (body.website?.trim() || null) : undefined,
        logo: body.logo !== undefined ? (body.logo?.trim() || null) : undefined,
        tagline: body.tagline !== undefined ? (body.tagline?.trim() || null) : undefined,
        description: body.description !== undefined ? (body.description?.trim() || null) : undefined,
        coverImage: body.coverImage !== undefined ? (body.coverImage?.trim() || null) : undefined,
        location: body.location !== undefined ? (body.location?.trim() || null) : undefined,
        phone: body.phone !== undefined ? (body.phone?.trim() || null) : undefined,
        twitterUrl: body.twitterUrl !== undefined ? (body.twitterUrl?.trim() || null) : undefined,
        instagramUrl: body.instagramUrl !== undefined ? (body.instagramUrl?.trim() || null) : undefined,
        facebookUrl: body.facebookUrl !== undefined ? (body.facebookUrl?.trim() || null) : undefined,
        linkedinUrl: body.linkedinUrl !== undefined ? (body.linkedinUrl?.trim() || null) : undefined,
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      entity: 'Vendor',
      entityId: vendorId.toString(),
      changes: { fields: Object.keys(body), updatedBy: admin.id },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'That slug, or that exact name + website combination, is already taken.' },
        { status: 409 }
      );
    }
    console.error('Error updating vendor:', error);
    return NextResponse.json({ error: 'Failed to update vendor.' }, { status: 500 });
  }
}