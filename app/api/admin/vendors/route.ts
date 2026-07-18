// app/api/admin/vendors/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const VENDOR_SELECT = {
  id: true,
  name: true,
  slug: true,
  tagline: true,
  description: true,
  website: true,
  logo: true,
  coverImage: true,
  location: true,
  phone: true,
  twitterUrl: true,
  instagramUrl: true,
  facebookUrl: true,
  linkedinUrl: true,
  userId: true,
  status: true,
  suspendReason: true,
  suspendedAt: true,
  isVerified: true,
  createdAt: true,
  _count: { select: { products: true } },
  products: { where: { status: 'ACTIVE' as const }, select: { id: true } },

  // Suspension appeals
  appealStatus: true,
  appealMessage: true,
  issueResolved: true,
  appealedAt: true,
  appealResponse: true,
  appealRespondedAt: true,

  // Claim requests
  claimStatus: true,
  claimRequestedById: true,
  claimMessage: true,
  claimedAt: true,
  claimRejectionReason: true,
  claimRequestedBy: { select: { id: true, name: true, email: true, phone: true } },
} as const;

// Same shape used for the User the admin already renders in the
// "Applicant" column, so claimed vendors slot in without special-casing.
const OWNER_USER_SELECT = { id: true, name: true, email: true, image: true, createdAt: true } as const;

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const wantsApplications = !status || (status !== 'UNCLAIMED' && status !== 'CLAIMED');
    const wantsUnclaimed = !status || status === 'UNCLAIMED';
    const wantsClaimed = !status || status === 'CLAIMED';

    const [applications, unclaimedVendors, claimedVendors] = await Promise.all([
      wantsApplications
        ? prisma.vendorApplication.findMany({
            where: status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {},
            include: {
              user: { select: OWNER_USER_SELECT },
              vendor: { select: VENDOR_SELECT },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      // Truly unclaimed: admin-created, never went through an application, no owner yet.
      wantsUnclaimed
        ? prisma.vendor.findMany({
            where: { application: { is: null }, userId: null },
            select: VENDOR_SELECT,
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      // Claimed: admin-created, no application, but now has a real owner
      // (either via the claim flow, or manually linked some other way).
      wantsClaimed
        ? prisma.vendor.findMany({
            where: { application: { is: null }, userId: { not: null } },
            select: { ...VENDOR_SELECT, user: { select: OWNER_USER_SELECT } },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const shapedApplications = applications.map(app => ({
      ...app,
      vendor: app.vendor
        ? { ...app.vendor, activeProducts: app.vendor.products.length, products: undefined }
        : null,
    }));

    // Normalise standalone vendors into the same row shape the table uses,
    // with a negative synthetic id so it can never collide with a real
    // VendorApplication id.
    const shapedUnclaimed = unclaimedVendors.map(v => ({
      id: -v.id,
      status: 'UNCLAIMED' as const,
      businessName: v.name,
      slug: v.slug,
      tagline: v.tagline,
      description: v.description,
      website: v.website,
      location: v.location,
      phone: v.phone,
      productCategories: [] as string[],
      businessTypes: [] as string[],
      pitchNote: null as string | null,
      reviewNote: null as string | null,
      createdAt: v.createdAt,
      user: null,
      vendor: { ...v, activeProducts: v.products.length, products: undefined },
    }));

    const shapedClaimed = claimedVendors.map(v => ({
      id: -v.id - 1_000_000_000, // disjoint from both real ids and the unclaimed synthetic ids
      status: 'CLAIMED' as const,
      businessName: v.name,
      slug: v.slug,
      tagline: v.tagline,
      description: v.description,
      website: v.website,
      location: v.location,
      phone: v.phone,
      productCategories: [] as string[],
      businessTypes: [] as string[],
      pitchNote: null as string | null,
      reviewNote: null as string | null,
      createdAt: v.createdAt,
      user: v.user,
      vendor: { ...v, activeProducts: v.products.length, products: undefined, user: undefined },
    }));

    const merged = [...shapedApplications, ...shapedUnclaimed, ...shapedClaimed].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(merged);
  } catch (error) {
    console.error('Error fetching vendor applications:', error);
    return NextResponse.json({ error: 'Failed to fetch applications.' }, { status: 500 });
  }
}