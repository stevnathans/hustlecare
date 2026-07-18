// app/api/vendors/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePermission, createAuditLog } from '@/lib/admin-utils';
import { toTitleCase, generateUniqueVendorSlug } from '@/lib/vendor-utils';

// GET all vendors — used by admin product forms/dropdowns too, so this
// intentionally returns every vendor regardless of claim status.
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

// POST — admin-created vendor profile. Bypasses VendorApplication entirely:
// no email required, no verification, no welcome email, auto-approved.
// userId stays null so it can be handed over via the claim flow later.
export async function POST(request: Request) {
  try {
    const admin = await requirePermission('vendors.create');

    const body = await request.json();
    const rawName: string | undefined = body.name?.trim();

    if (!rawName) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    const name = toTitleCase(rawName);
    const slug = await generateUniqueVendorSlug(name, body.slug);

    const vendor = await prisma.vendor.create({
      data: {
        name,
        slug,
        website: body.website?.trim() || null,
        logo: body.logo?.trim() || null,
        tagline: body.tagline?.trim() || null,
        description: body.description?.trim() || null,
        coverImage: body.coverImage?.trim() || null,
        location: body.location?.trim() || null,
        phone: body.phone?.trim() || null,
        twitterUrl: body.twitterUrl?.trim() || null,
        instagramUrl: body.instagramUrl?.trim() || null,
        facebookUrl: body.facebookUrl?.trim() || null,
        linkedinUrl: body.linkedinUrl?.trim() || null,
        userId: null,
        status: 'ACTIVE',
        isVerified: false,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      entity: 'Vendor',
      entityId: vendor.id.toString(),
      changes: { name: vendor.name, createdBy: admin.id, adminCreated: true },
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'A vendor with this exact name and website already exists.' },
        { status: 409 }
      );
    }
    console.error('Error creating vendor:', error);
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}