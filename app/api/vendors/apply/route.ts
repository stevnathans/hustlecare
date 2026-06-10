// app/api/vendor/apply/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST — submit a vendor application
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const userId = session.user.id;

    // Already a vendor?
    if ((session.user as { role?: string }).role === 'vendor') {
      return NextResponse.json(
        { error: 'You are already an approved vendor.' },
        { status: 400 }
      );
    }

    // Already has a pending/approved application?
    const existing = await prisma.vendorApplication.findUnique({
      where: { userId },
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json(
          { error: 'You already have a pending application. We will review it shortly.' },
          { status: 400 }
        );
      }
      if (existing.status === 'APPROVED') {
        return NextResponse.json(
          { error: 'Your application has already been approved.' },
          { status: 400 }
        );
      }
      // REJECTED — allow re-application by updating existing record
    }

    const body = await request.json();
    const {
      businessName,
      slug,
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
      productCategories,
      businessTypes,
      pitchNote,
    } = body;

    if (!businessName?.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'Store URL slug is required.' }, { status: 400 });
    }
    if (!pitchNote?.trim()) {
      return NextResponse.json(
        { error: 'Please tell us why you want to sell on Hustlecare.' },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens.' },
        { status: 400 }
      );
    }

    // Check slug uniqueness against existing Vendor records AND other applications
    const slugTakenByVendor = await prisma.vendor.findUnique({ where: { slug } });
    const slugTakenByApp = await prisma.vendorApplication.findFirst({
      where: { slug, status: { in: ['PENDING', 'APPROVED'] }, userId: { not: userId } },
    });
    if (slugTakenByVendor || slugTakenByApp) {
      return NextResponse.json(
        { error: 'That store URL is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    const data = {
      businessName: businessName.trim(),
      slug: slug.trim(),
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
      productCategories: productCategories || [],
      businessTypes: businessTypes || [],
      pitchNote: pitchNote.trim(),
      status: 'PENDING' as const,
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null,
    };

    const application = existing
      ? await prisma.vendorApplication.update({ where: { userId }, data })
      : await prisma.vendorApplication.create({ data: { ...data, userId } });

    return NextResponse.json(application, { status: existing ? 200 : 201 });
  } catch {
    console.error('Error submitting vendor application');
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 });
  }
}

// GET — fetch current user's application status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const application = await prisma.vendorApplication.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        status: true,
        businessName: true,
        slug: true,
        reviewNote: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(application);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch application.' }, { status: 500 });
  }
}