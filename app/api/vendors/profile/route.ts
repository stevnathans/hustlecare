// app/api/vendor/profile/route.ts
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

    const vendor = await prisma.vendor.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: { select: { products: true } },
        analytics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
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
    } = body;

    // Slug is NOT editable after approval — admin must change it
    const updatedVendor = await prisma.vendor.update({
      where: { userId: session.user.id },
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
      },
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor profile:', error);
    return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 });
  }
}