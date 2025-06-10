// app/api/user/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  console.log("=== UPDATE PROFILE API CALLED ===");
  
  try {
    // Check session
    const session = await getServerSession(authOptions);
    console.log("Session:", session ? "Found" : "Not found");
    console.log("User email:", session?.user?.email);

    if (!session?.user?.email) {
      console.log("No session or email, returning 401");
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
      console.log("Request body:", body);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return NextResponse.json(
        { message: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { name, phone, image } = body;
    console.log("Extracted fields:", { name, phone, image });

    // Validate name
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      console.log("Name validation failed");
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    // Validate image URL if provided - FIXED VALIDATION
    if (image && typeof image === "string" && image.trim().length > 0) {
      const trimmedImage = image.trim();
      
      // Check if it's a relative path (starts with /) or a full URL
      const isRelativePath = trimmedImage.startsWith('/');
      const isFullUrl = trimmedImage.startsWith('http://') || trimmedImage.startsWith('https://');
      
      if (!isRelativePath && !isFullUrl) {
        console.log("Image URL validation failed - not a valid path or URL");
        return NextResponse.json(
          { message: "Invalid image URL format" },
          { status: 400 }
        );
      }
      
      // If it's a full URL, validate it
      if (isFullUrl) {
        try {
          new URL(trimmedImage);
          console.log("Full URL validation passed");
        } catch {
          console.log("Full URL validation failed");
          return NextResponse.json(
            { message: "Invalid image URL" },
            { status: 400 }
          );
        }
      } else {
        // For relative paths, just ensure it looks like a valid path
        console.log("Relative path validation passed");
      }
    }

    // Check if user exists first
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    console.log("Existing user found:", existingUser ? "Yes" : "No");
    
    if (!existingUser) {
      console.log("User not found in database");
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData = {
      name: name.trim(),
      phone: phone?.trim() || null,
      image: image?.trim() || null,
    };
    
    console.log("Update data:", updateData);

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: updateData,
    });

    console.log("User updated successfully:", updatedUser);

    return NextResponse.json({ 
      message: "Profile updated successfully", 
      user: updatedUser 
    });
    
  } catch (error) {
    console.error("=== API ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error instanceof Error ? error.message : "Unknown error");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}