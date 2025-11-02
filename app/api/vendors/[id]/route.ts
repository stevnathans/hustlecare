import { NextResponse } from 'next/server';
import {prisma} from '@/lib/prisma';

// GET single vendor
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    const vendor = await prisma.vendor.findUnique({
      where: { id: parseInt(id) },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(vendor);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PATCH update vendor
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const data = await request.json();
    
    // Await params in Next.js 15+
    const { id } = await params;

    const updatedVendor = await prisma.vendor.update({
      where: { id: parseInt(id) },
      data,
    });

    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE vendor
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    // Check if vendor has associated products
    const productsCount = await prisma.product.count({
      where: { vendorId: parseInt(id) },
    });

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with associated products' },
        { status: 400 }
      );
    }

    await prisma.vendor.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json(
      { message: 'Vendor deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}