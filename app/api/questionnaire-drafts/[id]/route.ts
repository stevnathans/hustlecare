// app/api/questionnaire-drafts/[id]/route.ts
//
// GET   — resume: fetch a draft by id (used when loading ?resume=<id>)
// PATCH — autosave: called on every step advance with the accumulated
//         answers object, current step index, and package tier.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const draft = await prisma.questionnaireDraft.findUnique({ where: { id: params.id } });

  if (!draft) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  return NextResponse.json({ draft });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await prisma.questionnaireDraft.findUnique({ where: { id: params.id } });
  if (!existing) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }
  if (existing.status === "submitted") {
    return NextResponse.json({ error: "Draft already submitted" }, { status: 409 });
  }

  const draft = await prisma.questionnaireDraft.update({
    where: { id: params.id },
    data: {
      ...(body.packageTier !== undefined && { packageTier: body.packageTier }),
      ...(body.currentStep !== undefined && { currentStep: body.currentStep }),
      ...(body.answers !== undefined && { answers: body.answers }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
      ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone }),
    },
  });

  return NextResponse.json({ draft });
}