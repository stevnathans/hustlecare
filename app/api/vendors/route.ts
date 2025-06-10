import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';
import { Vendor } from '@prisma/client';

// GET all vendors
export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(vendors);
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
    const data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'> = await request.json();
    
    // Validate required fields
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
    console.error('Error creating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to create vendor' },
      { status: 500 }
    );
  }
}