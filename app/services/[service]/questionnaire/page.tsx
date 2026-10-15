// app/services/[service]/questionnaire/page.tsx
//
// Server wrapper: checks the service exists and loads its packages and
// prices from the catalog (admin → Services), then hands them to the wizard.
// The wizard itself stays a client component, as before.

import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isValidServiceSlug } from "@/lib/questionnaires/registry";
import { getCatalogPlans } from "@/lib/services/catalog";
import QuestionnaireClient from "./QuestionnaireClient";

export const revalidate = 60;

// The wizard is a working form, not a page for search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ServiceQuestionnairePage({ params }: { params: Promise<{ service: string }> }) {
  const { service } = await params;
  if (!isValidServiceSlug(service)) notFound();

  const plans = await getCatalogPlans(service);

  return (
    <Suspense fallback={null}>
      <QuestionnaireClient service={service} plans={plans} />
    </Suspense>
  );
}