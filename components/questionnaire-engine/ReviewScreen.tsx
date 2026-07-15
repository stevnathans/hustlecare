/* eslint-disable @typescript-eslint/no-explicit-any */
// components/questionnaire-engine/ReviewScreen.tsx
"use client";

import { useQuestionnaire } from "./engine/context";
import { getDeep } from "@/lib/questionnaires/get-deep";
import type { FieldConfig } from "@/lib/questionnaires/types";

function formatValue(field: FieldConfig, value: any): string {
  if (value === undefined || value === null || value === "") return "—";

  if (field.type === "dynamic-list") {
    const items = Array.isArray(value) ? value : [];
    if (items.length === 0) return "None added";
    return `${items.length} ${items.length === 1 ? (field.itemLabel ?? "item") : `${field.itemLabel ?? "item"}s`} added`;
  }

  if (field.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    const labels = selected.map((v) => field.options?.find((o) => o.value === v)?.label ?? v);
    return labels.length ? labels.join(", ") : "None selected";
  }

  if (field.type === "select" || field.type === "radio-cards") {
    return field.options?.find((o) => o.value === value)?.label ?? String(value);
  }

  if (field.type === "currency") {
    return `${field.currencySymbol ?? "KSh"} ${Number(value).toLocaleString()}`;
  }

  return String(value);
}

export function ReviewScreen({
  onSubmit,
  onEditStep,
}: {
  onSubmit: () => Promise<void>;
  onEditStep: (index: number) => void;
}) {
  const { config, answers, visibleSteps, packageTier, status, errorMessage } = useQuestionnaire();

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Review your answers</h2>
        <p className="text-sm text-slate-500">
          Check everything looks right before you submit. You can edit any section below.
        </p>
      </div>

      {config.packageTiers && packageTier && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5">
          <div>
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">Selected Package</div>
            <div className="text-sm font-bold text-slate-800">
              {config.packageTiers.find((t) => t.id === packageTier)?.name ?? packageTier}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {visibleSteps.map((step, index) => {
          const answersWithTier = { ...answers, packageTier };
          const visibleFields = step.fields.filter((f) => !f.visibleIf || f.visibleIf(answersWithTier));
          if (visibleFields.length === 0) return null;

          return (
            <div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">
                  {step.icon} {config.reviewSectionLabels?.[step.id] ?? step.title}
                </h3>
                <button
                  onClick={() => onEditStep(index)}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Edit
                </button>
              </div>
              <dl className="space-y-1.5">
                {visibleFields.map((field) => (
                  <div key={field.name} className="flex justify-between gap-4 text-sm">
                    <dt className="text-slate-400">{field.label}</dt>
                    <dd className="text-slate-700 font-medium text-right">
                      {formatValue(field, getDeep(answers, field.name))}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {errorMessage && (
        <p className="mt-4 text-sm text-red-500 text-center">{errorMessage}</p>
      )}

      <button
        onClick={onSubmit}
        disabled={status === "submitting"}
        className="w-full mt-8 py-3.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white transition-colors shadow-md shadow-emerald-100"
      >
        {status === "submitting" ? "Submitting…" : "Submit Order"}
      </button>
    </div>
  );
}