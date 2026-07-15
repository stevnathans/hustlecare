// app/api/questionnaire-drafts/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the Route Context required by Next.js 15
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET — Retrieve a questionnaire draft by ID
 */
export async function GET(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    // Correctly await the params promise before using 'id'
    const { id } = await params;

    const draft = await prisma.questionnaireDraft.findUnique({
      where: { id },
    });

    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ draft }, { status: 200 });
  } catch (error) {
    console.error("Error fetching questionnaire draft:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT or PATCH — Update an existing draft (if your app uses it)
 */
export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updatedDraft = await prisma.questionnaireDraft.update({
      where: { id },
      data: {
        packageTier: body.packageTier,
        currentStep: body.currentStep,
        answers: body.answers,
        status: body.status,
      },
    });

    return NextResponse.json({ draft: updatedDraft }, { status: 200 });
  } catch (error) {
    console.error("Error updating questionnaire draft:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE — Remove a draft (if your app uses it)
 */
export async function DELETE(
  req: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    await prisma.questionnaireDraft.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting questionnaire draft:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}