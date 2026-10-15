// app/api/services/[slug]/plans/route.ts
//
// Public: the active packages (name, price, deposit) for a service, for the
// questionnaire's review screen.

import { NextResponse } from "next/server";
import { getCatalogPlans } from "@/lib/services/catalog";

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const plans = await getCatalogPlans(slug);
  return NextResponse.json({ plans: plans ?? [] });
}