import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const requirementName = url.searchParams.get('requirementName');
    
    let products;
    
    if (requirementName) {
      products = await prisma.product.findMany({
        where: {
          name: {
            contains: requirementName,
            mode: 'insensitive',
          },
        },
        include: {
          vendor: true,
        },
        orderBy: {
          price: 'asc',
        },
      });
    } else {
      products = await prisma.product.findMany({
        include: {
          vendor: true,
        },
        orderBy: {
          price: 'asc',
        },
      });
    }
    
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, image, url, vendorId } = body;
    
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        image,
        url,
        vendorId: vendorId ? parseInt(vendorId) : null,
      },
      include: {
        vendor: true,
      },
    });
    
    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" }, 
      { status: 500 }
    );
  }
}