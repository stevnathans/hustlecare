// app/api/vendors/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Vendor } from '@prisma/client';
import { requirePermission } from '@/lib/admin-utils';

// GET all vendors
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
    return NextResponse.json(vendors);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}

// POST create new vendor
export async function POST(request: Request) {
  try {
    await requirePermission('vendors.create');

    const data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: 'Vendor name is required' },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.create({
      data,
    });

    return NextResponse.json(vendor, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (error.message === 'Forbidden')    return NextResponse.json({ error: 'Forbidden' },    { status: 403 });
    }
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}