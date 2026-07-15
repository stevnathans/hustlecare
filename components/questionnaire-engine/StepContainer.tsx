// components/questionnaire-engine/StepContainer.tsx
"use client";

import type { StepConfig } from "@/lib/questionnaires/types";
import { useQuestionnaire } from "./engine/context";
import { FieldRenderer } from "./fields/FieldRenderer";

export function StepContainer({ step }: { step: StepConfig }) {
  const { answers, stepValidationErrors, packageTier } = useQuestionnaire();

  const answersWithTier = { ...answers, packageTier };
  const visibleFields = step.fields.filter(
    (field) => !field.visibleIf || field.visibleIf(answersWithTier)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      <div className="mb-8">
        {step.icon && <div className="text-3xl mb-3">{step.icon}</div>}
        <h2 className="text-xl font-bold text-slate-900">{step.title}</h2>
        {step.description && (
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{step.description}</p>
        )}
      </div>

      <div className="space-y-6">
        {visibleFields.map((field) => (
          <FieldRenderer key={field.name} field={field} error={stepValidationErrors[field.name]} />
        ))}
      </div>
    </div>
  );
}