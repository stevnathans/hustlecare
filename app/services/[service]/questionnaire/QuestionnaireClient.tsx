"use client";

// app/services/[service]/questionnaire/QuestionnaireClient.tsx
//
// The questionnaire wizard (previously the whole page). Package names, prices
// and highlights in the picker come from the catalog; the questions themselves
// still come from the service's config in code.

import { useState } from "react";
import { useSearchParams, notFound } from "next/navigation";
import { getQuestionnaireConfig } from "@/lib/questionnaires/registry";
import { QuestionnaireProvider } from "@/components/questionnaire-engine/engine/context";
import { WizardShell } from "@/components/questionnaire-engine/WizardShell";
import type { PricingPlan } from "@/lib/services/catalog";

interface TierOption {
  id: string;
  name: string;
  tag: string;
  price: string;
  items: string[];
}

export default function QuestionnaireClient({ service, plans }: { service: string; plans: PricingPlan[] | null }) {
  const config = getQuestionnaireConfig(service);
  const searchParams = useSearchParams();

  // Package choices: the catalog when it has any, otherwise the config's own list.
  const options: TierOption[] =
    plans && plans.length > 0
      ? plans.map((p) => ({ id: p.id, name: p.name, tag: p.tag, price: p.price, items: p.items }))
      : (config?.packageTiers ?? []).map((t) => ({
          id: t.id,
          name: t.name,
          tag: t.tag,
          price: t.priceLabel ?? "",
          items: t.includes ?? [],
        }));

  // Only trust a ?package= value that is a real package.
  const tierFromUrl = searchParams.get("package");
  const validUrlTier = tierFromUrl && options.some((o) => o.id === tierFromUrl) ? tierFromUrl : null;
  const [selectedTier, setSelectedTier] = useState<string | null>(validUrlTier);

  if (!config) notFound();

  const pageTitle = `${config.serviceName} Questionnaire`;
  const needsTierSelection = options.length > 0 && !selectedTier;

  if (needsTierSelection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        <title>{pageTitle}</title>

        <div className="max-w-3xl w-full">
          <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-2">Choose your {config.serviceName} package</h1>
          <p className="text-slate-500 text-center mb-8">You can review full details before submitting.</p>
          <div className={`grid gap-4 ${options.length >= 3 ? "sm:grid-cols-3" : options.length === 2 ? "sm:grid-cols-2" : ""}`}>
            {options.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className="text-left rounded-2xl border-2 border-slate-200 hover:border-emerald-400 bg-white p-5 transition-colors"
              >
                {tier.tag && <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">{tier.tag}</div>}
                <div className="font-extrabold text-slate-900 mb-1">{tier.name}</div>
                {tier.price && <div className="text-lg font-bold text-slate-800 mb-3">{tier.price}</div>}
                <ul className="space-y-1">
                  {tier.items.slice(0, 4).map((item) => (
                    <li key={item} className="text-xs text-slate-500">• {item}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuestionnaireProvider config={config} initialPackageTier={selectedTier}>
      <title>{pageTitle}</title>
      <WizardShell />
    </QuestionnaireProvider>
  );
}