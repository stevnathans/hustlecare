"use client";

import { use } from "react";
import { useSearchParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useState } from "react";
import { getQuestionnaireConfig } from "@/lib/questionnaires/registry";
import { QuestionnaireProvider } from "@/components/questionnaire-engine/engine/context";
import { WizardShell } from "@/components/questionnaire-engine/WizardShell";

export default function ServiceQuestionnairePage({ 
  params 
}: { 
  params: Promise<{ service: string }> 
}) {
  const resolvedParams = use(params);
  const config = getQuestionnaireConfig(resolvedParams.service);
  
  const searchParams = useSearchParams();
  const tierFromUrl = searchParams.get("package");

  const [selectedTier, setSelectedTier] = useState<string | null>(tierFromUrl);

  if (!config) {
    notFound();
  }

  // Fallback fallback title if config isn't loaded yet, otherwise dynamic title
  const pageTitle = config 
    ? `${config.serviceName} Questionnaire` 
    : "Loading Questionnaire...";

  const needsTierSelection = !!config.packageTiers && !selectedTier;

  if (needsTierSelection) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
        {/* React 19 automatically hoists this <title> to the document <head> */}
        <title>{pageTitle}</title>

        <div className="max-w-2xl w-full">
          <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-2">
            Choose your {config.serviceName} package
          </h1>
          <p className="text-slate-500 text-center mb-8">You can review full details before submitting.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {config.packageTiers!.map((tier) => (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className="text-left rounded-2xl border-2 border-slate-200 hover:border-emerald-400 bg-white p-5 transition-colors"
              >
                <div className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1">{tier.tag}</div>
                <div className="font-extrabold text-slate-900 mb-1">{tier.name}</div>
                <div className="text-lg font-bold text-slate-800 mb-3">{tier.priceLabel}</div>
                <ul className="space-y-1">
                  {tier.includes.slice(0, 4).map((item) => (
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
      {/* React 19 automatically hoists this <title> to the document <head> */}
      <title>{pageTitle}</title>
      <WizardShell />
    </QuestionnaireProvider>
  );
}