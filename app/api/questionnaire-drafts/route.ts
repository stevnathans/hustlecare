// app/api/questionnaire-drafts/route.ts
//
// POST — create a new draft for a given serviceSlug. Called once when a
// visitor lands on a questionnaire route with no existing draftId in
// localStorage.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidServiceSlug } from "@/lib/questionnaires/registry";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body?.serviceSlug || !isValidServiceSlug(body.serviceSlug)) {
    return NextResponse.json({ error: "Invalid or missing serviceSlug" }, { status: 400 });
  }

  const draft = await prisma.questionnaireDraft.create({
    data: {
      serviceSlug: body.serviceSlug,
      packageTier: body.packageTier ?? null,
      currentStep: 0,
      answers: {},
      status: "draft",
    },
  });

  return NextResponse.json({ draft }, { status: 201 });
}