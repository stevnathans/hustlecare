import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split("/").pop(); // Extracts ID from URL
  
      if (!id) {
        return NextResponse.json({ error: "Product ID is missing" }, { status: 400 });
      }
  
      const body = await req.json();
      const { name, description, price, image } = body;
  
      const updated = await prisma.product.update({
        where: { id: Number(id) },
        data: {
          name,
          description,
          price,
          image,
        },
      });
  
      return NextResponse.json(updated);
    } catch (error) {
      console.error("Failed to update product:", error);
      return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
    }
  }
  

  export async function DELETE(req: Request) {
    try {
      const url = new URL(req.url);
      const id = url.pathname.split("/").pop(); // Extract ID properly
  
      if (!id) {
        return NextResponse.json({ error: "Product ID is missing" }, { status: 400 });
      }
  
      await prisma.product.delete({
        where: { id: Number(id) },
      });
  
      return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Failed to delete product:", error);
      return NextResponse.json({ error: error.message || "Failed to delete product" }, { status: 500 });
    }
  }
  