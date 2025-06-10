import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is missing" }, 
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const { name, description, price, image, url: productUrl, vendorId } = body;
    
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: {
        name,
        description,
        price,
        image,
        url: productUrl,
        vendorId: vendorId ? parseInt(vendorId) : null,
      },
      include: {
        vendor: true,
      },
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update product" }, 
      { status: 500 }
    );
  }
}
 
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    
    if (!id) {
      return NextResponse.json(
        { error: "Product ID is missing" }, 
        { status: 400 }
      );
    }
    
    // First check if product exists
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    await prisma.product.delete({
      where: { id: Number(id) },
    });
    
    return NextResponse.json(
      { message: "Product deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete product" }, 
      { status: 500 }
    );
  }
}