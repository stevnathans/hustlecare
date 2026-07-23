// app/api/vendors/profile/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET — fetch own vendor profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    if (String(session.user.role).toLowerCase() !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required.' }, { status: 403 });
    }

    // No top-level `select` here, so all scalar fields are returned
    // automatically — including servesAllCounties, appealStatus,
    // appealMessage, issueResolved, appealedAt, appealResponse,
    // appealRespondedAt. We only need to add the `counties` relation
    // (and keep `_count`/`analytics`) via `include`.
    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: { select: { products: true } },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        counties: { select: { countyId: true } },
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch profile.' }, { status: 500 });
  }
}

// PATCH — update own vendor profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
    if (String(session.user.role).toLowerCase() !== 'vendor') {
      return NextResponse.json({ error: 'Vendor access required.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      tagline,
      description,
      website,
      logo,
      coverImage,
      location,
      phone,
      twitterUrl,
      instagramUrl,
      facebookUrl,
      linkedinUrl,
      servesAllCounties,
      countyIds,
    } = body;

    // Look up the vendor id up front — we need it for the VendorCounty
    // join-table sync below, and it lets us 404 cleanly before touching
    // anything else.
    const existing = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Vendor profile not found.' }, { status: 404 });
    }

    // Normalise the incoming county list (dedupe, only when actually provided).
    const nextCountyIds: number[] | undefined = Array.isArray(countyIds)
      ? Array.from(new Set(countyIds.map((id: number) => Number(id)).filter((id: number) => Number.isFinite(id))))
      : undefined;

    // Slug is NOT editable after approval — admin must change it.
    // Appeal fields (appealStatus, appealMessage, issueResolved, etc.) are
    // intentionally NOT accepted here — those are only writable via
    // PATCH /api/vendors/appeal (vendor) and
    // POST /api/admin/vendors/[id]/appeal (admin).
    const updatedVendor = await prisma.$transaction(async (tx) => {
      const vendor = await tx.vendor.update({
        where: { id: existing.id },
        data: {
          name: name?.trim() || undefined,
          tagline: tagline?.trim() || null,
          description: description?.trim() || null,
          website: website?.trim() || null,
          logo: logo?.trim() || null,
          coverImage: coverImage?.trim() || null,
          location: location?.trim() || null,
          phone: phone?.trim() || null,
          twitterUrl: twitterUrl?.trim() || null,
          instagramUrl: instagramUrl?.trim() || null,
          facebookUrl: facebookUrl?.trim() || null,
          linkedinUrl: linkedinUrl?.trim() || null,
          servesAllCounties:
            typeof servesAllCounties === 'boolean' ? servesAllCounties : undefined,
        },
      });

      // Replace-on-update for county coverage, same pattern as bulkPricing
      // in admin/products/[id]/route.ts: drop rows no longer selected,
      // add rows that are new, leave the rest untouched.
      if (nextCountyIds !== undefined) {
        await tx.vendorCounty.deleteMany({
          where: {
            vendorId: vendor.id,
            countyId: { notIn: nextCountyIds },
          },
        });

        if (nextCountyIds.length > 0) {
          await tx.vendorCounty.createMany({
            data: nextCountyIds.map((countyId) => ({ vendorId: vendor.id, countyId })),
            skipDuplicates: true,
          });
        }
      }

      return tx.vendor.findUniqueOrThrow({
        where: { id: vendor.id },
        include: { counties: { select: { countyId: true } } },
      });
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}